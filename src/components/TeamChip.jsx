// School-color chip standing in for a licensed logo. Unknown teams get the
// neutral chip (ink background, white abbreviation). Decorative: the team name
// is always rendered next to it, so the chip is aria-hidden.
import { teamChipColors } from '../data/teamColors.js'

export default function TeamChip({ seo, programId, name, size = 36, round = false, className = '' }) {
  const { abbr, bg, fg } = teamChipColors({ seo, programId, name })
  const style = {
    width: size, height: size,
    borderRadius: round ? '50%' : Math.round(size * 0.22),
    background: bg || 'var(--cf-ink)',
    color: fg || '#FFFFFF',
    fontSize: Math.max(10, Math.round(size * (abbr.length > 3 ? 0.31 : 0.37))),
  }
  return <span aria-hidden="true" className={`team-chip ${className}`} style={style}>{abbr}</span>
}
