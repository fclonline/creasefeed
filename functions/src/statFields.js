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

// A player earns a game played if any counted stat is non-zero, OR they started.
//
// `participated` is useless here: sampled D1 box scores show it set on 100% of
// blank lines (118 of 118), i.e. on everyone listed whether they took the field
// or not. Counting it would add ~15 phantom games per game.
//
// `starter` is different -- a blank line on a starter means they took the field
// and recorded nothing, which is a real game played. Blank starters run ~4.5 per
// game against ~10.5 blank non-starters (who may never have entered, and can't
// be distinguished from those who did).
//
// This is what closed the last gap against ncaa.com: Ayla Galloway started
// Mercer's 2026-02-25 game and recorded nothing. Without the starter clause she
// showed 19 games and 9.84 draws/game; with it, 20 and 9.35 -- ncaa.com exactly.
export function contributed(p) {
  if (!p) return false
  if (p.starter === true) return true
  for (const f of COUNTER_FIELDS) {
    if ((p[f] || 0) !== 0) return true
  }
  return false
}

// ── Position ────────────────────────────────────────────────────────────────
// The NCAA box score reports `position` PER GAME, and leaves it blank in most
// of them. Sampled across Utah and North Carolina: 1,489 blank appearances vs
// 373 with a value, and 55 of 397 players were blank in some games and set in
// others. Both writers used to take whichever game they happened to see -- the
// live aggregator overwrote on every game (so the last one, usually blank, won)
// and the rebuild kept the first. Either way a known position was thrown away:
// 25 of the men's D1 top 40 scorers rendered as "—", Luke McNamara included.
//
// `*` is the feed's own placeholder, not a position, so it counts as blank.
export function hasPosition(raw) {
  const v = String(raw || '').trim()
  return v !== '' && v !== '*'
}
