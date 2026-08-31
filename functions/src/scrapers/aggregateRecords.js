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
import { currentSeason, activeSeasons } from '../season.js'

// Which season's records to build. Deliberately NOT currentSeason(): in the
// offseason that is already next spring, which has no games yet, and building
// against it would empty /records and blank every W-L on the Teams page.
// Follow the data instead -- the season of the most recent final game -- so the
// rollover happens on its own the first time a new season's game goes final.
async function resolveDataSeason() {
  // Newest season first; take the first that actually has a final game. Uses
  // only equality filters, so it rides the existing (season, status, ...)
  // composite index and needs no new one.
  for (const season of activeSeasons()) {
    const snap = await db.collection('games')
      .where('season', '==', season)
      .where('status', '==', 'final')
      .limit(1)
      .get()
    if (!snap.empty) return season
  }
  return currentSeason()
}

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

export async function aggregateRecords(seasonArg = null) {
  const SEASON = seasonArg || await resolveDataSeason()
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
  let droppedSidearm = 0
  snap.forEach((docSnap) => {
    const g = docSnap.data()

    // Drop the abandoned Sidearm scraper's docs outright (2,108 of them as of
    // 2026-08). They carry no gameDate, so their dedupe key ("W||a~b") never
    // collides with the real dated ncaa-api key and they were double-counted:
    // Stanford W showed 41 games against a true 22. They also have no teamSeo
    // and no box score, and every game they describe is already covered by an
    // ncaa-api doc, so nothing is lost by ignoring them.
    if (g._source === 'sidearm-boxscore-header') { droppedSidearm++; return }

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

      // Key on the normalized NAME, not `seo || name`. teamSeo is present on
      // some game docs and missing on others for the same team, and keying on
      // it split those teams into two buckets — Penn St. W ended up as both
      // 12-7 (seo "penn-st") and 0-1 (no seo). The frontend indexes both under
      // the same nameKey, so the stray bucket won and served a wrong record.
      // seo is still carried as metadata, filled from whichever doc has one.
      const key = normTeam(side.name)
      if (!key) continue

      let rec = bucket.get(key)
      if (!rec) {
        rec = {
          seo,
          name: side.name || '',
          nameKey: key,
          div: g.div || '',
          conf: side.conf || '',
          w: 0, l: 0, confW: 0, confL: 0,
        }
        bucket.set(key, rec)
      }
      if (!rec.seo && seo) rec.seo = seo
      if (!rec.conf && side.conf) rec.conf = side.conf

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

  // Publish the season the site should display. The frontend reads this, so a
  // rollover needs no redeploy.
  await db.collection('config').doc('site').set(
    { season: SEASON, recordsUpdatedAt: updatedAt }, { merge: true }
  )

  const result = { season: SEASON, games: counted, mTeams: buckets.M.size, wTeams: buckets.W.size, droppedSidearm }
  console.log(`[aggregateRecords] ✓ season ${SEASON}: ${counted} final games → M:${result.mTeams} teams, W:${result.wTeams} teams (dropped ${droppedSidearm} sidearm docs)`)
  return result
}
