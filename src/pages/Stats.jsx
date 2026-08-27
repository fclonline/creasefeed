import { useState, useMemo } from 'react'
import { useStatLeaders } from '../hooks/useScores.jsx'
import { chip, ac } from '../components/shared.jsx'
import { PROGRAMS, getProgramById, normTeam } from '../data/programs.js'

// Resolve the program id (e.g. "m-duke", "w3-amherst") for a stats row.
// Tries `${gender}${div-suffix}-${teamSeo}` first, then falls back to a
// normalized name match within the same gender + division.
function resolveProgramId(gender, division, teamSeo, teamName) {
  const prefix = `${gender.toLowerCase()}${division === '1' ? '' : division}-`
  if (teamSeo) {
    const direct = getProgramById(`${prefix}${teamSeo}`)
    if (direct) return direct.id
  }
  if (teamName && teamName !== '—') {
    const normalized = normTeam(teamName)
    const match = PROGRAMS.find(
      p => p.gender === gender && p.div === division && normTeam(p.name) === normalized
    )
    if (match) return match.id
  }
  return null
}

const GOAL_COLS  = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'pos', l: 'Pos' }, { k: 'gp', l: 'GP' }, { k: 'g', l: 'G' },
  { k: 'a', l: 'A' }, { k: 'pts', l: 'Pts' }, { k: 'gpg', l: 'G/G' },
]
const ASSIST_COLS = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'pos', l: 'Pos' }, { k: 'gp', l: 'GP' }, { k: 'g', l: 'G' },
  { k: 'a', l: 'A' }, { k: 'pts', l: 'Pts' }, { k: 'apg', l: 'A/G' },
]
const SAVE_COLS = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'pos', l: 'Pos' }, { k: 'gp', l: 'GP' }, { k: 'sv', l: 'Saves' },
  { k: 'ga', l: 'GA' }, { k: 'svpct', l: 'Sv%' }, { k: 'gaa', l: 'GAA' },
]

const TABS = [
  { key: 'goals',   label: 'Goals',       cols: GOAL_COLS,   hi: 'g'    },
  { key: 'assists', label: 'Assists',      cols: ASSIST_COLS, hi: 'a'    },
  { key: 'saves',   label: 'Goalkeepers', cols: SAVE_COLS,   hi: 'sv'   },
]

const NON_NUMERIC = ['rank', 'name', 'team', 'pos']

export default function StatsPage({ gender, division, isW, onSelectTeam }) {
  const [activeTab, setActiveTab] = useState('goals')
  const [sortKey, setSortKey]     = useState(null)
  const [sortDir, setSortDir]     = useState('desc')

  const { rows: data, loading, source } = useStatLeaders(gender, activeTab, division)
  const tab  = TABS.find(t => t.key === activeTab)
  const ac_  = chip(isW)

  // TODO: player profile — for v1, clicking a row navigates to the player's team page.
  const handleRowClick = (r) => {
    if (!onSelectTeam) return
    const programId = resolveProgramId(gender, division, r.teamSeo, r.team)
    if (programId) onSelectTeam(programId)
  }

  const rows = useMemo(() => {
    const base = [...data]
    if (!sortKey || NON_NUMERIC.includes(sortKey)) return base
    return base.sort((a, b) => {
      const av = parseFloat(a[sortKey]), bv = parseFloat(b[sortKey])
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [data, sortKey, sortDir])

  const handleSort = (k) => {
    if (NON_NUMERIC.includes(k)) return
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  // NOTE: season totals aggregated from NCAA box scores are known to be
  // over-counted (some games were aggregated more than once). Label them as
  // unverified until the aggregates are rebuilt.
  const sourceLabel = source === 'ncaa' ? 'NCAA box scores — season totals unverified'
    : source === 'firestore' ? 'Firestore (scraped)'
    : source === 'espn' ? 'ESPN API'
    : source === 'mock' ? 'Sample Data (scrapers pending)'
    : source === 'none' ? 'No data source connected'
    : source === 'empty' ? 'No verified data for this view'
    : source === 'error' ? 'Data temporarily unavailable'
    : 'Loading...'

  return (
    <div className="stats-page">
      <div className="stats-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`stat-tab ${activeTab === t.key ? ac_ : ''}`} onClick={() => { setActiveTab(t.key); setSortKey(null) }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: "'Barlow Condensed'", fontSize: 11, color: 'var(--muted)', letterSpacing: '1px' }}>
          {gender === 'M' ? "Men's" : "Women's"} · D{division} · 2026 Season
        </div>
      </div>

      {/* Data source indicator */}
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
        color: (source === 'none' || source === 'error') ? 'var(--red)' : source === 'firestore' ? 'var(--accent)' : source === 'mock' ? 'var(--muted)' : 'var(--yellow)',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
          background: (source === 'none' || source === 'error') ? 'var(--red)' : source === 'firestore' ? 'var(--accent)' : source === 'mock' ? 'var(--muted)' : 'var(--yellow)',
        }}/>
        {sourceLabel}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontFamily: "'Barlow Condensed'", fontSize: 16 }}>
          Loading stats...
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px dashed var(--border2)', margin: '20px 0',
        }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
            NO {tab.label.toUpperCase()} LEADERBOARD YET
          </div>
          <div style={{ fontFamily: "'Barlow'", fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            We don't have verified numbers for this view yet.
            <br/>Leaderboards return when the season data is confirmed.
          </div>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="leaderboard">
          <table className="lb-table">
            <thead>
              <tr>
                {tab.cols.map(c => (
                  <th
                    key={c.k}
                    className={sortKey === c.k ? (isW ? 'sorted-w' : 'sorted-m') : ''}
                    onClick={() => handleSort(c.k)}
                    title={NON_NUMERIC.includes(c.k) ? '' : 'Click to sort'}
                  >
                    {c.l}
                    {sortKey === c.k ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const programId = onSelectTeam
                  ? resolveProgramId(gender, division, r.teamSeo, r.team)
                  : null
                const clickable = !!programId
                return (
                <tr
                  key={i}
                  onClick={clickable ? () => handleRowClick(r) : undefined}
                  style={clickable ? { cursor: 'pointer' } : undefined}
                  title={clickable ? `Open ${r.team}` : undefined}
                >
                  {tab.cols.map(c => (
                    <td key={c.k}>
                      {c.k === 'rank' && <span className="lb-rank">{r.rank}</span>}
                      {c.k === 'name' && (
                        <div>
                          <div className="lb-name">{r.name}</div>
                        </div>
                      )}
                      {c.k === 'team' && <span className="lb-school">{r.team}</span>}
                      {c.k === 'pos'  && <span className="lb-pos">{r.pos}</span>}
                      {!NON_NUMERIC.includes(c.k) && (
                        <span className={c.k === tab.hi ? (isW ? 'lb-hi-w' : 'lb-hi-m') : ''}>
                          {r[c.k]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
