import { useState, useEffect } from 'react'
import { usePolls } from '../hooks/useScores.jsx'
import { chip, ac } from '../components/shared.jsx'

const POLL_TABS_M = [
  { key: 'imlca',            label: 'USILA Coaches' },
  { key: 'inside-lacrosse-m', label: 'KANE Media Poll' },
  { key: 'rpi',              label: 'NCAA RPI' },
]
const POLL_TABS_W = [
  { key: 'iwlca',            label: 'IWLCA Coaches' },
  { key: 'inside-lacrosse-w', label: 'KANE Media Poll' },
  { key: 'rpi',              label: 'NCAA RPI' },
]

function MovementCell({ movement }) {
  if (!movement || movement === 0) return <span className="poll-move poll-move-none">—</span>
  if (movement > 0) return <span className="poll-move poll-move-up">▲{movement}</span>
  return <span className="poll-move poll-move-down">▼{Math.abs(movement)}</span>
}

export default function PollsPage({ gender, division, isW }) {
  const tabs = gender === 'M' ? POLL_TABS_M : POLL_TABS_W
  const defaultTab = gender === 'M' ? 'imlca' : 'iwlca'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [rpiDiv, setRpiDiv] = useState(division || '1')
  const ac_ = chip(isW)

  const { polls, loading } = usePolls(gender, rpiDiv)

  // Reset tab when gender changes
  useEffect(() => {
    setActiveTab(gender === 'M' ? 'imlca' : 'iwlca')
  }, [gender])

  const validKeys = tabs.map(t => t.key)
  const currentTab = validKeys.includes(activeTab) ? activeTab : tabs[0].key

  // Get poll data for active tab
  let entries = []
  let pollName = ''
  let updatedAt = null
  const isRPI = currentTab === 'rpi'

  if (!loading && polls) {
    if (isRPI) {
      const rpi = polls.rpi
      if (rpi) {
        entries = rpi.entries || []
        pollName = `NCAA RPI — D${rpiDiv}`
        updatedAt = rpi.updatedAt || rpi.fetchedAt
      }
    } else {
      const match = (polls.coachesPolls || []).find(p => p.pollId === currentTab)
      if (match) {
        entries = match.entries || []
        pollName = match.source || match.pollId
        updatedAt = match.fetchedAt
      }
    }
  }

  const formattedDate = updatedAt
    ? (typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    : null

  return (
    <div className="polls-page">
      {/* tab nav */}
      <div className="polls-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`stat-tab ${currentTab === t.key ? ac_ : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: "'Barlow Condensed'", fontSize: 11, color: 'var(--muted)', letterSpacing: '1px' }}>
          {gender === 'M' ? "Men's" : "Women's"} · D{division} · 2026 Season
        </div>
      </div>

      {/* RPI division toggle */}
      {isRPI && (
        <div className="filter-row" style={{ paddingTop: 8 }}>
          <span className="filter-label">Division</span>
          {['1', '2', '3'].map(d => (
            <button key={d} className={`filter-chip ${rpiDiv === d ? ac_ : ''}`} onClick={() => setRpiDiv(d)}>D{d}</button>
          ))}
        </div>
      )}

      {/* poll header */}
      <div className="polls-header">
        <div className="polls-title">{pollName || tabs.find(t => t.key === currentTab)?.label || 'Rankings'}</div>
        {formattedDate && <div className="polls-updated">Updated {formattedDate}</div>}
      </div>

      {/* loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontFamily: "'Barlow Condensed'", fontSize: 16 }}>
          Loading polls...
        </div>
      )}

      {/* empty state */}
      {!loading && entries.length === 0 && (
        <div className="polls-empty">
          <div className="polls-empty-title">NO POLL DATA</div>
          <div className="polls-empty-sub">
            This poll hasn't been scraped yet. The <code>scrapePollsJob</code> Cloud Function runs Tuesdays at 10am ET.
          </div>
        </div>
      )}

      {/* poll table */}
      {!loading && entries.length > 0 && (
        <div className="polls-table-wrap">
          <table className="polls-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Move</th>
                <th>Team</th>
                <th>{isRPI ? 'Conference' : 'Record'}</th>
                {!isRPI && <th>Points</th>}
                <th>Prev</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 25).map((e, i) => (
                <tr key={i}>
                  <td><span className="polls-rank">{e.rank || i + 1}</span></td>
                  <td><MovementCell movement={e.movement} /></td>
                  <td><span className="polls-team">{e.team}</span></td>
                  <td><span className="polls-record">{isRPI ? (e.conf || '—') : (e.record || '—')}</span></td>
                  {!isRPI && <td><span className="polls-points">{e.points || '—'}</span></td>}
                  <td><span className="polls-prev">{e.prevRank || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
