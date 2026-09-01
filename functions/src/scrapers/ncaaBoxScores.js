// ============================================================================
// functions/src/scrapers/ncaaBoxScores.js
//
// Fetches per-game player stats from the NCAA API wrapper (henrygd) and
// writes them to /games/ncaa-{gameId} alongside what ncaaScores.js already
// writes. Aggregates season totals into /playerStats/{playerId}.
//
// Replaces the deprecated boxscores.js (Sidearm + WMT pipeline).
//
// Player ID format: ncaa-{teamId}-{firstname-lastname-slug}
// Example: ncaa-43901-mac-haley
//
// Modes:
//   fetchAllBoxScores()   — cron-driven, processes live + recent unprocessed finals
//   backfillBoxScores()   — one-time, processes ALL final games regardless of state
//   processOneBoxScore()  — single-game fetch for HTTP test trigger
// ============================================================================

import fetch from 'node-fetch'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../firebase.js'
import { seasonForGameDate, currentSeason, activeSeasons } from '../season.js'
import { contributed } from '../statFields.js'
const BOXSCORE_API_BASE = 'https://ncaa-api.henrygd.me/game'
const CONCURRENCY = 3            // public API rate limit is 5/sec; stay under
const REQUEST_DELAY_MS = 250     // per-worker throttle

// ── fetch JSON with timeout + retry ───────────────────────────────────────────
async function fetchJson(url, retries = 2, timeoutMs = 12000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CreaseFeed/1.0; +https://creasefeed.com)',
          'Accept':     'application/json',
        }
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
      return await res.json()
    } catch (err) {
      clearTimeout(timeout)
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

// ── log error to Firestore ────────────────────────────────────────────────────
async function logError(context, error) {
  try {
    await db.collection('errors').add({
      context,
      error:     error.message || String(error),
      timestamp: Date.now(),
      date:      new Date().toISOString(),
    })
  } catch { /* never throw on logging failure */ }
}

// ── name normalization ───────────────────────────────────────────────────────
// NCAA returns names in ALL CAPS ("MAC HALEY"). Convert to "Mac Haley".
function toProperCase(s) {
  if (!s) return ''
  return s.toLowerCase().replace(/(^|\s|-|')([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

// Build a stable playerId slug from name parts.
function slugifyName(firstName, lastName) {
  const f = (firstName || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const l = (lastName  || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${f}-${l}`.replace(/^-+|-+$/g, '').replace(/-+/g, '-')
}

// ── parse one PlayerStatsLacrosse block into our flat schema ────────────────
function parsePlayer(p, team) {
  const firstName = toProperCase(p.firstName)
  const lastName  = toProperCase(p.lastName)
  const playerId  = `ncaa-${team.teamId}-${slugifyName(firstName, lastName)}`

  const goals   = parseInt(p.goals, 10)   || 0
  const assists = parseInt(p.assists, 10) || 0

  return {
    playerId,
    firstName,
    lastName,
    name:     `${firstName} ${lastName}`.trim(),
    number:   parseInt(p.number, 10) || 0,
    position: p.position || '',
    starter:  p.starter === true,
    participated: p.participated === true,

    teamId:   String(team.teamId),
    teamName: team.nameShort || team.nameFull || '',
    teamSeo:  team.seoname   || '',

    // Per-game offense
    goals,
    assists,
    points:            goals + assists,
    shots:             parseInt(p.shots, 10)              || 0,
    sog:               parseInt(p.shotsOnGoal, 10)        || 0,
    freePositionShots: parseInt(p.freePositionShots, 10)  || 0,
    groundBalls:       parseInt(p.groundBalls, 10)        || 0,
    drawControls:      parseInt(p.drawControls, 10)       || 0,
    turnovers:         parseInt(p.turnovers, 10)          || 0,
    causedTurnovers:   parseInt(p.causedTurnovers, 10)    || 0,

    // Goal type breakdown
    gameWinningGoals:  parseInt(p.goalTypes?.gameWinningGoals, 10)  || 0,
    unassistedGoals:   parseInt(p.goalTypes?.unassistedGoals, 10)   || 0,
    firstGoals:        parseInt(p.goalTypes?.firstGoals, 10)        || 0,
    overtimeGoals:     parseInt(p.goalTypes?.overtimeGoals, 10)     || 0,
    emptyNetGoals:     parseInt(p.goalTypes?.emptyNetGoals, 10)     || 0,
    powerplayGoals:    parseInt(p.goalTypes?.powerplayGoals, 10)    || 0,
    shortHandedGoals:  parseInt(p.goalTypes?.shortHandedGoals, 10)  || 0,
    freePositionGoals: parseInt(p.goalTypes?.freePositionGoals, 10) || 0,

    // Penalties
    penaltyCount:    parseInt(p.penalties?.count, 10)   || 0,
    penaltyMinutes:  parseFloat(p.penalties?.minutes)   || 0,
    majorPenalties:  parseInt(p.penalties?.major, 10)   || 0,
    minorPenalties:  parseInt(p.penalties?.minor, 10)   || 0,

    // Goalie. The API sends 12 fields in this block; we previously kept 5 and
    // dropped the rest. NOTE: men's box scores use position 'g', women's use
    // 'gk', so isGoalie was always false for men's -- derive it from the block
    // instead of the position string.
    isGoalie:           !!p.goalie && (p.position === 'gk' || p.position === 'g'),
    goalieMinutes:      parseInt(p.goalie?.minutesPlayed, 10) || 0,
    saves:              parseInt(p.goalie?.saves, 10)         || 0,
    goalsAllowed:       parseInt(p.goalie?.goalsAllowed, 10)  || 0,
    shutouts:           parseInt(p.goalie?.shutouts, 10)      || 0,
    goalieGamesStarted: p.goalie?.gamesStarted === '1' ? 1 : 0,
    goalieGamesPlayed:  parseInt(p.goalie?.gamesPlayed, 10)   || 0,
    goalieLosses:       parseInt(p.goalie?.losses, 10)        || 0,
    combinedShutouts:   parseInt(p.goalie?.combinedShutouts, 10)        || 0,
    ppGoalsAllowed:     parseInt(p.goalie?.powerplayGoalsAllowed, 10)   || 0,
    shGoalsAllowed:     parseInt(p.goalie?.shortHandedGoalsAllowed, 10) || 0,
    enGoalsAllowed:     parseInt(p.goalie?.emptyNetGoalsAllowed, 10)    || 0,
    soGoalsAllowed:     parseInt(p.goalie?.shootoutGoalsAllowed, 10)    || 0,
  }
}

// ── parse TeamStatsLacrosse into our team-level schema ──────────────────────
function parseTeamStats(t) {
  if (!t) return null
  return {
    goals:           parseInt(t.goals, 10)           || 0,
    assists:         parseInt(t.assists, 10)         || 0,
    shots:           parseInt(t.shots, 10)           || 0,
    sog:             parseInt(t.shotsOnGoal, 10)     || 0,
    groundBalls:     parseInt(t.groundBalls, 10)     || 0,
    turnovers:       parseInt(t.turnovers, 10)       || 0,
    causedTurnovers: parseInt(t.causedTurnovers, 10) || 0,
    // Team-level goalie data is present on 100% of games (vs 10% at player
    // level), so keep all of it -- this is the basis for team-defense stats.
    saves:           parseInt(t.goalie?.saves, 10)        || 0,
    goalsAllowed:    parseInt(t.goalie?.goalsAllowed, 10) || 0,
    goalieMinutes:   parseInt(t.goalie?.minutesPlayed, 10)          || 0,
    shutouts:        parseInt(t.goalie?.shutouts, 10)               || 0,
    ppGoalsAllowed:  parseInt(t.goalie?.powerplayGoalsAllowed, 10)  || 0,
    shGoalsAllowed:  parseInt(t.goalie?.shortHandedGoalsAllowed, 10)|| 0,
    enGoalsAllowed:  parseInt(t.goalie?.emptyNetGoalsAllowed, 10)   || 0,
    powerPlayGoals:  parseInt(t.powerPlay?.goals, 10)         || 0,
    powerPlayOpps:   parseInt(t.powerPlay?.opportunities, 10) || 0,
    penaltyCount:    parseInt(t.penalties?.count, 10) || 0,
    penaltyMinutes:  parseFloat(t.penalties?.minutes) || 0,
  }
}

// ── core: fetch + write a single game's box score ───────────────────────────
async function processBoxScoreDoc(gameDocSnap) {
  const data = gameDocSnap.data()
  // Derive ncaaGameId from the doc ID (ncaa-{gameId}) since that's how
  // ncaaScores.js writes the docs. Fall back to data.ncaaGameId if set.
  const docId = gameDocSnap.id
  const ncaaGameId = data.ncaaGameId
    || (docId.startsWith('ncaa-') ? docId.slice(5) : null)
  if (!ncaaGameId) return { skipped: true, reason: 'no-ncaaGameId' }

  const url = `${BOXSCORE_API_BASE}/${ncaaGameId}/boxscore`
  let json
  try {
    json = await fetchJson(url)
  } catch (err) {
    await logError(`boxscore:${ncaaGameId}`, err)
    return { error: true, reason: err.message }
  }

  // Validate sport — only process lacrosse boxscores
  if (json.sportCode !== 'MLA' && json.sportCode !== 'WLA') {
    return { skipped: true, reason: `wrong sport: ${json.sportCode}` }
  }

  const teams = Array.isArray(json.teams) ? json.teams : []
  const teamBoxes = Array.isArray(json.teamBoxscore) ? json.teamBoxscore : []
  if (teams.length !== 2 || teamBoxes.length !== 2) {
    return { skipped: true, reason: `unexpected team count (${teams.length}/${teamBoxes.length})` }
  }

  // Map teamId → team metadata for quick lookup
  const teamMap = {}
  for (const t of teams) teamMap[String(t.teamId)] = t

  // Build flat playerStats array + role-keyed teamStats
  const playerStats = []
  const teamStats = { home: null, away: null }

  for (const tb of teamBoxes) {
    const team = teamMap[String(tb.teamId)]
    if (!team) continue
    const role = team.isHome ? 'home' : 'away'

    for (const p of (tb.playerStats || [])) {
      if (!p.firstName && !p.lastName) continue
      const parsed = parsePlayer(p, team)
      parsed.role = role
      playerStats.push(parsed)
    }

    teamStats[role] = parseTeamStats(tb.teamStats)
  }

  // Merge box score data into the existing game doc
  const update = {
    playerStats,
    teamStats,
    boxScoreFetched:   true,
    boxScoreUpdatedAt: Date.now(),
  }
  await gameDocSnap.ref.set(update, { merge: true })

  // If final and not yet aggregated, aggregate season totals
  const isFinal = data.status === 'final'
  const alreadyAggregated = data.statsProcessed === true

  if (isFinal && !alreadyAggregated) {
    // Claim the game in a transaction before aggregating. boxScoresJob fires
    // every 2 minutes and a slow run outlives its own interval, so two runs
    // routinely overlap. Both would read statsProcessed=false, both would call
    // aggregateSeasonStats, and every FieldValue.increment would apply twice —
    // this is the cause of the 1.12x-1.72x season-total inflation. The
    // transaction lets exactly one run win the claim.
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(gameDocSnap.ref)
      if (!fresh.exists) return false
      const d = fresh.data()
      if (d.status !== 'final' || d.statsProcessed === true) return false
      tx.update(gameDocSnap.ref, { statsProcessed: true, statsProcessedAt: Date.now() })
      return true
    })

    if (claimed) {
      try {
        await aggregateSeasonStats(playerStats, data, teamMap)
      } catch (err) {
        // aggregateSeasonStats commits a single atomic batch, so a failure
        // wrote nothing. Release the claim so a later run retries rather than
        // leaving the game permanently marked processed with no stats.
        await gameDocSnap.ref.update({
          statsProcessed: false,
          statsProcessedAt: FieldValue.delete(),
        })
        throw err
      }
    }
  }

  return {
    success: true,
    isFinal,
    ncaaGameId,
    playerCount: playerStats.length,
  }
}

// ── aggregate per-game stats into /playerStats/{playerId} ───────────────────
async function aggregateSeasonStats(players, gameContext, teamMap) {
  const batch = db.batch()
  let queued = 0

  for (const p of players) {
    if (!p.playerId) continue
    // Aggregate season stats only for players who actually contributed.
    // The NCAA API marks every dressed roster player participated:true,
    // including bench players with zero minutes and an all-zero stat line —
    // those would otherwise get a season doc with gp incremented. Require a
    // meaningful stat or goalie time on the field.
    if (!contributed(p)) continue

    const ref = db.collection('playerStats').doc(p.playerId)

    batch.set(ref, {
      // Identity (set/overwrite each time — keeps name/number current)
      playerId:  p.playerId,
      firstName: p.firstName,
      lastName:  p.lastName,
      name:      p.name,
      number:    p.number,
      position:  p.position,
      teamId:    p.teamId,
      teamName:  p.teamName,
      teamSeo:   p.teamSeo,
      gender:    gameContext.gender || '',
      div:       gameContext.div || '',
      // Conference: read from the game doc's per-team conf
      conf:      (p.role === 'home' ? gameContext.home?.conf : gameContext.away?.conf) || '',
      // Take the season from the game itself, so a rollover needs no redeploy.
      season:    seasonForGameDate(gameContext.gameDate) || gameContext.season || currentSeason(),

      // Counters — increment per game
      gp:                FieldValue.increment(1),
      goals:             FieldValue.increment(p.goals),
      assists:           FieldValue.increment(p.assists),
      points:            FieldValue.increment(p.points),
      shots:             FieldValue.increment(p.shots),
      sog:               FieldValue.increment(p.sog),
      freePositionShots: FieldValue.increment(p.freePositionShots),
      groundBalls:       FieldValue.increment(p.groundBalls),
      drawControls:      FieldValue.increment(p.drawControls),
      turnovers:         FieldValue.increment(p.turnovers),
      causedTurnovers:   FieldValue.increment(p.causedTurnovers),

      gameWinningGoals:  FieldValue.increment(p.gameWinningGoals),
      overtimeGoals:     FieldValue.increment(p.overtimeGoals),
      powerplayGoals:    FieldValue.increment(p.powerplayGoals),
      shortHandedGoals:  FieldValue.increment(p.shortHandedGoals),
      freePositionGoals: FieldValue.increment(p.freePositionGoals),

      penaltyCount:    FieldValue.increment(p.penaltyCount),
      penaltyMinutes:  FieldValue.increment(p.penaltyMinutes),
      majorPenalties:  FieldValue.increment(p.majorPenalties),
      minorPenalties:  FieldValue.increment(p.minorPenalties),

      // Goalie counters (zero for non-goalies, harmless)
      saves:              FieldValue.increment(p.saves),
      goalsAllowed:       FieldValue.increment(p.goalsAllowed),
      goalieMinutes:      FieldValue.increment(p.goalieMinutes),
      shutouts:           FieldValue.increment(p.shutouts),
      goalieGamesStarted: FieldValue.increment(p.goalieGamesStarted),
      goalieGamesPlayed:  FieldValue.increment(p.goalieGamesPlayed),
      goalieLosses:       FieldValue.increment(p.goalieLosses),
      combinedShutouts:   FieldValue.increment(p.combinedShutouts),
      ppGoalsAllowed:     FieldValue.increment(p.ppGoalsAllowed),
      shGoalsAllowed:     FieldValue.increment(p.shGoalsAllowed),
      enGoalsAllowed:     FieldValue.increment(p.enGoalsAllowed),
      soGoalsAllowed:     FieldValue.increment(p.soGoalsAllowed),

      updatedAt: Date.now(),
    }, { merge: true })

    queued++
  }

  if (queued > 0) {
    try {
      await batch.commit()
    } catch (err) {
      console.error(`[ncaa-boxscores] aggregation batch failed:`, err.message)
      await logError(`aggregate:batch`, err)
      // Rethrow. Swallowing this let the caller mark the game statsProcessed
      // even though nothing was written, silently losing the game's stats for
      // the season with no way to notice.
      throw err
    }
  }
}

// ── concurrency-limited runner ───────────────────────────────────────────────
async function runWithConcurrency(items, workerFn, limit) {
  const results = { success: 0, errors: 0, skipped: 0, total: items.length }
  const queue   = items.slice()

  async function worker() {
    while (queue.length) {
      const item = queue.shift()
      if (!item) break
      try {
        const r = await workerFn(item)
        if (r?.success) results.success++
        else if (r?.error) results.errors++
        else if (r?.skipped) results.skipped++
        await new Promise(res => setTimeout(res, REQUEST_DELAY_MS))
      } catch (err) {
        results.errors++
        console.error(`[ncaa-boxscores] worker error:`, err.message)
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))

  console.log(`[ncaa-boxscores] ═══════════════════════════════════════`)
  console.log(`[ncaa-boxscores] ✓ Run complete`)
  console.log(`[ncaa-boxscores]   Total:    ${results.total}`)
  console.log(`[ncaa-boxscores]   Success:  ${results.success}`)
  console.log(`[ncaa-boxscores]   Skipped:  ${results.skipped}`)
  console.log(`[ncaa-boxscores]   Errors:   ${results.errors}`)
  console.log(`[ncaa-boxscores] ═══════════════════════════════════════`)

  return results
}

// ── cron entry point: live + recent-final unprocessed games ─────────────────
// IMPORTANT: this only processes docs whose ID starts with "ncaa-" so it
// never touches the legacy m-*/w-* Sidearm docs (which will age out).
export async function fetchAllBoxScores() {
  console.log('[ncaa-boxscores] Starting forward-mode box score fetch...')

  // Live games — always re-fetch (stats change during play)
  const liveSnap = await db.collection('games')
    .where('season', 'in', activeSeasons())
    .where('status', '==', 'live')
    .get()

  // Final games from last 7 days that haven't been aggregated yet
  const sevenAgo = new Date()
  sevenAgo.setDate(sevenAgo.getDate() - 7)
  const cutoff = `${sevenAgo.getFullYear()}${String(sevenAgo.getMonth()+1).padStart(2,'0')}${String(sevenAgo.getDate()).padStart(2,'0')}`

  const finalSnap = await db.collection('games')
    .where('season', 'in', activeSeasons())
    .where('status', '==', 'final')
    .where('gameDate', '>=', cutoff)
    .get()

  const docs = [
    ...liveSnap.docs.filter(d => d.id.startsWith('ncaa-')),
  ]
  for (const d of finalSnap.docs) {
    if (!d.id.startsWith('ncaa-')) continue
    if (d.data().statsProcessed !== true) docs.push(d)
  }

  console.log(`[ncaa-boxscores] Forward: ${docs.length} games to process`)
  return await runWithConcurrency(docs, processBoxScoreDoc, CONCURRENCY)
}

// ── one-time backfill: process ALL final games (ncaa-* only) ────────────────
export async function backfillBoxScores() {
  console.log('[ncaa-boxscores] BACKFILL: scanning all final games...')

  const snap = await db.collection('games')
    .where('season', 'in', activeSeasons())
    .where('status', '==', 'final')
    .get()

  // Skip legacy m-*/w-* docs (Sidearm-era) and already fully processed docs
  const todo = snap.docs.filter(d => {
    if (!d.id.startsWith('ncaa-')) return false
    const x = d.data()
    return x.statsProcessed !== true || x.boxScoreFetched !== true
  })

  console.log(`[ncaa-boxscores] BACKFILL: ${snap.size} final games found, ${todo.length} need processing`)
  return await runWithConcurrency(todo, processBoxScoreDoc, CONCURRENCY)
}

// ── single-game test: used by HTTP trigger for diagnostics ──────────────────
// ── date-ranged box score backfill ──────────────────────────────────────────
// Fetches box scores for final ncaa-* games in a date window that haven't been
// aggregated yet.
//
// Exists because `triggerBackfill` cannot currently be redeployed -- setting its
// public invoker policy needs roles/functions.admin, which the account lacks --
// so the deployed copy still runs the OLD source bundle, with the pre-transaction
// claim and the pre-fix participation gate. Running it would reintroduce both
// bugs. This is reached through triggerStatsInflationDiagnostic instead, which
// deploys cleanly and therefore always runs current code.
//
// Written for the January 2026 gap: boxScoresJob and scrapeNightly were gated to
// Feb-May and the scraper only fetched today+yesterday, so season-opening games
// in January were never pulled -- 21 games across 2026-01-30/31.
export async function backfillBoxScoresForDates({ start, end }) {
  if (!/^\d{8}$/.test(String(start)) || !/^\d{8}$/.test(String(end))) {
    throw new Error(`[boxscore-backfill] start/end must be YYYYMMDD (got ${start}/${end})`)
  }
  const snap = await db.collection('games')
    .where('season', 'in', activeSeasons())
    .where('status', '==', 'final')
    .where('gameDate', '>=', String(start))
    .where('gameDate', '<=', String(end))
    .get()

  const all = snap.docs.filter(d => d.id.startsWith('ncaa-'))
  const todo = all.filter(d => d.data().statsProcessed !== true)
  console.log(`[boxscore-backfill] ${start}..${end}: ${all.length} ncaa games, ${todo.length} unaggregated`)

  const result = await runWithConcurrency(todo, processBoxScoreDoc, CONCURRENCY)
  return { start, end, ncaaGamesInRange: all.length, alreadyProcessed: all.length - todo.length, ...result }
}

export async function processOneBoxScore(ncaaGameId) {
  const docId = `ncaa-${ncaaGameId}`
  const ref   = db.collection('games').doc(docId)
  const snap  = await ref.get()
  if (!snap.exists) return { error: true, reason: `game doc ${docId} not found` }
  return await processBoxScoreDoc(snap)
}
