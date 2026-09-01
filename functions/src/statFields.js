// ============================================================================
// functions/src/statFields.js
//
// One list of the per-game counter fields that roll up into /playerStats, and
// one definition of "did this player actually play?".
//
// WHY THIS IS SHARED: the participation gate and the accumulation list have to
// agree. They didn't, and it silently destroyed data. The gate accepted only 10
// of the 31 counted fields, and `drawControls` was not among them -- so a draw
// specialist who won 19 draws but took no shot, scooped no ground ball and
// committed no turnover was treated as a bench player who never dressed, and
// her whole line for that game was discarded.
//
// Ayla Galloway (Mercer, W D1) appeared in all 20 Mercer box scores with draws
// in 19 of them, and was credited with 1 game / 11 draws. Her true totals --
// 20 games, 187 draw controls -- match NCAA.com exactly once the gate accepts
// draw controls. Mae Murphy, Abby Moran and Anna Vigilone were hit the same way.
//
// Deriving the gate from COUNTERS means a field can never again be accumulated
// without also counting as evidence the player was on the field.
// ============================================================================

export const COUNTER_FIELDS = [
  // Offense
  'goals', 'assists', 'points', 'shots', 'sog', 'freePositionShots',
  'groundBalls', 'drawControls', 'turnovers', 'causedTurnovers',
  // Goal types
  'gameWinningGoals', 'overtimeGoals', 'powerplayGoals', 'shortHandedGoals',
  'freePositionGoals',
  // Penalties
  'penaltyCount', 'penaltyMinutes', 'majorPenalties', 'minorPenalties',
  // Goalie
  'saves', 'goalsAllowed', 'goalieMinutes', 'shutouts', 'goalieGamesStarted',
  'goalieGamesPlayed', 'goalieLosses', 'combinedShutouts',
  'ppGoalsAllowed', 'shGoalsAllowed', 'enGoalsAllowed', 'soGoalsAllowed',
]

// A player earns a game played if any counted stat is non-zero.
//
// The NCAA API marks every dressed player participated:true, including bench
// players with an all-zero line, so `participated` cannot be used for this --
// it would inflate gp for everyone who suited up. Requiring one non-zero stat
// is the closest available proxy for actually taking the field.
export function contributed(p) {
  if (!p) return false
  for (const f of COUNTER_FIELDS) {
    if ((p[f] || 0) !== 0) return true
  }
  return false
}
