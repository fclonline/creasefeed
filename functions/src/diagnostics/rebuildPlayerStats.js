// ============================================================================
// functions/src/diagnostics/rebuildPlayerStats.js
//
// Rebuilds /playerStats season totals from the canonical game docs.
//
// WHY: season totals are inflated 1.12x-1.72x per player. The cause was a
// double-aggregation race in processOneBoxScore (fixed separately) that applied
// FieldValue.increment twice for games caught by overlapping boxScoresJob runs.
// Because the multiplier differs per player, totals cannot be scaled back --
// they have to be recomputed from the games themselves.
//
// METHOD (per Deemer's rule): zero out and re-accumulate from canonical
// survivors. Never decrement, never delete-only.
//
// SOURCE OF TRUTH: final `ncaa-*` game docs only. The 2,108
// `sidearm-boxscore-header` docs carry no box scores and are excluded.
// Canonical game = one per (gender, gameDate, sortedPair(home, away)); on a
// collision the doc with the most player lines wins.
//
// DRY RUN IS THE DEFAULT. With dryRun=true this writes exactly one report doc
// to /diagnostics and touches nothing else. Only dryRun=false writes to
// /playerStats.
// ============================================================================

import { db } from '../firebase.js'

const SEASON = '2026'
const PAGE_SIZE = 300
const COMMIT_CHUNK = 400      // Firestore batch limit is 500
const MAX_REPORT_ROWS = 60

// Counter fields, mirroring aggregateSeasonStats in ncaaBoxScores.js.
const COUNTERS = [
  'goals', 'assists', 'points', 'shots', 'sog', 'freePositionShots',
  'groundBalls', 'drawControls', 'turnovers', 'causedTurnovers',
  'gameWinningGoals', 'overtimeGoals', 'powerplayGoals', 'shortHandedGoals',
  'freePositionGoals', 'penaltyCount', 'penaltyMinutes', 'majorPenalties',
  'minorPenalties', 'saves', 'goalsAllowed', 'goalieMinutes', 'shutouts',
  'goalieGamesStarted',
]

// Must match aggregateSeasonStats exactly, or gp will not line up: the NCAA API
// marks every dressed player participated:true, including bench players with an
// all-zero line, and those must not earn a game played.
function contributed(p) {
  return !!(
    p.goals || p.assists || p.shots || p.groundBalls ||
    p.turnovers || p.causedTurnovers || p.saves ||
    p.goalsAllowed || p.penaltyCount || p.goalieMinutes > 0
  )
}

function sortedTeamPair(a, b) {
  const x = (a || '').trim().toLowerCase()
  const y = (b || '').trim().toLowerCase()
  return x <= y ? `${x}|${y}` : `${y}|${x}`
}

async function* iterateGames() {
  let last = null
  while (true) {
    let q = db.collection('games')
      .where('season', '==', SEASON)
      .where('status', '==', 'final')
      .select('gender', 'gameDate', 'home', 'away', 'div', '_source', 'playerStats', 'statsProcessed')
      .orderBy('__name__')
      .limit(PAGE_SIZE)
    if (last) q = q.startAfter(last)
    const snap = await q.get()
    if (snap.empty) return
    for (const doc of snap.docs) yield doc
    if (snap.size < PAGE_SIZE) return
    last = snap.docs[snap.docs.length - 1]
  }
}

export async function rebuildPlayerStats({ dryRun = true } = {}) {
  const startedAt = Date.now()
  const report = {
    startedAt: new Date(startedAt).toISOString(),
    season: SEASON,
    dryRun,
    scanned: { total: 0, ncaa: 0, sidearmSkipped: 0, noBoxScore: 0 },
    canonicalGames: 0,
    duplicateDocsSkipped: 0,
    players: {
      computed: 0, existing: 0,
      unchanged: 0, corrected: 0,
      newlyCreated: 0, zeroGameCandidates: 0,
    },
    gpDelta: { over: 0, under: 0, exact: 0 },
    examples: [], zeroGameExamples: [],
    warnings: [],
  }

  // ── 1. Pick the canonical doc per real game ───────────────────────────────
  // Keyed slim so the full playerStats arrays are never all held at once.
  const canonical = new Map()      // key -> {id, size}
  const unflagged = new Set()      // canonical ids with statsProcessed !== true
  for await (const doc of iterateGames()) {
    report.scanned.total++
    const g = doc.data()
    if (g._source === 'sidearm-boxscore-header' || !doc.id.startsWith('ncaa-')) {
      report.scanned.sidearmSkipped++
      continue
    }
    report.scanned.ncaa++
    const lines = Array.isArray(g.playerStats) ? g.playerStats.length : 0
    if (!lines) { report.scanned.noBoxScore++; continue }
    if (!g.gender || !g.gameDate || !g.home?.name || !g.away?.name) continue

    if (g.statsProcessed !== true) unflagged.add(doc.id)
    const key = `${g.gender}|${g.gameDate}|${sortedTeamPair(g.home.name, g.away.name)}`
    const prev = canonical.get(key)
    if (!prev) {
      canonical.set(key, { id: doc.id, size: lines })
    } else {
      report.duplicateDocsSkipped++
      // Most complete box score wins; stable tie-break so reruns agree.
      if (lines > prev.size || (lines === prev.size && doc.id < prev.id)) {
        canonical.set(key, { id: doc.id, size: lines })
      }
    }
  }
  const canonicalIds = new Set(Array.from(canonical.values()).map(v => v.id))
  report.canonicalGames = canonicalIds.size
  // Canonical games whose statsProcessed flag doesn't match the fact that the
  // rebuild counted them. Left unflagged, a later run could aggregate them a
  // second time on top of the rebuilt totals.
  const toFlag = Array.from(unflagged).filter(id => canonicalIds.has(id))
  report.canonicalGamesNeedingFlag = toFlag.length

  // ── 2. Accumulate true totals from the canonical docs ─────────────────────
  const totals = new Map() // playerId -> record
  for await (const doc of iterateGames()) {
    if (!canonicalIds.has(doc.id)) continue
    const g = doc.data()
    for (const p of (g.playerStats || [])) {
      if (!p?.playerId || !contributed(p)) continue
      let rec = totals.get(p.playerId)
      if (!rec) {
        rec = {
          playerId: p.playerId,
          firstName: p.firstName, lastName: p.lastName, name: p.name,
          number: p.number, position: p.position,
          teamId: p.teamId, teamName: p.teamName, teamSeo: p.teamSeo,
          gender: g.gender || '', div: g.div || '',
          conf: (p.role === 'home' ? g.home?.conf : g.away?.conf) || '',
          season: SEASON, gp: 0,
        }
        for (const f of COUNTERS) rec[f] = 0
        totals.set(p.playerId, rec)
      }
      rec.gp++
      for (const f of COUNTERS) rec[f] += (p[f] || 0)
    }
  }
  report.players.computed = totals.size

  // ── 3. Compare against what is stored ─────────────────────────────────────
  const existingSnap = await db.collection('playerStats').where('season', '==', SEASON).get()
  report.players.existing = existingSnap.size

  const seen = new Set()
  const diffs = []
  for (const d of existingSnap.docs) {
    const cur = d.data()
    seen.add(d.id)
    const next = totals.get(d.id)
    if (!next) {
      report.players.zeroGameCandidates++
      if (report.zeroGameExamples.length < MAX_REPORT_ROWS) {
        report.zeroGameExamples.push({
          playerId: d.id, name: cur.name || null, team: cur.teamName || null,
          storedGp: cur.gp ?? 0, storedGoals: cur.goals ?? 0, storedSaves: cur.saves ?? 0,
        })
      }
      continue
    }
    const changed = next.gp !== (cur.gp ?? 0) || COUNTERS.some(f => next[f] !== (cur[f] ?? 0))
    if (!changed) { report.players.unchanged++; continue }
    report.players.corrected++
    const dgp = (cur.gp ?? 0) - next.gp
    if (dgp > 0) report.gpDelta.over++
    else if (dgp < 0) report.gpDelta.under++
    else report.gpDelta.exact++
    diffs.push({
      playerId: d.id, name: next.name, team: next.teamName, gender: next.gender, div: next.div,
      storedGp: cur.gp ?? 0, trueGp: next.gp,
      storedGoals: cur.goals ?? 0, trueGoals: next.goals,
      storedAssists: cur.assists ?? 0, trueAssists: next.assists,
      storedSaves: cur.saves ?? 0, trueSaves: next.saves,
      gpRatio: next.gp > 0 ? +((cur.gp ?? 0) / next.gp).toFixed(3) : null,
    })
  }
  for (const pid of totals.keys()) if (!seen.has(pid)) report.players.newlyCreated++

  diffs.sort((a, b) => (b.storedGp - b.trueGp) - (a.storedGp - a.trueGp))
  report.examples = diffs.slice(0, MAX_REPORT_ROWS)

  if (report.players.zeroGameCandidates > 0) {
    report.warnings.push(
      `${report.players.zeroGameCandidates} stored players have NO canonical game appearance. ` +
      `Most likely their only games came from Sidearm docs. They are NOT touched by this run — ` +
      `decide explicitly whether to delete them.`
    )
  }
  if (report.canonicalGames === 0) {
    report.warnings.push('STOP: no canonical games found. Do not apply.')
  }

  // ── 4. Apply, only when explicitly asked ──────────────────────────────────
  if (!dryRun && report.canonicalGames > 0) {
    let written = 0
    const rows = Array.from(totals.values())
    for (let i = 0; i < rows.length; i += COMMIT_CHUNK) {
      const batch = db.batch()
      for (const rec of rows.slice(i, i + COMMIT_CHUNK)) {
        // set() without merge: overwrites the whole doc, so the old inflated
        // counters are replaced outright rather than incremented. This is the
        // "zero and re-accumulate" step.
        batch.set(db.collection('playerStats').doc(rec.playerId), { ...rec, updatedAt: Date.now(), rebuiltAt: startedAt })
      }
      await batch.commit()
      written += Math.min(COMMIT_CHUNK, rows.length - i)
    }
    report.written = written

    // Mark every counted game processed, so nothing can re-aggregate on top of
    // the rebuilt totals.
    for (let i = 0; i < toFlag.length; i += COMMIT_CHUNK) {
      const batch = db.batch()
      for (const id of toFlag.slice(i, i + COMMIT_CHUNK)) {
        batch.update(db.collection('games').doc(id), { statsProcessed: true, statsProcessedAt: startedAt })
      }
      await batch.commit()
    }
    report.flagged = toFlag.length
  }

  report.completedAt = new Date().toISOString()
  report.durationMs = Date.now() - startedAt

  const docId = `${dryRun ? 'rebuild-dryrun' : 'rebuild-applied'}-${startedAt}`
  await db.collection('diagnostics').doc(docId).set(report)

  console.log(`[rebuild] dryRun=${dryRun} canonical=${report.canonicalGames} computed=${report.players.computed} corrected=${report.players.corrected} zeroGame=${report.players.zeroGameCandidates}`)
  return { ok: true, docId, ...report, examples: report.examples.slice(0, 15), zeroGameExamples: report.zeroGameExamples.slice(0, 10) }
}
