// ============================================================================
// src/components/PollCard.jsx — the one poll card, used on every layout
// (Scores sidebar on desktop and stacked on mobile, off-season home).
// Loading → skeleton rows. No data → "Poll returns when rankings are released."
// ============================================================================
import { useStandings } from '../hooks/useScores.jsx'

export const POLL_EMPTY_TEXT = 'Poll returns when rankings are released.'

function PollSkeleton({ rows }) {
  return (
    <div className="poll-skeleton" aria-busy="true" aria-label="Loading poll">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="poll-sk-row" />)}
    </div>
  )
}

export default function PollCard({ gender, division, limit, title, onFullPoll, className = '' }) {
  const { standings, source, weekLabel, loading } = useStandings(gender, division)
  const rows = limit ? standings.slice(0, limit) : standings
  const sourceName = source ? source.replace(/ Magazine$/, '') : ''
  const sub = [sourceName, `${gender === 'M' ? "Men's" : "Women's"} D${division}`, weekLabel].filter(Boolean).join(' · ')

  return (
    <section className={`widget poll-card ${className}`}>
      <div className="widget-hd">
        <h2 className="widget-title">{title || 'Top 20'}</h2>
        <span className="widget-sub">{sub}</span>
      </div>
      {loading ? (
        <PollSkeleton rows={limit || 5} />
      ) : rows.length === 0 ? (
        <div className="widget-empty">{POLL_EMPTY_TEXT}</div>
      ) : (
        <>
          <table className="std-table">
            <thead><tr><th scope="col">Team</th><th scope="col">Record</th><th scope="col">Move</th></tr></thead>
            <tbody>
              {rows.map(s => {
                // Malformed records in the stored poll (e.g. "1701") render as a dash.
                const rec = /^\d{1,2}$/.test(s.w) && /^\d{1,2}$/.test(s.l) ? `${s.w}-${s.l}` : '—'
                return (
                  <tr key={`${s.rank}-${s.team}`}>
                    <td><span className="std-rank">{s.rank}</span>{s.team}</td>
                    <td>{rec}</td>
                    <td className={s.movement > 0 ? 'poll-up' : s.movement < 0 ? 'poll-down' : 'poll-flat'}>
                      {s.movement > 0 ? `▲${s.movement}` : s.movement < 0 ? `▼${Math.abs(s.movement)}` : '—'}
                      <span className="sr-only">{s.movement > 0 ? ' up' : s.movement < 0 ? ' down' : ' no change'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {onFullPoll && (
            <div className="poll-more"><button type="button" className="link-btn" onClick={onFullPoll}>Full Top 20 →</button></div>
          )}
        </>
      )}
    </section>
  )
}
