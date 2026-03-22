import { useState } from 'react'
import { SCHEDULE_DAYS } from '../data/mockData.js'
import { GameModal, chip, ac } from '../components/shared.jsx'

const CONF_FILTERS = ['All', 'ACC', 'Big Ten', 'Ivy', 'Patriot', 'CAA', 'MAAC']

export default function SchedulePage({ gender, division, isW }) {
  const [confFilter,   setConfFilter]   = useState('All')
  const [genderFilter, setGenderFilter] = useState('All')
  const [selectedId,   setSelectedId]   = useState(null)
  const ac_ = chip(isW)

  const days = SCHEDULE_DAYS.map(day => ({
    ...day,
    games: day.games.filter(g => {
      const confOk   = confFilter === 'All' || g.conf === confFilter
      const genderOk = genderFilter === 'All' || g.gender === genderFilter
      return confOk && genderOk
    })
  })).filter(d => d.games.length > 0)

  const allGames   = SCHEDULE_DAYS.flatMap(d => d.games)
  const selected   = selectedId ? allGames.find(g => g.id === selectedId) : null
  const selIsW     = selected?.gender === 'W'

  return (
    <div className="schedule-page">
      <div className="filter-row">
        <span className="filter-label">Gender</span>
        {[{ v: 'All', l: 'Both' }, { v: 'M', l: "Men's" }, { v: 'W', l: "Women's" }].map(({ v, l }) => (
          <button key={v} className={`filter-chip ${genderFilter === v ? ac_ : ''}`} onClick={() => setGenderFilter(v)}>{l}</button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--border2)', margin: '0 8px' }} />
        <span className="filter-label">Conf</span>
        {CONF_FILTERS.map(c => (
          <button key={c} className={`filter-chip ${confFilter === c ? ac_ : ''}`} onClick={() => setConfFilter(c)}>{c}</button>
        ))}
      </div>

      {days.map(day => (
        <div key={day.label}>
          <div className="sched-day-header">{day.label}</div>
          {day.games.map(g => {
            const hasScore = g.status !== 'upcoming'
            const awayWin  = hasScore && g.away.score > g.home.score
            const gIsW     = g.gender === 'W'
            return (
              <div
                key={g.id}
                className={`sched-card ${g.status} ${gIsW ? 'w' : ''}`}
                onClick={() => setSelectedId(g.id)}
              >
                <div className={`sched-time ${g.status} ${gIsW ? 'w' : ''}`}>
                  {g.status === 'live' ? g.period : g.time}
                </div>
                <div className="sched-matchup">
                  <div className="sched-team">
                    {g.away.rank && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: 'var(--muted)' }}>#{g.away.rank}</span>}
                    {g.away.name}
                    <span className="away-tag">AWAY</span>
                  </div>
                  <div className="sched-team">
                    {g.home.rank && <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: 'var(--muted)' }}>#{g.home.rank}</span>}
                    {g.home.name}
                  </div>
                  <div className="sched-badges">
                    <span className="sched-conf-badge">{g.conf}</span>
                    <span className="sched-gender-badge" style={{ color: gIsW ? 'var(--women)' : 'var(--accent)' }}>
                      {gIsW ? "Women's" : "Men's"}
                    </span>
                  </div>
                </div>
                <div>
                  {hasScore && (
                    <div className="sched-score" style={{ color: awayWin ? 'var(--muted)' : 'var(--text)' }}>
                      {g.away.score} – {g.home.score}
                    </div>
                  )}
                </div>
                <div className="sched-location">{g.loc}</div>
              </div>
            )
          })}
        </div>
      ))}

      {selected && (
        <GameModal
          game={{ ...selected, loc: selected.loc, conf: selected.conf }}
          onClose={() => setSelectedId(null)}
          isW={selIsW}
        />
      )}
    </div>
  )
}
