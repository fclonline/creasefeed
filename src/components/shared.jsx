import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { useGameDetail, useScores } from '../hooks/useScores.jsx'

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        // sun
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // moon
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
// No mock data — ticker shows live games only

// ─── helpers ────────────────────────────────────────────────────────────────
export const ac  = (isW) => isW ? 'var(--women)' : 'var(--accent)'
export const chip = (isW) => isW ? 'active-w' : 'active-m'

// ─── TICKER (live data) ──────────────────────────────────────────────────────
export function Ticker({ gender, division, isW }) {
  // Fetch live games for the ticker
  const { games } = useScores(gender)

  // Build ticker items from live game data if available
  const tickerItems = (games && games.length > 0) ? games.map(g => {
    const isLive = g.status === 'live'
    const isFinal = g.status === 'final'
    const isUpcoming = g.status === 'upcoming'
    let text = ''
    if (isUpcoming) {
      text = `${g.away.name.toUpperCase()} @ ${g.home.name.toUpperCase()}`
    } else {
      text = `${g.away.name.toUpperCase()} ${g.away.score ?? ''} · ${g.home.name.toUpperCase()} ${g.home.score ?? ''}`
    }
    return {
      text,
      period: g.period,
      live: isLive,
      gender: g.gender,
    }
  }) : [{ text: 'CREASEFEED — LIVE SCORES & STATS', period: '', live: false, gender }]

  const doubled = [...tickerItems, ...tickerItems]
  // Keep a constant, calm scroll speed regardless of how many games are in the
  // ticker: one full copy scrolls per cycle, so duration scales with item count.
  // Bump SECONDS_PER_ITEM up to slow it down further (or down to speed it up).
  const SECONDS_PER_ITEM = 6
  const scrollSeconds = Math.max(40, tickerItems.length * SECONDS_PER_ITEM)
  return (
    <div className="ticker-root">
      <div className={`ticker-badge ${isW ? 'w' : ''}`}>
        CREASEFEED · {gender} D{division}
      </div>
      <div className="ticker-scroll">
        <div className="ticker-track" style={{ animationDuration: `${scrollSeconds}s` }}>
          {doubled.map((item, i) => (
            <div key={i} className="ticker-item">
              {item.live && <span className="t-live">LIVE</span>}
              <span>{item.text}</span>
              <span className="t-period">{item.period}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── NAVBAR ─────────────────────────────────────────────────────────────────
export function Navbar({ page, setPage, gender, division, isW, onAuthClick, followCount = 0 }) {
  const { user, pro, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
    : '?'

  const FUNCTIONS_BASE = 'https://us-east1-creasefeed.cloudfunctions.net'

  const handleManageSubscription = async () => {
    if (!user || portalLoading) return
    setPortalLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/createPortalSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not open subscription manager. Please try again.')
        setPortalLoading(false)
      }
    } catch (e) {
      alert('Could not open subscription manager. Please try again.')
      setPortalLoading(false)
    }
  }

  return (
    <nav className="navbar">
      <div className="logo-wrap" onClick={() => setPage('scores')}>
        <div className="logo">CREASE<em>FEED</em></div>
        <div className="logo-tag">Feed the Crease</div>
      </div>

      <div className="nav-links">
        {[
          { key: 'feed',     label: 'My Feed', badge: followCount > 0 ? followCount : null },
          { key: 'scores',   label: 'Scores' },
          { key: 'schedule', label: 'Schedule' },
          { key: 'stats',    label: 'Stats' },
          { key: 'teams',    label: 'Teams' },
          { key: 'polls',    label: 'Polls' },
        ].map(n => (
          <button
            key={n.key}
            className={`nav-link ${page === n.key ? 'active' : ''} ${page === n.key && isW ? 'w' : ''}`}
            onClick={() => setPage(n.key)}
          >
            {n.label}
            {n.badge && (
              <span style={{
                background: ac(isW), color: '#000',
                fontFamily: "'IBM Plex Mono'", fontSize: 9, fontWeight: 600,
                padding: '1px 5px', borderRadius: 8, marginLeft: 6,
              }}>{n.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <ThemeToggle />
        {user ? (
          <div className="user-menu-wrap">
            <div className="user-avatar" onClick={() => setMenuOpen(o => !o)}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                : initials
              }
            </div>
            {menuOpen && (
              <div className="user-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <div className="user-dropdown-header">
                  <div className="user-dropdown-name">{user.displayName || 'Player'}</div>
                  <div className="user-dropdown-email">{user.email}</div>
                  {pro && <div className="user-dropdown-pro">✦ PRO MEMBER</div>}
                </div>
                {!pro && (
                  <button className="dropdown-item" onClick={() => { setMenuOpen(false); onAuthClick('pro') }}>
                    Upgrade to Pro →
                  </button>
                )}
                {pro && (
                  <button
                    className="dropdown-item dropdown-item-divided"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                )}
                <button className="dropdown-item danger" onClick={() => { signOut(); setMenuOpen(false) }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn-signin" onClick={() => onAuthClick('signin')}>Sign In</button>
            <button className={`btn-pro ${isW ? 'w' : ''}`} onClick={() => onAuthClick('pro')}>Go Pro</button>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── MOBILE TAB BAR ───────────────────────────────────────────────────────
const TAB_ICONS = {
  feed: <path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.3 2.7 1.1-6.1L3.3 9.4l6.1-.8z" />,
  scores: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></>,
  schedule: <><rect x="3.5" y="4.5" width="17" height="16" rx="1.5" /><path d="M3.5 9h17M8 3v3M16 3v3" /></>,
  stats: <path d="M5 20V10M12 20V4M19 20v-7" />,
  teams: <path d="M12 3l7.5 2.6v5.4c0 4.6-3.1 7.6-7.5 8.6-4.4-1-7.5-4-7.5-8.6V5.6z" />,
  polls: <><path d="M8 4h8v3.5a4 4 0 01-8 0z" /><path d="M16 5h2.5a1.5 1.5 0 010 3H16M8 5H5.5a1.5 1.5 0 000 3H8M9.5 13.5h5M10 20h4M12 11.5V16" /></>,
}

export function MobileTabBar({ page, setPage, isW, followCount = 0 }) {
  const tabs = [
    { key: 'feed',     label: 'Feed' },
    { key: 'scores',   label: 'Scores' },
    { key: 'schedule', label: 'Sched' },
    { key: 'stats',    label: 'Stats' },
    { key: 'teams',    label: 'Teams' },
    { key: 'polls',    label: 'Polls' },
  ]
  return (
    <nav className="mobile-tabbar" aria-label="Primary">
      {tabs.map(t => {
        const active = page === t.key
        return (
          <button
            key={t.key}
            className={`mtab ${active ? (isW ? 'active-w' : 'active-m') : ''}`}
            onClick={() => setPage(t.key)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="mtab-icon-wrap">
              <svg className="mtab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {TAB_ICONS[t.key]}
              </svg>
              {t.key === 'feed' && followCount > 0 && (
                <span className={`mtab-badge ${isW ? 'w' : ''}`}>{followCount}</span>
              )}
            </span>
            <span className="mtab-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── COLLAPSIBLE FILTER ───────────────────────────────────────────────────
// Collapsed: shows the current selection as a chip + caret. Tap to expand the
// full option list; picking one (or the caret) collapses it again.
export function CollapsibleFilter({ label, options, value, onChange, isW, className = '' }) {
  const [open, setOpen] = useState(false)
  const acCls = chip(isW)
  const selected = options.find(o => o.value === value) ?? options[0]
  return (
    <div className={`cfilter ${className}`}>
      {label && <span className="filter-label">{label}</span>}
      {open ? (
        <>
          {options.map(o => (
            <button
              key={o.value}
              className={`filter-chip ${value === o.value ? acCls : ''}`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </button>
          ))}
          <button className="cfilter-toggle" aria-label="Collapse options" onClick={() => setOpen(false)}>▴</button>
        </>
      ) : (
        <button
          className={`filter-chip cfilter-current ${acCls}`}
          aria-haspopup="true" aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          {selected?.label}
          <span className="cfilter-caret">▾</span>
        </button>
      )}
    </div>
  )
}

// ─── CONTEXT BAR ────────────────────────────────────────────────────────────
// Discovery views (Schedule, Teams) own their own in-page filters, so the
// matching global toggles are hidden there to avoid a redundant duplicate.
const HIDE_GENDER_ON   = ['schedule']
const HIDE_DIVISION_ON = []

export function ContextBar({ page, gender, setGender, division, setDivision, isW }) {
  const showGender   = !HIDE_GENDER_ON.includes(page)
  const showDivision = !HIDE_DIVISION_ON.includes(page)
  return (
    <div className="context-bar">
      {showGender && (
        <CollapsibleFilter
          options={[{ value: 'M', label: "Men's" }, { value: 'W', label: "Women's" }]}
          value={gender} onChange={setGender} isW={isW}
        />
      )}
      {showGender && showDivision && <div className="div-sep" />}
      {showDivision && (
        <CollapsibleFilter
          label="Division"
          options={[{ value: '1', label: 'D1' }, { value: '2', label: 'D2' }, { value: '3', label: 'D3' }]}
          value={division} onChange={setDivision} isW={isW}
        />
      )}
      <div className="ctx-season">2026 · Spring Season</div>
    </div>
  )
}

// ─── GAME CARD ───────────────────────────────────────────────────────────────
export function GameCard({ game, onClick, isW, showGender = false }) {
  const hasScore = game.status !== 'upcoming'
  const awayWin  = hasScore && game.away.score > game.home.score
  return (
    <div className={`game-card ${game.status} ${isW ? 'w' : ''}`} onClick={onClick}>
      <div className="gc-meta">
        <div className={`gc-status ${game.status} ${isW ? 'w' : ''}`}>
          {game.status === 'live' && <span className={`live-dot ${isW ? 'w' : ''}`} />}
          {game.status === 'upcoming' ? (game.time || game.period || 'TBA') : game.period}
        </div>
        {showGender && (
          <span className={`gc-gender ${isW ? 'w' : 'm'}`}>{isW ? "Women's" : "Men's"}</span>
        )}
        <div className="gc-conf">{game.conf}</div>
      </div>
      <div className="gc-teams">
        {[{ t: game.away, isAway: true }, { t: game.home, isAway: false }].map(({ t, isAway }, idx) => {
          const wins  = hasScore && (isAway ? awayWin : !awayWin)
          const loses = hasScore && (isAway ? !awayWin : awayWin)
          return (
            <div key={idx} className="gc-team-row">
              <div className="gc-rank">{t.rank ? `#${t.rank}` : ''}</div>
              <div className="gc-name-wrap">
                <span className={`gc-name ${loses ? 'dim' : ''}`}>{t.name}</span>
                <span className={isAway ? 'away-tag' : `home-tag ${isW ? 'w' : ''}`}>{isAway ? 'AWAY' : 'HOME'}</span>
              </div>
              <div className="gc-rec">{t.rec}</div>
              {hasScore && (
                <div className={`gc-score ${loses ? 'dim' : ''}`} style={wins ? { color: ac(isW) } : {}}>
                  {t.score}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!hasScore && <div className="gc-footer">{game.loc}</div>}
    </div>
  )
}

// ─── PLAYER STATS TABLE (used inside GameModal) ─────────────────────────────
function PlayerStatsTable({ teamData, isW }) {
  if (!teamData?.players || teamData.players.length === 0) return null
  const color = ac(isW)

  // Separate field players and goalies
  const fieldPlayers = teamData.players.filter(p => p.saves === undefined)
  const goalies = teamData.players.filter(p => p.saves !== undefined)

  return (
    <div className="pstats-team">
      <div className="pstats-team-name" style={{ color }}>{teamData.teamFull || teamData.team}</div>
      <div className="pstats-scroll">
        <table className="pstats-table">
          <thead>
            <tr>
              <th className="pstats-th-name">Player</th>
              <th>#</th>
              <th>Pos</th>
              <th>G</th>
              <th>A</th>
              <th>Pts</th>
              <th>S</th>
              <th>SOG</th>
              <th>GB</th>
              <th>TO</th>
              <th>CT</th>
            </tr>
          </thead>
          <tbody>
            {fieldPlayers.map((p, i) => (
              <tr key={i} className={p.starter ? 'pstats-starter' : ''}>
                <td className="pstats-name">{p.name}</td>
                <td className="pstats-num">{p.number || ''}</td>
                <td className="pstats-pos">{p.pos}</td>
                <td className={p.goals > 0 ? 'pstats-hi' : ''}>{p.goals}</td>
                <td className={p.assists > 0 ? 'pstats-hi' : ''}>{p.assists}</td>
                <td className={p.points > 0 ? 'pstats-hi' : ''}>{p.points}</td>
                <td>{p.shots}</td>
                <td>{p.sog}</td>
                <td>{p.gb}</td>
                <td>{p.to}</td>
                <td>{p.ct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {goalies.length > 0 && (
        <>
          <div className="pstats-goalie-label">Goalies</div>
          <div className="pstats-scroll">
            <table className="pstats-table">
              <thead>
                <tr>
                  <th className="pstats-th-name">Player</th>
                  <th>#</th>
                  <th>SV</th>
                  <th>GA</th>
                  <th>SV%</th>
                </tr>
              </thead>
              <tbody>
                {goalies.map((p, i) => {
                  const totalFaced = (p.saves || 0) + (p.ga || 0)
                  const svpct = totalFaced > 0 ? ((p.saves / totalFaced) * 100).toFixed(1) : '—'
                  return (
                    <tr key={i}>
                      <td className="pstats-name">{p.name}</td>
                      <td className="pstats-num">{p.number || ''}</td>
                      <td className="pstats-hi">{p.saves}</td>
                      <td>{p.ga}</td>
                      <td>{svpct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── GAME MODAL ──────────────────────────────────────────────────────────────
export function GameModal({ game, onClose, isW, espnId, gender }) {
  const hasScore = game.status !== 'upcoming'
  const awayWin  = hasScore && game.away.score > game.home.score
  const isLive   = game.status === 'live'
  const color    = ac(isW)
  const [activeTab, setActiveTab] = useState('summary')

  // Fetch real game detail from NCAA / ESPN / Firestore
  const { detail, loading: detailLoading } = useGameDetail(espnId || game.id, gender, hasScore)

  // Extract real data from detail, with safe fallbacks
  const quarters    = detail?.quarters || []
  const plays       = detail?.plays || []
  const teamStats   = detail?.teamStats || []
  const playerStats = detail?.playerStats || []

  // Build quarter headers dynamically from actual data
  const numPeriods = quarters.length > 0 ? (quarters[0]?.scores?.length || 4) : 4
  const qHeaders = ['', ...Array.from({length: numPeriods}, (_, i) => `Q${i+1}`), 'T']

  // Unified stat labels — handles both NCAA (capitalized keys) and ESPN (camelCase keys)
  const statLabels = [
    { keys: ['Shots', 'shots'],                      label: 'Shots' },
    { keys: ['Shots on Goal', 'shotsOnGoal'],        label: 'Shots on Goal' },
    { keys: ['Ground Balls', 'groundBalls'],         label: 'Ground Balls' },
    { keys: ['Turnovers', 'turnovers'],              label: 'Turnovers' },
    { keys: ['Caused Turnovers', 'causedTurnovers'], label: 'Caused TO' },
    { keys: ['Saves', 'saves'],                      label: 'Saves' },
    { keys: ['Goals Allowed', 'goalsAllowed'],       label: 'Goals Allowed' },
    { keys: ['faceoffsWon'],                         label: 'FO Won' },
    { keys: ['clears'],                              label: 'Clears' },
    { keys: ['penalties'],                           label: 'Penalties' },
  ]

  function findStat(statsObj, keys) {
    if (!statsObj) return undefined
    for (const k of keys) {
      if (statsObj[k] !== undefined) return statsObj[k]
    }
    return undefined
  }

  const hasTabs = hasScore && (playerStats.length > 0 || teamStats.length >= 2)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* header bar */}
        <div className="modal-close-bar">
          <div className="modal-crumb">{game.conf} · {game.gender} · D1 · {game.loc}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* scoreboard */}
        <div className="modal-scoreboard">
          <div className="msb-team away">
            <span className="away-tag">AWAY</span>
            {game.away.rank && <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--muted)' }}>#{game.away.rank}</div>}
            <div className="msb-school" style={{ color: hasScore && !awayWin ? 'var(--muted)' : 'var(--text)' }}>{game.away.name}</div>
            <div className="msb-rec">{game.away.rec}</div>
          </div>

          <div className="msb-center">
            {hasScore ? (
              <div className="msb-score-row">
                <div className="msb-score" style={{ color: awayWin ? color : 'var(--muted)' }}>{game.away.score}</div>
                <div className="msb-sep">–</div>
                <div className="msb-score" style={{ color: !awayWin ? color : 'var(--muted)' }}>{game.home.score}</div>
              </div>
            ) : (
              <div className="msb-vs">VS</div>
            )}
            <div className="msb-period" style={{ color: isLive ? color : game.status === 'upcoming' ? 'var(--yellow)' : 'var(--muted)' }}>
              {isLive && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 5, verticalAlign: 'middle', animation: 'blink 1.5s infinite' }} />}
              {game.status === 'upcoming' ? (game.time || game.period || 'TBA') : game.period}
            </div>
          </div>

          <div className="msb-team home">
            <span className={`home-tag ${isW ? 'w' : ''}`}>HOME</span>
            {game.home.rank && <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>#{game.home.rank}</div>}
            <div className="msb-school" style={{ color: hasScore && awayWin ? 'var(--muted)' : 'var(--text)', textAlign: 'right' }}>{game.home.name}</div>
            <div className="msb-rec" style={{ textAlign: 'right' }}>{game.home.rec}</div>
          </div>
        </div>

        {/* Tab bar */}
        {hasTabs && (
          <div className="modal-tabs">
            {['summary', ...(playerStats.length > 0 ? ['box score'] : [])].map(tab => (
              <button
                key={tab}
                className={`modal-tab ${activeTab === tab ? (isW ? 'active-w' : 'active-m') : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {hasScore && (
          <div className="modal-body">
            {detailLoading && (
              <div style={{textAlign:'center',padding:'20px',color:'var(--muted)',fontFamily:"'IBM Plex Mono'",fontSize:11}}>
                Loading game details...
              </div>
            )}

            {activeTab === 'summary' && (<>
              {/* quarter scores */}
              {quarters.length > 0 && (
                <div className="modal-sec">
                  <div className="modal-sec-title">Scoring by Quarter</div>
                  <div className="q-grid" style={{gridTemplateColumns: `auto repeat(${numPeriods + 1}, 1fr)`}}>
                    {qHeaders.map(h => <div key={h} className="qc hd">{h}</div>)}
                    {quarters.map((q, ri) => [
                      <div key={`n${ri}`} className="qc lbl">{q.team}</div>,
                      ...(q.scores || []).map((v, ci) => (
                        <div key={`q${ri}${ci}`} className="qc">{v}</div>
                      )),
                      <div key={`t${ri}`} className="qc tot">{q.total}</div>,
                    ])}
                  </div>
                </div>
              )}

              {/* team stats */}
              {teamStats.length >= 2 && (
                <div className="modal-sec">
                  <div className="modal-sec-title">Team Stats</div>
                  <div className="tstats">
                    {statLabels.map(({ keys, label }) => {
                      const aVal = findStat(teamStats[0]?.stats, keys)
                      const hVal = findStat(teamStats[1]?.stats, keys)
                      if (aVal === undefined && hVal === undefined) return null
                      const av = parseFloat(aVal) || 0, hv = parseFloat(hVal) || 0, tot = (av + hv) || 1
                      return (
                        <div key={label} className="tstat-row">
                          <div className="tstat-val left">{aVal ?? '—'}</div>
                          <div className="tstat-center">
                            <div className="tstat-label">{label}</div>
                            <div className="tstat-bar">
                              <div className={`tstat-bar-l ${isW ? 'w' : ''}`} style={{ opacity: Math.max(0.2, av / tot) }} />
                              <div className="tstat-bar-r" style={{ opacity: Math.max(0.2, hv / tot) }} />
                            </div>
                          </div>
                          <div className="tstat-val right">{hVal ?? '—'}</div>
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                </div>
              )}

              {/* scoring plays / top scorers */}
              {plays.length > 0 && (
                <div className="modal-sec">
                  <div className="modal-sec-title">{detail?._source === 'ncaa' ? 'Top Scorers' : 'Scoring Plays'}</div>
                  {plays.map((p, i) => (
                    <div key={i} className="play-row">
                      <div className="play-qtr">{p.period} {p.clock}</div>
                      <div className="play-team" style={{ color }}>{p.team}</div>
                      <div className="play-desc">{p.desc}</div>
                      <div className={`play-sc ${isW ? 'w' : ''}`}>{p.score}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* No detail data */}
              {!detailLoading && quarters.length === 0 && plays.length === 0 && teamStats.length === 0 && (
                <div style={{textAlign:'center',padding:'30px 20px',color:'var(--muted)',fontFamily:"'Barlow'",fontSize:13}}>
                  Detailed stats not yet available for this game.
                </div>
              )}
            </>)}

            {activeTab === 'box score' && playerStats.length > 0 && (
              <div className="modal-sec">
                <div className="modal-sec-title">Player Box Score</div>
                {playerStats.map((team, i) => (
                  <PlayerStatsTable key={i} teamData={team} isW={isW} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AUTH MODAL ──────────────────────────────────────────────────────────────
// Map Firebase auth error codes to plain-language messages.
function friendlyAuthError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use': return 'That email already has an account — try signing in instead.'
    case 'auth/invalid-email':        return 'Please enter a valid email address.'
    case 'auth/weak-password':        return 'Password must be at least 6 characters.'
    case 'auth/missing-password':     return 'Please enter a password.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':       return 'Incorrect email or password.'
    case 'auth/too-many-requests':    return 'Too many attempts — please wait a moment and try again.'
    case 'auth/operation-not-allowed':return 'Email sign-up isn’t enabled yet. (Admin: enable Email/Password in Firebase Auth.)'
    case 'auth/popup-closed-by-user': return 'Sign-in window closed before finishing.'
    case 'auth/popup-blocked':        return 'Your browser blocked the popup — allow popups and try again.'
    case 'auth/unauthorized-domain':  return 'This site isn’t authorized for sign-in. (Admin: add the domain in Firebase Auth.)'
    case 'auth/network-request-failed':return 'Network error — check your connection and try again.'
    default: return err?.message ? err.message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '') : 'Something went wrong. Please try again.'
  }
}

export function AuthModal({ mode, onClose, isW }) {
  const { user, pro, signIn, signUpEmail, signInEmail } = useAuth()
  const [view, setView] = useState(mode === 'pro' ? 'pro' : 'signin')
  const [emailMode, setEmailMode] = useState('signup') // 'signup' (create free profile) | 'signin'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const color = ac(isW)

  const FUNCTIONS_BASE = 'https://us-east1-creasefeed.cloudfunctions.net'

  const handleGoogle = async () => {
    setError('')
    try {
      await signIn()
      onClose()
    } catch (e) {
      setError(friendlyAuthError(e))
    }
  }

  const handleEmailAuth = async (e) => {
    if (e) e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    if (emailMode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setAuthLoading(true)
    try {
      if (emailMode === 'signup') await signUpEmail(email, password, name)
      else                        await signInEmail(email, password)
      onClose()
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setAuthLoading(false)
    }
  }

  const handleCheckout = async (plan) => {
    if (!user) {
      // Need to sign in first
      setView('signin')
      return
    }
    setCheckoutLoading(true)
    setError('')
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, email: user.email, plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch (e) {
      setError('Could not connect to payment server. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    setCheckoutLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/createPortalSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError('Could not open subscription manager.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {view === 'pro' ? (
          <>
            <div className="auth-title" style={{ color }}>Go Pro</div>
            <div className="auth-sub" style={{ fontStyle: 'italic', color, opacity: 0.85, marginBottom: 8 }}>Feed the Crease.</div>
            {pro ? (
              <>
                <div className="auth-sub" style={{ marginBottom: 16 }}>
                  You're a Pro member! Manage your subscription below.
                </div>
                <button
                  className={`btn-auth ${isW ? 'w' : ''}`}
                  onClick={handleManageSubscription}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              </>
            ) : (
              <>
                <div className="auth-sub">
                  Everything you need to follow college lacrosse — live play-by-play, push alerts, full stats, and zero ads.
                </div>
                <ul className={`pro-features ${isW ? 'w' : ''}`} style={{ marginBottom: 24 }}>
                  <li>Live play-by-play & shot charts</li>
                  <li>Push alerts for your teams</li>
                  <li>Full advanced stats database</li>
                  <li>Recruiting board access (coming soon)</li>
                  <li>Ad-free on all devices</li>
                </ul>
                {error && <div className="auth-error" style={{ marginBottom: 10 }}>{error}</div>}
                <button
                  className={`btn-auth ${isW ? 'w' : ''}`}
                  style={{ marginBottom: 10 }}
                  onClick={() => handleCheckout('monthly')}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Loading...' : 'Start Pro — $9.99/month →'}
                </button>
                <button
                  className={`btn-auth-outline ${isW ? 'w' : ''}`}
                  style={{ marginBottom: 10, width: '100%' }}
                  onClick={() => handleCheckout('annual')}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Loading...' : 'Annual — $79.99/year (save 33%) →'}
                </button>
                <div className="pro-price" style={{ textAlign: 'center', marginBottom: 16 }}>Cancel anytime</div>
              </>
            )}
            {!user && (
              <div className="auth-switch">
                Already have an account?{' '}
                <button className={isW ? 'w' : ''} onClick={() => setView('signin')}>Sign in</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="auth-title">{emailMode === 'signup' ? 'Create your free account' : 'Welcome back'}</div>
            <div className="auth-sub">
              {emailMode === 'signup'
                ? 'Free to follow your teams and get game alerts. No card required.'
                : 'Sign in to your CreaseFeed account.'}
            </div>
            <button className="btn-google" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>OR</span></div>
            <form className="auth-email-form" onSubmit={handleEmailAuth}>
              {emailMode === 'signup' && (
                <input
                  className={`auth-input ${isW ? 'w' : ''}`}
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              )}
              <input
                className={`auth-input ${isW ? 'w' : ''}`}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className={`auth-input ${isW ? 'w' : ''}`}
                type="password"
                placeholder={emailMode === 'signup' ? 'Create a password (6+ characters)' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
              {error && <div className="auth-error">{error}</div>}
              <button className={`btn-auth ${isW ? 'w' : ''}`} type="submit" disabled={authLoading}>
                {authLoading ? 'Please wait…' : emailMode === 'signup' ? 'Create free account' : 'Sign in'}
              </button>
            </form>
            <div className="auth-switch" style={{ marginTop: 14 }}>
              {emailMode === 'signup' ? (
                <>Already have an account?{' '}
                  <button className={isW ? 'w' : ''} onClick={() => { setEmailMode('signin'); setError('') }}>Sign in</button>
                </>
              ) : (
                <>Need an account?{' '}
                  <button className={isW ? 'w' : ''} onClick={() => { setEmailMode('signup'); setError('') }}>Create one free</button>
                </>
              )}
            </div>
            <div className="auth-switch" style={{ marginTop: 8 }}>
              Want full access?{' '}
              <button className={isW ? 'w' : ''} onClick={() => setView('pro')}>See Pro →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-logo">CREASE<em>FEED</em></div>
          <div className="footer-tag">Feed the Crease · creasefeed.com</div>
        </div>
        <div className="footer-links">
          <a className="footer-link" href="#">About</a>
          <a className="footer-link" href="#">Contact</a>
          <a className="footer-link" href="#">Privacy</a>
          <a className="footer-link" href="#">Terms</a>
          <a className="footer-link" href="#">Data API</a>
        </div>
      </div>
    </footer>
  )
}
