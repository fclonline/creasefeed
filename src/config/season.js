// ============================================================================
// src/config/season.js — season copy + dates Deemer controls by hand.
//
// SEASON_YEAR drives labels and copy ONLY. Firestore queries keep reading the
// data season from /config/site (see getSeason() in src/api/firestore.js), so
// the off-season "last final" still comes from the season that has games.
// ============================================================================

export const SEASON_YEAR = 2027

// Opening day per gender, 'YYYY-MM-DD' — Deemer fills in. null = no countdown
// and no "season opens" copy for that gender. 2027: first posted D1 games
// (M: UMass Lowell at Iona, Jan 30; W: UC Davis at USC + Temple at Delaware, Feb 5).
export const SEASON_START = { M: '2027-01-30', W: '2027-02-05' }

// Firestore game doc ids (e.g. 'ncaa-6599996') for the national championship
// game, per gender. When set, the off-season ticker reads "2026 champion: …";
// when null it reads "Last final: …". Deemer fills these in.
export const CHAMPIONSHIP_GAME_IDS = { M: 'ncaa-6599996', W: 'ncaa-6599965' }

// Parsed SEASON_START[gender] as a local-midnight Date, or null.
export function seasonStartDate(gender = 'M') {
  const iso = SEASON_START?.[gender]
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// Whole days from today until the gender's opening day (0 on opening day), or null.
export function daysUntilSeason(gender = 'M', now = new Date()) {
  const start = seasonStartDate(gender)
  if (!start) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((start - today) / 86400000)
  return days >= 0 ? days : null
}

// "Feb 14" style label for the gender's opening day, or null.
export function seasonStartLabel(gender = 'M') {
  const start = seasonStartDate(gender)
  return start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
}
