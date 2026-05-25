import { useState, useMemo, useRef, useEffect } from 'react'
import { useScores } from '../hooks/useScores.jsx'
import { GameModal, CollapsibleFilter, chip, ac } from '../components/shared.jsx'
import { getConferences } from '../data/programs.js'

// Generate all dates from Feb 1 through May 31, 2026
const SEASON_YEAR = 2026
const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']

function buildSeasonDates() {
  const dates = []
  // Feb 1 through May 31
  for (let m = 1; m <= 4; m++) { // 0-indexed: 1=Feb, 4=May
    const daysInMonth = new Date(SEASON_YEAR, m + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(SEASON_YEAR, m, d)
      dates.push(dt)
    }
  }
  return dates
}

const ALL_DATES = buildSeasonDates()

function dateToParam(d) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function SchedulePage({ gender, division, isW }) {
  const today = new Date()
  const todayIdx = ALL_DATES.findIndex(d => isSameDay(d, today))
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0)
  const [confFilter,   setConfFilter]   = useState('All')
  // Default to the user's global gender choice, but let them switch to "Both"
  // here without changing their global preference.
  const [genderFilter, setGenderFilter] = useState(gender)
  const [groupBy,      setGroupBy]      = useState('date')
  const [selectedId,   setSelectedId]   = useState(null)
  const [viewMode,     setViewMode]     = useState('day') // 'day' or 'week'
  const ac_ = chip(isW)
  const dateBarRef = useRef(null)
  const activeBtnRef = useRef(null)

  const selectedDate = ALL_DATES[selectedIdx]
  const selectedMonth = selectedDate?.getMonth()

  // Scroll active date into view
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedIdx])

  // Dynamic conference list based on gender filter
  const confFilters = useMemo(() => {
    const g = genderFilter === 'All' ? undefined : genderFilter
    return getConferences(g)
  }, [genderFilter])

  // Fetch games for the selected date (or week range)
  const dateParam = selectedDate ? dateToParam(selectedDate) : undefined

  // For a single day, fetch both genders
  const { games: mensGames } = useScores('M', dateParam, division)
  const { games: womensGames } = useScores('W', dateParam, division)
  // Filter out stale Sidearm docs with placeholder names
  const allRealGames = [...mensGames, ...womensGames].filter(g =>
    g.home?.name && g.away?.name &&
    g.home.name !== 'Home' && g.away.name !== 'Away'
  )

  // Group games by date
  const gamesByDay = {}
  allRealGames.forEach(g => {
    const dateKey = g.date || (selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    if (!gamesByDay[dateKey]) gamesByDay[dateKey] = []
    gamesByDay[dateKey].push(g)
  })

  const days = Object.entries(gamesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, games]) => {
      const d = new Date(dateStr + 'T12:00:00')
      const isToday = isSameDay(d, today)
      const label = isToday
        ? `TODAY · ${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
        : `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
      return {
        label,
        games: games.filter(g => {
          const confOk   = confFilter === 'All' || g.conf === confFilter
          const genderOk = genderFilter === 'All' || g.gender === genderFilter
          return confOk && genderOk
        })
      }
    })
    .filter(d => d.games.length > 0)

  // Group by conference (alternative view)
  const confGroups = useMemo(() => {
    const filtered = allRealGames.filter(g => {
      const confOk   = confFilter === 'All' || g.conf === confFilter
      const genderOk = genderFilter === 'All' || g.gender === genderFilter
      return confOk && genderOk
    })
    const map = {}
    filtered.forEach(g => {
      const key = g.conf || 'Other'
      if (!map[key]) map[key] = []
      map[key].push(g)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [allRealGames, confFilter, genderFilter])

  const allGames = allRealGames
  const selected   = selectedId ? allGames.find(g => g.id === selectedId) : null
  const selIsW     = selected?.gender === 'W'

  // Month tabs for quick jumping
  const seasonMonths = [1, 2, 3, 4] // Feb, Mar, Apr, May (0-indexed)

  function jumpToMonth(monthIdx) {
    const idx = ALL_DATES.findIndex(d => d.getMonth() === monthIdx)
    if (idx >= 0) setSelectedIdx(idx)
  }

  function jumpToToday() {
    if (todayIdx >= 0) setSelectedIdx(todayIdx)
  }

  // Dates for the currently visible month
  const monthDates = ALL_DATES.filter(d => d.getMonth() === selectedMonth)

  // Shared game card renderer
  const renderGameCard = (g) => {
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
          {g.status === 'live' ? g.period : (g.time || g.period || 'TBA')}
        </div>
        <div className="sched-matchup">
          {[{ t: g.away, isAway: true }, { t: g.home, isAway: false }].map(({ t, isAway }) => {
            const wins  = hasScore && (isAway ? awayWin : !awayWin)
            const loses = hasScore && (isAway ? !awayWin : awayWin)
            return (
              <div className="sched-team" key={isAway ? 'a' : 'h'}>
                {t.rank && <span className="sched-rank">#{t.rank}</span>}
                <span className={`sched-team-name ${loses ? 'dim' : ''}`}>{t.name}</span>
                <span className={isAway ? 'away-tag' : `home-tag ${gIsW ? 'w' : ''}`}>{isAway ? 'AWAY' : 'HOME'}</span>
                {hasScore && (
                  <span
                    className={`sched-team-score ${loses ? 'dim' : ''}`}
                    style={wins ? { color: gIsW ? 'var(--women)' : 'var(--accent)' } : {}}
                  >
                    {t.score}
                  </span>
                )}
              </div>
            )
          })}
          <div className="sched-badges">
            <span className="sched-conf-badge">{g.conf}</span>
            <span className="sched-gender-badge" style={{ color: gIsW ? 'var(--women)' : 'var(--accent)' }}>
              {gIsW ? "Women's" : "Men's"}
            </span>
          </div>
        </div>
        <div className="sched-location">{g.loc}</div>
      </div>
    )
  }

  return (
    <div className="schedule-page">
      {/* Month tabs */}
      <div className="sched-month-bar">
        {seasonMonths.map(m => (
          <button
            key={m}
            className={`sched-month-btn ${selectedMonth === m ? (isW ? 'active-w' : 'active-m') : ''}`}
            onClick={() => jumpToMonth(m)}
          >
            {MONTH_FULL[m]}
          </button>
        ))}
        {todayIdx >= 0 && (
          <button
            className={`sched-today-btn ${isW ? 'w' : ''}`}
            onClick={jumpToToday}
          >
            Today
          </button>
        )}
      </div>

      {/* Day picker for current month */}
      <div className="sched-date-strip" ref={dateBarRef}>
        <button className="date-arrow" onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}>‹</button>
        <div className="sched-date-scroll">
          {monthDates.map(d => {
            const idx = ALL_DATES.indexOf(d)
            const active = idx === selectedIdx
            const isToday_ = isSameDay(d, today)
            return (
              <button
                key={idx}
                ref={active ? activeBtnRef : null}
                className={`sched-day-btn ${active ? (isW ? 'active-w' : 'active-m') : ''} ${isToday_ ? 'today' : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <span className="sched-day-name">{DAY_NAMES[d.getDay()]}</span>
                <span className="sched-day-num">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
        <button className="date-arrow" onClick={() => setSelectedIdx(i => Math.min(ALL_DATES.length - 1, i + 1))}>›</button>
      </div>

      {/* Selected date label */}
      <div className="sched-selected-label">
        {selectedDate && (
          isSameDay(selectedDate, today)
            ? `TODAY · ${DAY_NAMES[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${SEASON_YEAR}`
            : `${DAY_NAMES[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${SEASON_YEAR}`
        )}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <span className="filter-label">Gender</span>
        {[{ v: 'All', l: 'Both' }, { v: 'M', l: "Men's" }, { v: 'W', l: "Women's" }].map(({ v, l }) => (
          <button key={v} className={`filter-chip ${genderFilter === v ? ac_ : ''}`} onClick={() => { setGenderFilter(v); setConfFilter('All') }}>{l}</button>
        ))}
        {genderFilter === 'All' && <span className="filter-note">showing men&apos;s &amp; women&apos;s</span>}
        <div style={{ width: 1, height: 18, background: 'var(--border2)', margin: '0 8px' }} />
        <span className="filter-label">Group</span>
        {[{ v: 'date', l: 'By Date' }, { v: 'conf', l: 'By Conference' }].map(({ v, l }) => (
          <button key={v} className={`filter-chip ${groupBy === v ? ac_ : ''}`} onClick={() => setGroupBy(v)}>{l}</button>
        ))}
      </div>
      <div className="filter-row" style={{ paddingTop: 0 }}>
        <CollapsibleFilter
          label="Conf"
          options={confFilters.map(c => ({ value: c, label: c }))}
          value={confFilter} onChange={setConfFilter} isW={isW}
        />
      </div>

      {allGames.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px dashed var(--border2)', margin: '20px 0',
        }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 22, marginBottom: 8, color: 'var(--muted)' }}>
            NO GAMES
          </div>
          <div style={{ fontFamily: "'Barlow'", fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            No games scheduled for {selectedDate ? `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}` : 'this date'}.
          </div>
        </div>
      )}

      {/* Date grouping (default) */}
      {groupBy === 'date' && days.map(day => (
        <div key={day.label}>
          <div className="sched-day-header">{day.label}</div>
          {day.games.map(renderGameCard)}
        </div>
      ))}

      {/* Conference grouping */}
      {groupBy === 'conf' && confGroups.map(([conf, games]) => (
        <div key={conf}>
          <div className="sched-day-header">{conf} <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: 'var(--muted)', marginLeft: 8 }}>{games.length} games</span></div>
          {games.map(renderGameCard)}
        </div>
      ))}

      {selected && (
        <GameModal
          game={{ ...selected, loc: selected.loc, conf: selected.conf }}
          onClose={() => setSelectedId(null)}
          isW={selIsW}
          espnId={selected.espnId}
          gender={selected.gender}
        />
      )}
    </div>
  )
}
