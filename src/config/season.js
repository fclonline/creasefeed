// ============================================================================
// src/config/season.js — season copy + dates Deemer controls by hand.
//
// SEASON_YEAR drives labels and copy ONLY. Firestore queries keep reading the
// data season from /config/site (see getSeason() in src/api/firestore.js), so
// the off-season "last final" still comes from the season that has games.
// ============================================================================

export const SEASON_YEAR = 2027

// 'YYYY-MM-DD' — Deemer fills in. null = no countdown and no "season opens" copy.
export const SEASON_START = null

// Firestore game doc ids (e.g. 'ncaa-6599996') for the national championship
// game, per gender. When set, the off-season ticker reads "2026 champion: …";
// when null it reads "Last final: …". Deemer fills these in.
export const CHAMPIONSHIP_GAME_IDS = { M: null, W: null }

// Parsed SEASON_START as a local-midnight Date, or null.
export function seasonStartDate() {
  if (!SEASON_START) return null
  const [y, m, d] = SEASON_START.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// Whole days from today until SEASON_START (0 on opening day), or null.
export function daysUntilSeason(now = new Date()) {
  const start = seasonStartDate()
  if (!start) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((start - today) / 86400000)
  return days >= 0 ? days : null
}

// "Feb 14" style label for SEASON_START, or null.
export function seasonStartLabel() {
  const start = seasonStartDate()
  return start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
}
