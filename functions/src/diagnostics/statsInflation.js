// ============================================================================
// functions/src/diagnostics/statsInflation.js
//
// READ-ONLY diagnostic for stats-leaderboard inflation.
//
// HARD RULES (enforced by code):
//   - Never writes to /games
//   - Never writes to /playerStats
//   - The ONLY write performed is a single summary doc at
//       /diagnostics/stats-inflation-{startedAtMs}
//   - Does not self-heal, mutate, or delete anything it finds.
//
// What it reports:
//   1. Full-corpus doc-ID prefix census over ALL /games for the season —
//      counts and statsProcessed counts per prefix bucket (ncaa / legacy-m /
//      legacy-w / other). This is the highest-signal piece: if legacy buckets
//      are non-trivial, the data layer has parallel collections.
//   2. Duplicate /games clusters keyed by
//        (gender, gameDate, sortedPair([home.name, away.name]))
//      Per cluster: doc IDs, prefix bucket (ncaa-only, legacy-only, mixed),
//      duplicate-type classification (TRUE_DUPLICATE vs BOTH_TEAMS).
//   3. For the current top-25 players by goals AND top-25 by saves: stored
//      aggregate gp vs distinct canonical game appearances. Flags rows where
//      stored gp > distinct canonical appearances.
//
// MEMORY-CONSCIOUS (v3): paginated scan with field projection, slim per-doc
// records (only the playerIds Set is retained — not the full playerStats[]).
// Earlier versions OOMed at 2 GiB on the full 9803-game scan.
// ============================================================================

import { db } from '../firebase.js'

const SEASON = '2026'
const PAGE_SIZE = 500              // games per Firestore page
const MAX_CLUSTER_EXAMPLES = 100   // duplicate-cluster records in the report

// Determine the prefix bucket label for a single doc id — coarse (cluster-level).
function docPrefixBucket(id) {
  return id.startsWith('ncaa-') ? 'ncaa' : 'legacy'
}

// Fine-grained prefix bucket over the full /games corpus.
function docPrefixBucketDetailed(id) {
  if (id.startsWith('ncaa-')) return 'ncaa'
  const c = id[0]
  if (c === 'm') return 'legacy-m'
  if (c === 'w') return 'legacy-w'
  return 'other'
}

// Gender for a doc. Prefer the doc's `gender` field; fall back to the doc-ID
// prefix so legacy docs that don't carry `gender` as a queryable field still
// participate in clustering.
function deriveGender(docId, data) {
  if (data.gender === 'M' || data.gender === 'W') return data.gender
  const c = docId[0]
  if (c === 'm') return 'M'
  if (c === 'w') return 'W'
  return null
}

// Order-independent pair key for two team names. Lowercase + trim so trivial
// case/whitespace variants don't fragment clusters; sort so home/away flips
// collapse to the same key.
function sortedTeamPair(a, b) {
  const x = (a || '').trim().toLowerCase()
  const y = (b || '').trim().toLowerCase()
  return x <= y ? `${x}|${y}` : `${y}|${x}`
}

// Extract a minimal record from a game doc. Critically, this keeps ONLY a
// Set<playerId> from playerStats[] — never the full per-player stat objects.
// Once a page's snapshot is processed into slim records, the snapshot's
// underlying data can be GC'd.
function slimDoc(doc) {
  const g = doc.data()
  const playerIds = new Set()
  if (Array.isArray(g.playerStats)) {
    for (const p of g.playerStats) {
      if (p && p.playerId) playerIds.add(p.playerId)
    }
  }
  return {
    id:              doc.id,
    gender:          deriveGender(doc.id, g),
    gameDate:        g.gameDate || null,
    home:            g.home?.name || null,
    away:            g.away?.name || null,
    div:             g.div || null,
    statsProcessed:  g.statsProcessed === true,
    boxScoreFetched: g.boxScoreFetched === true,
    playerIds,
    playerCount:     playerIds.size,
  }
}

// Paginated scan over /games for the season. Projects only the fields we use,
// yielding QueryDocumentSnapshots one page at a time so memory never holds
// more than PAGE_SIZE docs at once.
async function* iterateGames() {
  const fields = [
    'gender', 'gameDate', 'home', 'away', 'div',
    'statsProcessed', 'boxScoreFetched', 'playerStats',
  ]
  let last = null
  while (true) {
    let q = db.collection('games')
      .where('season', '==', SEASON)
      .select(...fields)
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

// opts.full — when true, the returned payload also carries the per-player
// inflationCheck rows and the duplicate-cluster examples, so the report can be
// read straight from the HTTP response instead of the Firestore console.
export async function runStatsInflationDiagnostic(opts = {}) {
  const startedAt = Date.now()
  const report = {
    startedAt: new Date(startedAt).toISOString(),
    season: SEASON,
    clusterKey: '(gender, gameDate, sortedPair([home.name, away.name]))',
    gamesScanned: 0,
    overview: {
      docsByPrefix:      { ncaa: 0, 'legacy-m': 0, 'legacy-w': 0, other: 0 },
      processedByPrefix: { ncaa: 0, 'legacy-m': 0, 'legacy-w': 0, other: 0 },
    },
    duplicates: {
      totalClusters: 0,
      totalExtraDocs: 0,
      byPrefixBucket: { ncaaOnly: 0, legacyOnly: 0, mixed: 0 },
      byDuplicateType: { TRUE_DUPLICATE: 0, BOTH_TEAMS: 0, INDETERMINATE: 0 },
      clusters: [],
      clustersTruncated: false,
      maxClusterExamples: MAX_CLUSTER_EXAMPLES,
    },
    inflationCheck: { topGoals: [], topSaves: [] },
    warnings: [],
  }

  // ── 1. Paginated scan: prefix census + cluster map of slim records ───────
  const clusters = new Map() // clusterKey -> SlimDoc[]
  let docsMissingKey = 0
  let docsMissingGender = 0
  let docsMissingTeamName = 0
  let docsMissingGameDate = 0

  for await (const doc of iterateGames()) {
    const slim = slimDoc(doc)
    report.gamesScanned++

    // Full-corpus prefix census — counts every doc, regardless of cluster eligibility.
    const bucket = docPrefixBucketDetailed(slim.id)
    report.overview.docsByPrefix[bucket]++
    if (slim.statsProcessed) report.overview.processedByPrefix[bucket]++

    if (!slim.gender)   docsMissingGender++
    if (!slim.gameDate) docsMissingGameDate++
    if (!slim.home || !slim.away) docsMissingTeamName++
    if (!slim.gender || !slim.gameDate || !slim.home || !slim.away) {
      docsMissingKey++
      continue
    }
    const key = `${slim.gender}|${slim.gameDate}|${sortedTeamPair(slim.home, slim.away)}`
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key).push(slim)
  }

  if (docsMissingKey > 0) {
    report.warnings.push(
      `${docsMissingKey} games excluded from cluster analysis ` +
      `(missingGender=${docsMissingGender}, missingGameDate=${docsMissingGameDate}, ` +
      `missingTeamName=${docsMissingTeamName}).`
    )
  }

  // ── 2. Classify each duplicate cluster ───────────────────────────────────
  let dupClustersMissingRosters = 0
  const allClusterRecords = []

  for (const [key, slims] of clusters.entries()) {
    if (slims.length < 2) continue

    report.duplicates.totalClusters++
    report.duplicates.totalExtraDocs += slims.length - 1

    const ids = slims.map(s => s.id)
    const ncaaCount = ids.filter(id => docPrefixBucket(id) === 'ncaa').length
    const legacyCount = ids.length - ncaaCount

    let bucket
    if (ncaaCount === ids.length) bucket = 'ncaaOnly'
    else if (legacyCount === ids.length) bucket = 'legacyOnly'
    else bucket = 'mixed'
    report.duplicates.byPrefixBucket[bucket]++

    // Duplicate type: compare playerId sets across docs.
    //   TRUE_DUPLICATE — first-pair roster overlap ≥ 50% of the smaller side
    //   BOTH_TEAMS     — first-pair rosters entirely disjoint
    //   INDETERMINATE  — partial overlap, or rosters missing
    const haveAllRosters = slims.every(s => s.playerIds.size > 0)
    let dupType = 'INDETERMINATE'
    let overlap = null
    let overlapRatio = null
    if (haveAllRosters) {
      const a = slims[0].playerIds
      const b = slims[1].playerIds
      let count = 0
      for (const x of a) if (b.has(x)) count++
      overlap = count
      const minSize = Math.min(a.size, b.size)
      overlapRatio = minSize > 0 ? overlap / minSize : 0
      if (overlap === 0)         dupType = 'BOTH_TEAMS'
      else if (overlapRatio >= 0.5) dupType = 'TRUE_DUPLICATE'
      else                       dupType = 'INDETERMINATE'
    } else {
      dupClustersMissingRosters++
    }
    report.duplicates.byDuplicateType[dupType]++

    allClusterRecords.push({
      key,
      gender:   slims[0].gender,
      gameDate: slims[0].gameDate,
      home:     slims[0].home,
      away:     slims[0].away,
      div:      slims[0].div,
      docCount: ids.length,
      docIds:   ids,
      prefixBucket: bucket,
      duplicateType: dupType,
      rosterOverlap: overlap,
      rosterOverlapRatio: overlapRatio,
      rosterSizes:     slims.map(s => s.playerCount),
      boxScoreFetched: slims.map(s => s.boxScoreFetched),
      statsProcessed:  slims.map(s => s.statsProcessed),
    })
  }

  // Cap the clusters array in the report so the Firestore doc stays well
  // under the 1 MiB document size limit. Sort to keep the most informative
  // examples first: more docs in cluster, then more statsProcessed=true.
  if (allClusterRecords.length > MAX_CLUSTER_EXAMPLES) {
    report.duplicates.clustersTruncated = true
    allClusterRecords.sort((x, y) => {
      if (y.docCount !== x.docCount) return y.docCount - x.docCount
      const xp = x.statsProcessed.filter(Boolean).length
      const yp = y.statsProcessed.filter(Boolean).length
      return yp - xp
    })
    report.duplicates.clusters = allClusterRecords.slice(0, MAX_CLUSTER_EXAMPLES)
  } else {
    report.duplicates.clusters = allClusterRecords
  }

  if (dupClustersMissingRosters > 0) {
    report.warnings.push(
      `${dupClustersMissingRosters} duplicate clusters had docs missing playerStats[] — classified INDETERMINATE.`
    )
  }
  if (report.duplicates.totalClusters === 0) {
    report.warnings.push(
      'STOP-CONDITION: No duplicate clusters found on (gender, gameDate, sortedPair([home.name, away.name])). ' +
      'If leaderboards are still inflated, the dedup key is wrong. Do NOT broaden — surface to Deemer.'
    )
  }

  // ── 3. Canonical & raw appearance counts per player ──────────────────────
  // canonical = de-duped by cluster key  (one slot per unique game)
  // raw       = every individual doc that was aggregated (dupes count)
  // Both restrict to docs with statsProcessed=true, since those are exactly
  // the docs that contributed to the /playerStats aggregate.
  const canonicalAppearances = new Map() // playerId -> Set(clusterKey)
  const rawAppearances       = new Map() // playerId -> Set(docId)

  for (const [clusterKey, slims] of clusters.entries()) {
    const processed = slims.filter(s => s.statsProcessed)
    if (processed.length === 0) continue
    const union = new Set()
    for (const s of processed) {
      for (const pid of s.playerIds) {
        union.add(pid)
        if (!rawAppearances.has(pid)) rawAppearances.set(pid, new Set())
        rawAppearances.get(pid).add(s.id)
      }
    }
    for (const pid of union) {
      if (!canonicalAppearances.has(pid)) canonicalAppearances.set(pid, new Set())
      canonicalAppearances.get(pid).add(clusterKey)
    }
  }

  // ── 4. Inflation check on current top-25 by goals + top-25 by saves ──────
  async function fetchTop(stat) {
    const snap = await db.collection('playerStats')
      .where('season', '==', SEASON)
      .orderBy(stat, 'desc')
      .limit(25)
      .get()
    const rows = []
    for (const d of snap.docs) {
      const r = d.data()
      const canon = canonicalAppearances.get(r.playerId)?.size ?? 0
      const raw   = rawAppearances.get(r.playerId)?.size ?? 0
      const storedGp = r.gp ?? 0
      rows.push({
        playerId: r.playerId,
        name:     r.name || `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        team:     r.teamName || r.team || null,
        gender:   r.gender || null,
        div:      r.div || null,
        storedGp,
        storedGoals:   r.goals   ?? 0,
        storedAssists: r.assists ?? 0,
        storedSaves:   r.saves   ?? 0,
        distinctGames_canonical: canon,
        distinctGames_raw:       raw,
        inflationDelta:          storedGp - canon,
        flagged:                 storedGp > canon,
      })
    }
    return rows
  }

  report.inflationCheck.topGoals = await fetchTop('goals')
  report.inflationCheck.topSaves = await fetchTop('saves')

  report.completedAt = new Date().toISOString()
  report.durationMs  = Date.now() - startedAt

  // ── 5. Write the ONE permitted summary doc ────────────────────────────────
  const docId = `stats-inflation-${startedAt}`
  await db.collection('diagnostics').doc(docId).set(report)

  // ── 6. Console summary (full report is in the Firestore doc) ─────────────
  const flaggedGoals = report.inflationCheck.topGoals.filter(r => r.flagged).length
  const flaggedSaves = report.inflationCheck.topSaves.filter(r => r.flagged).length

  console.log('[diagnostic] ════════════════════════════════════════════════════')
  console.log(`[diagnostic] games scanned:        ${report.gamesScanned}`)
  console.log(`[diagnostic] docs by prefix:       ${JSON.stringify(report.overview.docsByPrefix)}`)
  console.log(`[diagnostic] processed by prefix:  ${JSON.stringify(report.overview.processedByPrefix)}`)
  console.log(`[diagnostic] duplicate clusters:   ${report.duplicates.totalClusters}`)
  console.log(`[diagnostic] extra (dupe) docs:    ${report.duplicates.totalExtraDocs}`)
  console.log(`[diagnostic] dup prefix buckets:   ${JSON.stringify(report.duplicates.byPrefixBucket)}`)
  console.log(`[diagnostic] duplicate types:      ${JSON.stringify(report.duplicates.byDuplicateType)}`)
  console.log(`[diagnostic] clusters truncated:   ${report.duplicates.clustersTruncated} (cap ${MAX_CLUSTER_EXAMPLES})`)
  console.log(`[diagnostic] flagged top-25 goals: ${flaggedGoals}/${report.inflationCheck.topGoals.length}`)
  console.log(`[diagnostic] flagged top-25 saves: ${flaggedSaves}/${report.inflationCheck.topSaves.length}`)
  if (report.warnings.length > 0) {
    console.log('[diagnostic] warnings:')
    for (const w of report.warnings) console.log(`[diagnostic]   - ${w}`)
  }
  console.log(`[diagnostic] saved /diagnostics/${docId}`)
  console.log('[diagnostic] ════════════════════════════════════════════════════')

  const payload = {
    ok: true,
    docId,
    summary: {
      gamesScanned: report.gamesScanned,
      docsByPrefix: report.overview.docsByPrefix,
      processedByPrefix: report.overview.processedByPrefix,
      duplicateClusters: report.duplicates.totalClusters,
      extraDocs: report.duplicates.totalExtraDocs,
      byPrefixBucket: report.duplicates.byPrefixBucket,
      byDuplicateType: report.duplicates.byDuplicateType,
      clustersTruncated: report.duplicates.clustersTruncated,
      flaggedTopGoals: flaggedGoals,
      flaggedTopSaves: flaggedSaves,
      warnings: report.warnings,
    },
  }

  if (opts.full) {
    payload.inflationCheck = report.inflationCheck
    payload.clusters       = report.duplicates.clusters
  }

  return payload
}
