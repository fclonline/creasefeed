import { useState, useEffect } from 'react'
import { usePolls } from '../hooks/useScores.jsx'
import { chip, ac } from '../components/shared.jsx'
import { pollIdsFor } from '../api/firestore.js'

// Tabs are built per gender + division from the same ID map the data layer uses,
// so a tab can never point at a poll the scrapers don't write.
const POLL_LABELS = { usila: 'USILA Coaches', usal: 'USA Lacrosse' }

function pollTabs(gender, division) {
  const tabs = pollIdsFor(gender, division).map(key => ({
    key,
    label: key.startsWith('usal') ? POLL_LABELS.usal : POLL_LABELS.usila,
  }))
  return [...tabs, { key: 'rpi', label: 'NCAA RPI' }]
}

function formatPollDate(iso) {
  const d = new Date(`${iso}T12:00:00`)
  return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MovementCell({ movement }) {
  if (!movement || movement === 0) return <span className="poll-move poll-move-none">—</span>
  if (movement > 0) return <span className="poll-move poll-move-up">▲{movement}</span>
  return <span className="poll-move poll-move-down">▼{Math.abs(movement)}</span>
}

export default function PollsPage({ gender, division, isW }) {
  const div  = division || '1'
  const tabs = pollTabs(gender, div)
  const [activeTab, setActiveTab] = useState(tabs[0].key)
  const ac_ = chip(isW)

  const { polls, loading } = usePolls(gender, div)

  // Reset tab when gender or division changes
  useEffect(() => {
    setActiveTab(pollTabs(gender, div)[0].key)
  }, [gender, div])

  const validKeys = tabs.map(t => t.key)
  const currentTab = validKeys.includes(activeTab) ? activeTab : tabs[0].key

  // Get poll data for active tab
  let entries = []
  let pollName = ''
  let asOf = null
  const isRPI = currentTab === 'rpi'

  if (!loading && polls) {
    if (isRPI) {
      const rpi = polls.rpi
      if (rpi) {
        entries = rpi.entries || []
        pollName = `NCAA RPI — D${div}`
        if (rpi.fetchedAt) asOf = `Updated ${new Date(rpi.fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      }
    } else {
      const match = (polls.coachesPolls || []).find(p => p.pollId === currentTab)
      if (match) {
        entries = match.entries || []
        pollName = match.source || match.pollId
        // Show the poll's own week and release date, not when we scraped it.
        asOf = [match.weekLabel, match.pollDate && formatPollDate(match.pollDate)].filter(Boolean).join(' · ') || null
      }
    }
  }

  const showRecord = isRPI || entries.some(e => e.record)
  const showPoints = !isRPI && entries.some(e => e.points)

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
          {gender === 'M' ? "Men's" : "Women's"} · D{div} · 2026 Season
        </div>
      </div>

      {/* poll header */}
      <div className="polls-header">
        <div className="polls-title">{pollName || tabs.find(t => t.key === currentTab)?.label || 'Rankings'}</div>
        {asOf && <div className="polls-updated">{asOf}</div>}
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
            {isRPI && div !== '1'
              ? 'NCAA RPI is currently available for Division I only.'
              : 'This poll isn\'t available yet. Polls refresh nightly once they\'re published.'}
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
                {isRPI && <th>Conference</th>}
                {showRecord && <th>Record</th>}
                {showPoints && <th>Points</th>}
                <th>Prev</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 25).map((e, i) => (
                <tr key={`${e.rank}-${e.team}`}>
                  <td><span className="polls-rank">{e.rank || i + 1}</span></td>
                  <td><MovementCell movement={e.movement} /></td>
                  <td><span className="polls-team">{e.team}</span></td>
                  {isRPI && <td><span className="polls-record">{e.conf || '—'}</span></td>}
                  {showRecord && <td><span className="polls-record">{e.record || '—'}</span></td>}
                  {showPoints && <td><span className="polls-points">{e.points || '—'}{e.firstPlaceVotes ? ` (${e.firstPlaceVotes})` : ''}</span></td>}
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
