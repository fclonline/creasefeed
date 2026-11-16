import { useState, useMemo, useEffect } from 'react'
import { useStatLeaders } from '../hooks/useScores.jsx'
import { getSeason } from '../api/firestore.js'
import { chip, ac } from '../components/shared.jsx'
import { PROGRAMS, getProgramById, normTeam, canonTeam, seoKey, TEAM_ALIASES } from '../data/programs.js'

// Resolve the program id (e.g. "m-duke", "w3-amherst") for a stats row.
// Tries `${gender}${div-suffix}-${teamSeo}` first, then falls back to a
// name match within the same gender + division. canonTeam folds the NCAA's
// "St." abbreviation; TEAM_ALIASES covers what that can't (the official boards
// carry names only, no seo).
function resolveProgramId(gender, division, teamSeo, teamName) {
  const prefix = `${gender.toLowerCase()}${division === '1' ? '' : division}-`
  if (teamSeo) {
    const direct = getProgramById(`${prefix}${teamSeo}`)
    if (direct) return direct.id
    // NCAA suffixes ambiguous seos with a state code: "albany-ny" -> m-albany.
    // seoKey only strips real state codes, so "penn-st" never becomes "penn".
    const bare = teamSeo.replace(/-[a-z]{2}$/, '')
    const unsuffixed = bare !== teamSeo && seoKey(teamSeo) === normTeam(bare)
      && getProgramById(`${prefix}${bare}`)
    if (unsuffixed) return unsuffixed.id
  }
  if (teamName && teamName !== '—') {
    const key = canonTeam(teamName)
    const match = PROGRAMS.find(p => {
      if (p.gender !== gender || p.div !== division) return false
      const ours = canonTeam(p.name)
      return ours === key || canonTeam(TEAM_ALIASES[ours] || '') === key
    })
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
// Goalie and face-off boards read the NCAA's official stat lists (see
// fetchOfficialBoard), so they carry class year and only list qualifiers.
const SAVE_COLS = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'cl', l: 'Cl' }, { k: 'gp', l: 'GP' }, { k: 'min', l: 'Min' },
  { k: 'sv', l: 'Saves' }, { k: 'ga', l: 'GA' }, { k: 'svpct', l: 'Sv%' }, { k: 'gaa', l: 'GAA' },
]
const FACEOFF_COLS = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'cl', l: 'Cl' }, { k: 'gp', l: 'GP' }, { k: 'fow', l: 'Won' },
  { k: 'fol', l: 'Lost' }, { k: 'fot', l: 'Taken' }, { k: 'fopct', l: 'FO%' },
]

// Boards with nothing to show and a reason why. Empty since the goalie board
// moved to the official NCAA source; kept for the next source gap.
const WITHHELD = {}

const DRAW_COLS = [
  { k: 'rank', l: '#' }, { k: 'name', l: 'Player' }, { k: 'team', l: 'Team' },
  { k: 'pos', l: 'Pos' }, { k: 'gp', l: 'GP' }, { k: 'dc', l: 'Draws' },
  { k: 'g', l: 'G' }, { k: 'a', l: 'A' }, { k: 'dcpg', l: 'DC/G' },
]

// `genders` limits a board to where the data exists. Draw controls are the
// women's possession stat; face-offs are the men's, and come from the official
// lists because the box score doesn't carry them at all.
const TABS = [
  { key: 'goals',   label: 'Goals',        cols: GOAL_COLS,   hi: 'g'  },
  { key: 'assists', label: 'Assists',      cols: ASSIST_COLS, hi: 'a'  },
  { key: 'saves',   label: 'Goalkeepers',  cols: SAVE_COLS,   hi: 'svpct' },
  { key: 'draws',   label: 'Draw Controls', cols: DRAW_COLS,  hi: 'dc', genders: ['W'] },
  { key: 'faceoffs', label: 'Face-Offs',   cols: FACEOFF_COLS, hi: 'fopct', genders: ['M'] },
]

const NON_NUMERIC = ['rank', 'name', 'team', 'pos', 'cl']

export default function StatsPage({ gender, division, isW, onSelectTeam }) {
  const [activeTab, setActiveTab] = useState('goals')
  const [sortKey, setSortKey]     = useState(null)
  const [sortDir, setSortDir]     = useState('desc')

  const tabsForGender = TABS.filter(t => !t.genders || t.genders.includes(gender))
  // Switching to men's while on a women's-only board would query a stat that is
  // all zeros, so fall back to Goals.
  useEffect(() => {
    if (!tabsForGender.some(t => t.key === activeTab)) setActiveTab('goals')
  }, [gender])

  const withheld = WITHHELD[activeTab] || null
  const { rows: data, loading, source, throughDate } = useStatLeaders(gender, withheld ? null : activeTab, division)
  const tab  = TABS.find(t => t.key === activeTab) || TABS[0]
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
      // Blanks ('—') sort last in either direction.
      if (isNaN(av) || isNaN(bv)) return isNaN(av) - isNaN(bv)
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
  const throughLabel = throughDate
    ? new Date(`${throughDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : ''
  // Neutral provenance line only; internal source names never reach the UI.
  const sourceLabel = source === 'official' ? `NCAA official statistics${throughLabel ? ` · through ${throughLabel}` : ''} · qualified players only`
    : source === 'ncaa' ? 'Season totals from game box scores · not yet verified'
    : ''

  return (
    <div className="stats-page">
      <div className="stats-tabs">
        {tabsForGender.map(t => (
          <button key={t.key} className={`stat-tab ${activeTab === t.key ? ac_ : ''}`} onClick={() => { setActiveTab(t.key); setSortKey(null) }}>
            {t.label}
          </button>
        ))}
        <div className="page-meta">
          {gender === 'M' ? "Men's" : "Women's"} · D{division} · {getSeason()} Season
        </div>
      </div>

      {/* Data source indicator — meaningless on a withheld tab, so hidden */}
      {!withheld && sourceLabel && <div style={{
        fontFamily: "'Inter',sans-serif", fontSize: 13,
        color: 'var(--muted)',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
          background: source === 'official' ? 'var(--accent)' : 'var(--muted)',
        }}/>
        {sourceLabel}
      </div>}

      {withheld && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px dashed var(--border2)', margin: '20px 0',
        }}>
          <div className="empty-title">
            {withheld.title}
          </div>
          <div style={{ fontFamily: "'Inter'", fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
            {withheld.body}
          </div>
        </div>
      )}

      {!withheld && loading && (
        <div className="empty-note" style={{ padding: '60px 20px' }}>
          Loading stats...
        </div>
      )}

      {!withheld && !loading && rows.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px dashed var(--border2)', margin: '20px 0',
        }}>
          <div className="empty-title">
            No {tab.label.toLowerCase()} leaders yet
          </div>
          <div style={{ fontFamily: "'Inter'", fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Stats update after games are final.
          </div>
        </div>
      )}

      {!withheld && !loading && rows.length > 0 && (
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
                      {c.k === 'cl'   && <span className="lb-pos">{r.cl}</span>}
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
