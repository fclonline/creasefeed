import { useState, useEffect, useMemo } from 'react'
import { getProgramById } from '../data/programs.js'
import { useTeams } from '../hooks/useTeams.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { GameModal, chip, ac } from '../components/shared.jsx'
import * as NCAA from '../api/ncaa.js'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Fetch all games for a team across the season (Feb-May) by scanning the NCAA scoreboard
function useTeamSchedule(program) {
  const [games, setGames]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!program) return
    let cancelled = false

    async function fetchSeason() {
      setLoading(true)
      const allGames = []
      const gender = program.gender
      const div = parseInt(program.div, 10)
      const teamName = program.name.toLowerCase()
      const teamShort = program.short.toLowerCase()

      // Scan Feb through May (months 2-5)
      for (let month = 2; month <= 5; month++) {
        // Get which dates have games this month
        try {
          const calendar = await NCAA.fetchScheduleCalendar(gender, month, div)
          if (!calendar || calendar.length === 0) continue

          // For each date with games, fetch the scoreboard and filter for our team
          for (const entry of calendar) {
            if (!entry.date) continue
            try {
              // Convert NCAA date format (MM/DD/YYYY) to YYYYMMDD
              const parts = entry.date.split('/')
              if (parts.length !== 3) continue
              const dateParam = `${parts[2]}${parts[0].padStart(2,'0')}${parts[1].padStart(2,'0')}`

              const dayGames = await NCAA.fetchScoreboard(gender, dateParam, div)
              if (cancelled) return

              // Filter games involving this team
              const teamGames = dayGames.filter(g => {
                const home = g.home.name.toLowerCase()
                const away = g.away.name.toLowerCase()
                return home.includes(teamShort) || home.includes(teamName) ||
                       away.includes(teamShort) || away.includes(teamName)
              })

              // Add date to each game for display
              teamGames.forEach(g => {
                if (!g.date) g.date = `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`
              })

              allGames.push(...teamGames)
            } catch {
              // Skip dates that fail
            }
          }
        } catch {
          // Skip months that fail
        }
      }

      if (!cancelled) {
        // Deduplicate by game ID
        const seen = new Set()
        const unique = allGames.filter(g => {
          if (seen.has(g.id)) return false
          seen.add(g.id)
          return true
        })
        // Sort by date
        unique.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setGames(unique)
        setLoading(false)
      }
    }

    fetchSeason()
    return () => { cancelled = true }
  }, [program?.id])

  return { games, loading }
}

export default function TeamDetailPage({ teamId, isW, onBack, onAuthClick }) {
  const program = getProgramById(teamId)
  const { user } = useAuth()
  const { followTeam, unfollowTeam, isFollowing } = useTeams()
  const { games, loading } = useTeamSchedule(program)
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const ac_ = chip(isW)

  if (!program) {
    return (
      <div className="team-detail-page">
        <button className="team-back-btn" onClick={onBack}>← Back to Teams</button>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Team not found.</div>
      </div>
    )
  }

  const followed = isFollowing(teamId)
  const pIsW = program.gender === 'W'
  const accentColor = pIsW ? 'var(--women)' : 'var(--accent)'

  // Compute record from games
  const record = useMemo(() => {
    let w = 0, l = 0, confW = 0, confL = 0
    const teamShort = program.short.toLowerCase()
    const teamName = program.name.toLowerCase()
    games.forEach(g => {
      if (g.status !== 'final') return
      const isHome = g.home.name.toLowerCase().includes(teamShort) || g.home.name.toLowerCase().includes(teamName)
      const isAway = g.away.name.toLowerCase().includes(teamShort) || g.away.name.toLowerCase().includes(teamName)
      if (!isHome && !isAway) return

      const teamScore = isHome ? g.home.score : g.away.score
      const oppScore  = isHome ? g.away.score : g.home.score
      const isConf = g.conf === program.conf

      if (teamScore > oppScore) { w++; if (isConf) confW++ }
      else { l++; if (isConf) confL++ }
    })
    return { w, l, confW, confL }
  }, [games, program])

  // Compute season stats from game data
  const seasonStats = useMemo(() => {
    let goalsFor = 0, goalsAgainst = 0, finalGames = 0
    const teamShort = program.short.toLowerCase()
    const teamName = program.name.toLowerCase()
    games.forEach(g => {
      if (g.status !== 'final') return
      const isHome = g.home.name.toLowerCase().includes(teamShort) || g.home.name.toLowerCase().includes(teamName)
      if (isHome) {
        goalsFor += (g.home.score || 0)
        goalsAgainst += (g.away.score || 0)
      } else {
        goalsFor += (g.away.score || 0)
        goalsAgainst += (g.home.score || 0)
      }
      finalGames++
    })
    return {
      gamesPlayed: finalGames,
      goalsFor,
      goalsAgainst,
      avgFor: finalGames ? (goalsFor / finalGames).toFixed(1) : '—',
      avgAgainst: finalGames ? (goalsAgainst / finalGames).toFixed(1) : '—',
      margin: finalGames ? ((goalsFor - goalsAgainst) / finalGames).toFixed(1) : '—',
    }
  }, [games, program])

  const handleFollow = async () => {
    if (!user) { onAuthClick('signin'); return }
    if (followed) {
      await unfollowTeam(teamId)
    } else {
      const result = await followTeam(teamId)
      if (result?.error === 'pro') onAuthClick('pro')
    }
  }

  const selected = selectedId ? games.find(g => g.id === selectedId) : null
  const selIsW = selected?.gender === 'W'

  return (
    <div className="team-detail-page">
      <button className="team-back-btn" onClick={onBack}>← Back to Teams</button>

      {/* Team header */}
      <div className="team-header" style={{ borderLeftColor: accentColor }}>
        <div className="team-header-info">
          <div className="team-header-name">{program.name}</div>
          <div className="team-header-meta">
            <span className="team-badge" style={{ background: accentColor, color: '#000' }}>
              {pIsW ? "Women's" : "Men's"} D{program.div}
            </span>
            <span className="team-header-conf">{program.conf}</span>
            <span className="team-header-state">{program.state}</span>
          </div>
          {!loading && games.length > 0 && (
            <div className="team-header-record">
              <span className="team-record-main">{record.w}-{record.l}</span>
              {record.confW + record.confL > 0 && (
                <span className="team-record-conf">({record.confW}-{record.confL} {program.conf})</span>
              )}
            </div>
          )}
        </div>
        <button
          className={`team-follow-btn-lg ${followed ? 'following' : ''} ${pIsW ? 'w' : ''}`}
          onClick={handleFollow}
        >
          {followed ? '✓ Following' : '+ Follow'}
        </button>
      </div>

      {/* Tabs */}
      <div className="team-tabs">
        {['schedule', 'stats'].map(tab => (
          <button
            key={tab}
            className={`team-tab ${activeTab === tab ? (pIsW ? 'active-w' : 'active-m') : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'schedule' ? 'Schedule & Results' : 'Season Stats'}
          </button>
        ))}
      </div>

      {/* Schedule tab */}
      {activeTab === 'schedule' && (
        <div className="team-schedule">
          {loading && (
            <div className="team-loading">
              <div className="team-loading-spinner" style={{ borderTopColor: accentColor }} />
              Loading season schedule...
            </div>
          )}
          {!loading && games.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontFamily: "'Barlow Condensed'" }}>
              No games found for {program.name} this season.
            </div>
          )}
          {!loading && games.length > 0 && (
            <table className="team-sched-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Result</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {games.map(g => {
                  const teamShort = program.short.toLowerCase()
                  const teamName = program.name.toLowerCase()
                  const isHome = g.home.name.toLowerCase().includes(teamShort) || g.home.name.toLowerCase().includes(teamName)
                  const opponent = isHome ? g.away : g.home
                  const teamScore = isHome ? g.home.score : g.away.score
                  const oppScore = isHome ? g.away.score : g.home.score
                  const isFinal = g.status === 'final'
                  const won = isFinal && teamScore > oppScore
                  const lost = isFinal && teamScore < oppScore
                  const dateStr = g.date ? (() => {
                    const d = new Date(g.date + 'T12:00:00')
                    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
                  })() : '—'

                  return (
                    <tr key={g.id} className="team-sched-row" onClick={() => setSelectedId(g.id)}>
                      <td className="team-sched-date">{dateStr}</td>
                      <td className="team-sched-opp">
                        {isHome ? 'vs ' : '@ '}
                        {opponent.rank && <span className="team-sched-rank">#{opponent.rank} </span>}
                        {opponent.name}
                      </td>
                      <td>
                        {isFinal ? (
                          <span className={`team-result-badge ${won ? 'win' : 'loss'}`} style={won ? { background: accentColor } : {}}>
                            {won ? 'W' : 'L'}
                          </span>
                        ) : (
                          <span className="team-result-badge upcoming">
                            {g.status === 'live' ? 'LIVE' : g.time || g.period || 'TBA'}
                          </span>
                        )}
                      </td>
                      <td className="team-sched-score">
                        {isFinal ? `${teamScore}-${oppScore}` : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === 'stats' && (
        <div className="team-stats-section">
          {loading ? (
            <div className="team-loading">
              <div className="team-loading-spinner" style={{ borderTopColor: accentColor }} />
              Loading stats...
            </div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontFamily: "'Barlow Condensed'" }}>
              No stats available yet.
            </div>
          ) : (
            <div className="team-stats-grid">
              <div className="team-stat-card">
                <div className="team-stat-value" style={{ color: accentColor }}>{record.w}-{record.l}</div>
                <div className="team-stat-label">Overall Record</div>
              </div>
              {record.confW + record.confL > 0 && (
                <div className="team-stat-card">
                  <div className="team-stat-value" style={{ color: accentColor }}>{record.confW}-{record.confL}</div>
                  <div className="team-stat-label">Conference Record</div>
                </div>
              )}
              <div className="team-stat-card">
                <div className="team-stat-value" style={{ color: accentColor }}>{seasonStats.goalsFor}</div>
                <div className="team-stat-label">Goals For</div>
              </div>
              <div className="team-stat-card">
                <div className="team-stat-value">{seasonStats.goalsAgainst}</div>
                <div className="team-stat-label">Goals Against</div>
              </div>
              <div className="team-stat-card">
                <div className="team-stat-value" style={{ color: accentColor }}>{seasonStats.avgFor}</div>
                <div className="team-stat-label">Avg Goals/Game</div>
              </div>
              <div className="team-stat-card">
                <div className="team-stat-value">{seasonStats.avgAgainst}</div>
                <div className="team-stat-label">Avg Goals Allowed</div>
              </div>
              <div className="team-stat-card">
                <div className="team-stat-value" style={{ color: parseFloat(seasonStats.margin) > 0 ? accentColor : 'var(--red)' }}>
                  {parseFloat(seasonStats.margin) > 0 ? '+' : ''}{seasonStats.margin}
                </div>
                <div className="team-stat-label">Avg Margin</div>
              </div>
              <div className="team-stat-card">
                <div className="team-stat-value" style={{ color: accentColor }}>{seasonStats.gamesPlayed}</div>
                <div className="team-stat-label">Games Played</div>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <GameModal
          game={selected}
          onClose={() => setSelectedId(null)}
          isW={selIsW}
          espnId={selected.espnId}
          gender={selected.gender}
        />
      )}
    </div>
  )
}
