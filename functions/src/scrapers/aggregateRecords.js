// ============================================================================
// functions/src/scrapers/aggregateRecords.js
//
// Aggregates every team's win-loss record (overall + conference) from the
// finalized games already stored in Firestore, and writes one compact doc per
// gender to /records/{M|W}. The Teams page reads these two docs in a single
// query each, so no per-team scanning is needed on the client.
//
// Re-run is idempotent — it recomputes from scratch each time.
// ============================================================================

import { db } from '../firebase.js'

const SEASON = '2026'

// Must stay in sync with normTeam() in src/data/programs.js so the frontend can
// match a program to its aggregated record by normalized name.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')
function normTeam(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

export async function aggregateRecords() {
  // Project to only the fields we need. Game docs also store play-by-play and
  // box scores (large arrays); without select() the full season OOMs the worker.
  const snap = await db.collection('games')
    .where('season', '==', SEASON)
    .where('status', '==', 'final')
    .select('gender', 'div', 'home', 'away', 'gameDate', '_source')
    .get()

  // Dedupe: the games collection holds both canonical NCAA docs and stale
  // Sidearm docs for the same game, which would double-count records. Key each
  // real game by date + the two teams; prefer the NCAA-API doc on collision.
  const uniqueGames = new Map()
  snap.forEach((docSnap) => {
    const g = docSnap.data()
    if (g.gender !== 'M' && g.gender !== 'W') return
    const home = g.home || {}
    const away = g.away || {}
    if (home.score == null || away.score == null) return
    if (!home.name || !away.name || home.name === 'Home' || away.name === 'Away') return // placeholder

    const key = `${g.gender}|${g.gameDate || ''}|${[normTeam(home.name), normTeam(away.name)].sort().join('~')}`
    const existing = uniqueGames.get(key)
    if (!existing || (g._source === 'ncaa-api' && existing._source !== 'ncaa-api')) {
      uniqueGames.set(key, g)
    }
  })

  // gender -> teamKey -> record
  const buckets = { M: new Map(), W: new Map() }
  let counted = 0

  for (const g of uniqueGames.values()) {
    const gender = g.gender
    const home = g.home || {}
    const away = g.away || {}
    if (home.score === away.score) continue // skip ties / bad data

    const isConfGame = !!home.conf && !!away.conf && home.conf === away.conf
    const bucket = buckets[gender]

    for (const [side, opp] of [[home, away], [away, home]]) {
      const seo = (side.teamSeo || '').trim().toLowerCase()
      const key = seo || normTeam(side.name)
      if (!key) continue

      let rec = bucket.get(key)
      if (!rec) {
        rec = {
          seo,
          name: side.name || '',
          nameKey: normTeam(side.name),
          div: g.div || '',
          conf: side.conf || '',
          w: 0, l: 0, confW: 0, confL: 0,
        }
        bucket.set(key, rec)
      }

      const won = side.score > opp.score
      if (won) { rec.w++; if (isConfGame) rec.confW++ } else { rec.l++; if (isConfGame) rec.confL++ }
    }
    counted++
  }

  const updatedAt = Date.now()
  for (const gender of ['M', 'W']) {
    const teams = Array.from(buckets[gender].values())
    await db.collection('records').doc(gender).set({ season: SEASON, updatedAt, teams })
  }

  const result = { games: counted, mTeams: buckets.M.size, wTeams: buckets.W.size }
  console.log(`[aggregateRecords] ✓ ${counted} final games → M:${result.mTeams} teams, W:${result.wTeams} teams`)
  return result
}
