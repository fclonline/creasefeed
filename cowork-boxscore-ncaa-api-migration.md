# Cowork Task: Migrate Box Score Pipeline to NCAA API

## TL;DR

Replace the entire WMT/Sidearm-based player stats pipeline (`boxscores.js`, `sidearm.js`, `schoolUrls.js`) with a single new file (`ncaaBoxScores.js`) that fetches per-game player stats from the NCAA API wrapper already in use for scores. Eliminates two sequential network hops per game, removes ~188 school-specific scraping configurations, and unifies all game data under `/games/ncaa-{gameId}` instead of the current dual-document setup. Includes a one-time backfill step to populate player stats for the ~870 final games already in Firestore.

There are no users yet, so this is a hard cutover, not a parallel run.

---

## Files affected

**DELETE** (entirely — these are no longer used):
- `functions/src/scrapers/boxscores.js`
- `functions/src/parsers/sidearm.js`
- `functions/src/data/schoolUrls.js`

**CREATE**:
- `functions/src/scrapers/ncaaBoxScores.js`

**UPDATE**:
- `functions/src/scrapers/ncaaScores.js` — add per-team `conf` field to game docs (small change, ~6 lines)
- `functions/src/index.js` — rewire crons and HTTP triggers to use new pipeline

Do not modify anything else.

---

## Step 1 — Update `ncaaScores.js`

The new box score processor needs each team's conference per-game. Currently `ncaaScores.js` writes a single top-level `conf` field by picking home's conf or falling back to away's. We need it on each team object.

In `functions/src/scrapers/ncaaScores.js`, locate the `doc` object inside `fetchAndWriteScores` (currently around lines 172–198). Add `conf` to both the `away` and `home` sub-objects:

**Find this block:**

```javascript
const doc = {
  away: {
    name:  away.names?.short || away.names?.full || away.names?.seo || away.name || 'Away',
    score: parseInt(away.score, 10) || null,
    rank:  away.rank || null,
    rec:   away.record || away.description || '',
  },
  home: {
    name:  home.names?.short || home.names?.full || home.names?.seo || home.name || 'Home',
    score: parseInt(home.score, 10) || null,
    rank:  home.rank || null,
    rec:   home.record || home.description || '',
  },
```

**Replace with:**

```javascript
const doc = {
  away: {
    name:  away.names?.short || away.names?.full || away.names?.seo || away.name || 'Away',
    score: parseInt(away.score, 10) || null,
    rank:  away.rank || null,
    rec:   away.record || away.description || '',
    conf:  getConf(away),
    teamSeo: away.names?.seo || '',
  },
  home: {
    name:  home.names?.short || home.names?.full || home.names?.seo || home.name || 'Home',
    score: parseInt(home.score, 10) || null,
    rank:  home.rank || null,
    rec:   home.record || home.description || '',
    conf:  getConf(home),
    teamSeo: home.names?.seo || '',
  },
```

Leave the rest of the file untouched. The top-level `conf` field stays in place for backwards compatibility.

---

## Step 2 — Create `ncaaBoxScores.js`

Create a new file at `functions/src/scrapers/ncaaBoxScores.js` with the following content. This is the entire file — no other edits required to it.

```javascript
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

const SEASON = '2026'
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

    // Goalie (only populated when position === 'gk' and goalie block present)
    isGoalie:           p.position === 'gk' && !!p.goalie,
    goalieMinutes:      parseInt(p.goalie?.minutesPlayed, 10) || 0,
    saves:              parseInt(p.goalie?.saves, 10)         || 0,
    goalsAllowed:       parseInt(p.goalie?.goalsAllowed, 10)  || 0,
    shutouts:           parseInt(p.goalie?.shutouts, 10)      || 0,
    goalieGamesStarted: p.goalie?.gamesStarted === '1' ? 1 : 0,
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
    saves:           parseInt(t.goalie?.saves, 10)        || 0,
    goalsAllowed:    parseInt(t.goalie?.goalsAllowed, 10) || 0,
    powerPlayGoals:  parseInt(t.powerPlay?.goals, 10)         || 0,
    powerPlayOpps:   parseInt(t.powerPlay?.opportunities, 10) || 0,
    penaltyCount:    parseInt(t.penalties?.count, 10) || 0,
    penaltyMinutes:  parseFloat(t.penalties?.minutes) || 0,
  }
}

// ── core: fetch + write a single game's box score ───────────────────────────
async function processBoxScoreDoc(gameDocSnap) {
  const data = gameDocSnap.data()
  const ncaaGameId = data.ncaaGameId
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
    await aggregateSeasonStats(playerStats, data, teamMap)
    await gameDocSnap.ref.update({ statsProcessed: true })
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
    if (!p.participated || !p.playerId) continue

    const team = teamMap[String(p.teamId)]
    const ref  = db.collection('playerStats').doc(p.playerId)

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
      season:    SEASON,

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
export async function fetchAllBoxScores() {
  console.log('[ncaa-boxscores] Starting forward-mode box score fetch...')

  // Live games — always re-fetch (stats change during play)
  const liveSnap = await db.collection('games')
    .where('season', '==', SEASON)
    .where('status', '==', 'live')
    .get()

  // Final games from last 7 days that haven't been aggregated yet
  const sevenAgo = new Date()
  sevenAgo.setDate(sevenAgo.getDate() - 7)
  const cutoff = `${sevenAgo.getFullYear()}${String(sevenAgo.getMonth()+1).padStart(2,'0')}${String(sevenAgo.getDate()).padStart(2,'0')}`

  const finalSnap = await db.collection('games')
    .where('season', '==', SEASON)
    .where('status', '==', 'final')
    .where('gameDate', '>=', cutoff)
    .get()

  const docs = [...liveSnap.docs]
  for (const d of finalSnap.docs) {
    if (d.data().statsProcessed !== true) docs.push(d)
  }

  console.log(`[ncaa-boxscores] Forward: ${docs.length} games (${liveSnap.size} live, ${docs.length - liveSnap.size} pending finals)`)
  return await runWithConcurrency(docs, processBoxScoreDoc, CONCURRENCY)
}

// ── one-time backfill: process ALL final games ──────────────────────────────
export async function backfillBoxScores() {
  console.log('[ncaa-boxscores] BACKFILL: scanning all final games...')

  const snap = await db.collection('games')
    .where('season', '==', SEASON)
    .where('status', '==', 'final')
    .get()

  // Skip games already fully processed (idempotent re-runs)
  const todo = snap.docs.filter(d => {
    const x = d.data()
    return x.statsProcessed !== true || x.boxScoreFetched !== true
  })

  console.log(`[ncaa-boxscores] BACKFILL: ${snap.size} final games found, ${todo.length} need processing`)
  return await runWithConcurrency(todo, processBoxScoreDoc, CONCURRENCY)
}

// ── single-game test: used by HTTP trigger for diagnostics ──────────────────
export async function processOneBoxScore(ncaaGameId) {
  const docId = `ncaa-${ncaaGameId}`
  const ref   = db.collection('games').doc(docId)
  const snap  = await ref.get()
  if (!snap.exists) return { error: true, reason: `game doc ${docId} not found` }
  return await processBoxScoreDoc(snap)
}
```

---

## Step 3 — Update `index.js`

Multiple coordinated edits. Apply in order.

### 3a. Replace the import line

**Find (line 19):**

```javascript
import { scrapeAllBoxScores, pollLiveGames, diagnoseSchedules } from './scrapers/boxscores.js'
```

**Replace with:**

```javascript
import { fetchAllBoxScores, backfillBoxScores, processOneBoxScore } from './scrapers/ncaaBoxScores.js'
```

### 3b. Delete `pollLiveGamesJob`

Delete the entire `pollLiveGamesJob` block (currently lines 26–43, starting with `// ── Live game poller`). The new pipeline doesn't need a separate live-games-only job because `fetchAllBoxScores` already includes live games and is cheap.

### 3c. Replace `scrapeBoxScoresJob`

**Find the entire `scrapeBoxScoresJob` block (currently lines 45–63, starting with `// ── Box score scraper`).**

**Replace with:**

```javascript
// ── Box score fetcher — every 2 minutes during game hours ────────────────────
// Pulls scores from NCAA scoreboard, then fetches box scores for live games
// and any recently-final games not yet aggregated.
export const boxScoresJob = onSchedule({
  schedule:       'every 2 minutes',
  timeZone:       'America/New_York',
  region:         'us-east1',
  memory:         '512MiB',
  timeoutSeconds: 540,
}, async () => {
  const now   = new Date()
  const hour  = now.getHours()
  const month = now.getMonth()

  if (month < 1 || month > 4) return  // Feb–May only
  if (hour  < 9 || hour  > 23) return // 9am–11pm ET

  await fetchNcaaScores()
  await fetchAllBoxScores()
})
```

### 3d. Update `scrapeNightly`

**Find** the line inside `scrapeNightly` (currently line 88):

```javascript
  await scrapeAllBoxScores()
```

**Replace with:**

```javascript
  await fetchAllBoxScores()
```

### 3e. Delete `testScrapeOne`

Delete the entire `testScrapeOne` block (currently lines 93–184, starting with `// ── HTTP trigger — test scrape ONE school`). It's a Sidearm-specific debug tool with no analog in the new pipeline.

### 3f. Update `triggerBoxScores`

**Find:**

```javascript
  console.log('[triggerBoxScores] Manual box score scrape triggered')
  const result = await scrapeAllBoxScores()
```

**Replace with:**

```javascript
  console.log('[triggerBoxScores] Manual box score fetch triggered')
  const result = await fetchAllBoxScores()
```

### 3g. Add two new HTTP triggers

After the existing `triggerBoxScores` block, **add** these two new triggers:

```javascript
// ── HTTP trigger — manual backfill (one-time use) ────────────────────────────
// Processes ALL final games in /games regardless of statsProcessed flag.
// Idempotent: skips games already marked statsProcessed=true.
export const triggerBackfill = onRequest({
  region: 'us-east1',
  memory: '1GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerBackfill] Manual backfill triggered')
  const result = await backfillBoxScores()
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — fetch one game's box score (debug) ────────────────────────
// Usage: GET /testBoxScore?ncaaGameId=6539341
export const testBoxScore = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 60,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  const id = String(req.query.ncaaGameId || '').trim()
  if (!id) {
    res.status(400).json({ error: 'missing ncaaGameId query param' })
    return
  }
  const result = await processOneBoxScore(id)
  res.json({ ok: !result.error, ...result })
})
```

### 3h. Delete `diagnoseSchedulePages`

Delete the entire `diagnoseSchedulePages` block (currently around lines 266–277, starting with `// ── HTTP trigger — diagnose schedule pages`). Sidearm-specific tool, no longer relevant.

---

## Step 4 — Delete obsolete files

Delete these three files entirely:

- `functions/src/scrapers/boxscores.js`
- `functions/src/parsers/sidearm.js`
- `functions/src/data/schoolUrls.js`

If the `parsers` or `data` directories are now empty, delete those directories too.

Run a quick grep to confirm nothing else imports from them:

```bash
cd ~/Claude-CoWork/creasefeed/functions
grep -r "from '.*scrapers/boxscores'" src/ || echo "boxscores.js — clean"
grep -r "from '.*parsers/sidearm'" src/   || echo "sidearm.js — clean"
grep -r "from '.*data/schoolUrls'" src/   || echo "schoolUrls.js — clean"
```

If any of those greps return matches, **stop and report**. There's an unexpected dependency we need to handle before proceeding.

---

## Step 5 — Smoke test (single game, before deploy)

Run a standalone smoke test from `~/Claude-CoWork/creasefeed/functions` to verify the parsing logic against a known game (Loyola Maryland 13, Navy 12 from April 24):

```bash
node --input-type=module -e '
const url = "https://ncaa-api.henrygd.me/game/6539341/boxscore";
const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }});
const j = await r.json();

console.log("sport:", j.sportCode);
console.log("teams:", j.teams.map(t => `${t.nameShort} (id=${t.teamId}, home=${t.isHome})`));

for (const tb of j.teamBoxscore) {
  const team = j.teams.find(t => String(t.teamId) === String(tb.teamId));
  const players = (tb.playerStats || []).filter(p => p.participated);
  const goalies = players.filter(p => p.position === "gk" && p.goalie);
  const scorers = players.filter(p => parseInt(p.goals,10) > 0)
    .sort((a,b) => parseInt(b.goals,10) - parseInt(a.goals,10))
    .slice(0,3);

  console.log(`\n${team.nameShort}: ${players.length} players, ${goalies.length} goalies`);
  console.log(`  top scorers: ${scorers.map(p => `${p.firstName} ${p.lastName} (${p.goals}G/${p.assists}A)`).join(", ")}`);
  if (goalies.length) {
    const g = goalies[0];
    console.log(`  goalie: ${g.firstName} ${g.lastName} — ${g.goalie.saves}sv / ${g.goalie.goalsAllowed}GA`);
  }
}
'
```

**Expected output:**

```
sport: MLA
teams: [ 'Navy (id=43901, home=true)', 'Loyola Maryland (id=43717, home=false)' ]

Navy: ~10 players, 1 goalies
  top scorers: ALEC GREGOREK (3G/0A), WILLIAM GOERS (3G/2A), MAC HALEY (2G/0A)
  goalie: DAN DALY — 13sv / 13GA

Loyola Maryland: ~10 players, 1 goalies
  top scorers: MASON COOK (4G/0A), KENAN EVERHART (3G/1A), BRADY QUINN (3G/0A)
  goalie: MAX WATKINSON — 16sv / 12GA
```

Names will appear in ALL CAPS in the raw response (the file's `toProperCase` helper handles conversion). If team counts or scorer rankings are wildly off, **stop and report**.

---

## Step 6 — Deploy

If smoke test passes, deploy:

```bash
cd ~/Claude-CoWork/creasefeed
firebase deploy --only functions
```

Watch for deployment errors related to deleted imports. If any function reports a missing import, the deletions in Step 4 missed something — check that the index.js edits in Step 3 are complete.

---

## Step 7 — Post-deploy verification (single game)

Hit the new debug endpoint to verify end-to-end:

```bash
# Replace <project-id> with the actual project (creasefeed)
curl "https://us-east1-creasefeed.cloudfunctions.net/testBoxScore?ncaaGameId=6539341"
```

**Expected:**

```json
{
  "ok": true,
  "success": true,
  "isFinal": true,
  "ncaaGameId": "6539341",
  "playerCount": 50
}
```

Then verify in Firestore:
- `/games/ncaa-6539341` has `playerStats` (array of ~50 entries), `teamStats: { home, away }`, `boxScoreFetched: true`, `statsProcessed: true`
- `/playerStats/ncaa-43717-mason-cook` exists with `goals: 4` (from this one game), `points: 4`, `gp: 1`
- `/playerStats/ncaa-43901-dan-daly` exists with `saves: 13`, `goalsAllowed: 13`, `goalieMinutes: 3600`

If any of those checks fail, **stop and report**. Don't run backfill yet.

---

## Step 8 — Run backfill

This is the one-time backfill of ~870 historical games. At ~3 concurrent fetches with 250ms throttle, it should take roughly 2–4 minutes.

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/triggerBackfill"
```

**Expected response:**

```json
{
  "ok": true,
  "total": <~870>,
  "success": <~850+>,
  "skipped": <few>,
  "errors": <ideally 0, acceptable up to ~20>
}
```

Tail the function logs while it runs. If errors exceed ~5% (>~45), **stop and report** — there may be a systematic issue with how non-D1 or canceled games are being handled.

After it completes, verify with a couple spot-checks:

```bash
# Spot-check: a known D1 men's game from earlier in season
curl "https://us-east1-creasefeed.cloudfunctions.net/testBoxScore?ncaaGameId=<some-id-from-march>"

# Verify a season leader is now populated
# E.g. if Notre Dame's leading scorer is X, /playerStats/ncaa-{ndId}-{x-slug}
# should show GP matching ND's games-played count and aggregate stats
```

---

## Step 9 — Confirm cron is healthy

After backfill completes, the next scheduled run of `boxScoresJob` (every 2 min during game hours) should:

- Find 0 games needing processing on the "pending finals" branch (because backfill caught them all up).
- Find any live games and update them.

Tail the logs after a scheduled run and look for:

```
[ncaa-boxscores] Forward: 0 games (0 live, 0 pending finals)
```

Or, if there are live games:

```
[ncaa-boxscores] Forward: 3 games (3 live, 0 pending finals)
[ncaa-boxscores] ✓ Run complete
[ncaa-boxscores]   Total:    3
[ncaa-boxscores]   Success:  3
```

---

## Stop conditions

Stop and report back to Deemer **immediately** if any of these happen — don't try to fix forward:

- Step 4 grep finds unexpected dependencies on the deleted files.
- Step 5 smoke test produces wrong team counts, wrong scorers, or unexpected schema fields (NCAA may have changed the response shape).
- Step 6 deployment fails with import errors.
- Step 7 single-game test produces a player document with `gp` already > 1 on first run (would mean stats were double-incremented).
- Step 8 backfill error rate exceeds 5%.
- After Step 9, live games stop updating during a real game window.

For any of these, paste the error output and the relevant log lines so we can diagnose together. Do not attempt to repair the deleted files or revive the WMT pipeline as a fallback.

---

## What success looks like

When this task is complete:

- `boxscores.js`, `sidearm.js`, `schoolUrls.js` are deleted.
- `ncaaBoxScores.js` is the only player-stats fetcher.
- All ~870 historical final games have `playerStats`, `teamStats`, and `statsProcessed: true`.
- All season leaders in `/playerStats` show plausible totals (e.g., a top D1 attacker with ~30+ goals, ~50+ points across ~13 games).
- Future games auto-update via the 2-minute cron during game hours.
- The site's existing `/games/ncaa-*` reads now also have player stats available with no additional code changes on the front-end (the data is on the same doc).

This sets up everything we need for the May launch: stat leaderboards, player pages, full per-game box scores, and the foundation for the standings feature next.
