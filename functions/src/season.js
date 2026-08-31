// ============================================================================
// functions/src/season.js
//
// One definition of "what season is this?", shared by every scraper.
//
// NCAA lacrosse's championship season runs Feb-May, so a season is named for the
// calendar year of its spring: games in Feb-May 2027 are the 2027 season.
//
// Fall ball (Sept-Nov) is preseason for the FOLLOWING spring, so a game played
// in Oct 2026 belongs to the 2027 season. That's why the cutover is midyear
// rather than Jan 1 -- it keeps a fall-ball game and the spring it leads into
// under one season label.
//
// NOTE: the NCAA API does not publish fall lacrosse at all (verified 2026-08-31:
// every fall date returns 0 games while spring dates return games). Fall ball
// therefore has to arrive from some other source, but when it does, this is the
// season it belongs to.
// ============================================================================

const SEASON_CUTOVER_MONTH = 6   // 0-indexed: July

// Season label for a JS Date.
export function seasonForDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  return String(d.getMonth() >= SEASON_CUTOVER_MONTH ? year + 1 : year)
}

// Season label for a YYYYMMDD string as stored on game docs (`gameDate`).
export function seasonForGameDate(gameDate) {
  const s = String(gameDate || '')
  if (!/^\d{8}$/.test(s)) return null
  const year = parseInt(s.slice(0, 4), 10)
  const month = parseInt(s.slice(4, 6), 10) - 1
  return String(month >= SEASON_CUTOVER_MONTH ? year + 1 : year)
}

// The season we are currently in.
export function currentSeason() {
  return seasonForDate(new Date())
}

// Seasons a scraper should touch on any given run: the current one, plus the
// previous one through the summer so late corrections to a just-finished season
// still land. In Aug 2026 that is ['2027', '2026'].
export function activeSeasons(date = new Date()) {
  const cur = seasonForDate(date)
  const prev = String(parseInt(cur, 10) - 1)
  return cur === prev ? [cur] : [cur, prev]
}
