import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { TICKER_ITEMS, SCORING_PLAYS } from '../data/mockData.js'

// ─── helpers ────────────────────────────────────────────────────────────────
export const ac  = (isW) => isW ? 'var(--women)' : 'var(--accent)'
export const chip = (isW) => isW ? 'active-w' : 'active-m'

// ─── TICKER ─────────────────────────────────────────────────────────────────
export function Ticker({ gender, division, isW }) {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="ticker-root">
      <div className={`ticker-badge ${isW ? 'w' : ''}`}>
        CREASEFEED · {gender} D{division}
      </div>
      <div className="ticker-scroll">
        <div className="ticker-track">
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

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
    : '?'

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

// ─── CONTEXT BAR ────────────────────────────────────────────────────────────
export function ContextBar({ gender, setGender, division, setDivision, isW }) {
  const ac = chip(isW)
  return (
    <div className="context-bar">
      <div className="gender-toggle">
        <button className={`gender-btn ${gender === 'M' ? 'active-m' : ''}`} onClick={() => setGender('M')}>Men's</button>
        <button className={`gender-btn ${gender === 'W' ? 'active-w' : ''}`} onClick={() => setGender('W')}>Women's</button>
      </div>
      <div className="div-sep" />
      <span className="div-label">Division</span>
      <div className="div-btns">
        {['1', '2', '3'].map(d => (
          <button key={d} className={`div-btn ${division === d ? ac : ''}`} onClick={() => setDivision(d)}>D{d}</button>
        ))}
      </div>
      <div className="ctx-season">2026 · Spring Season</div>
    </div>
  )
}

// ─── GAME CARD ───────────────────────────────────────────────────────────────
export function GameCard({ game, onClick, isW }) {
  const hasScore = game.status !== 'upcoming'
  const awayWin  = hasScore && game.away.score > game.home.score
  return (
    <div className={`game-card ${game.status} ${isW ? 'w' : ''}`} onClick={onClick}>
      <div className="gc-meta">
        <div className={`gc-status ${game.status} ${isW ? 'w' : ''}`}>
          {game.status === 'live' && <span className={`live-dot ${isW ? 'w' : ''}`} />}
          {game.period}
        </div>
        <div className="gc-conf">{game.conf}</div>
      </div>
      <div className="gc-teams">
        {[{ t: game.away, isAway: true }, { t: game.home, isAway: false }].map(({ t, isAway }, idx) => {
          const wins  = hasScore && (isAway ? awayWin : !awayWin)
          const loses = hasScore && (isAway ? !awayWin : awayWin)
          return (
            <div key={idx} className="gc-team-row">
              <div className="gc-rank">{t.rank ? `#${t.rank}` : ''}</div>
              <div className={`gc-name ${loses ? 'dim' : ''}`}>{t.name}</div>
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

// ─── GAME MODAL ──────────────────────────────────────────────────────────────
export function GameModal({ game, onClose, isW }) {
  const hasScore = game.status !== 'upcoming'
  const awayWin  = hasScore && game.away.score > game.home.score
  const isLive   = game.status === 'live'
  const color    = ac(isW)

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
              {game.period}
            </div>
          </div>

          <div className="msb-team home">
            {game.home.rank && <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>#{game.home.rank}</div>}
            <div className="msb-school" style={{ color: hasScore && awayWin ? 'var(--muted)' : 'var(--text)', textAlign: 'right' }}>{game.home.name}</div>
            <div className="msb-rec" style={{ textAlign: 'right' }}>{game.home.rec}</div>
          </div>
        </div>

        {hasScore && (
          <div className="modal-body">
            {/* quarter scores */}
            <div className="modal-sec">
              <div className="modal-sec-title">Scoring by Quarter</div>
              <div className="q-grid">
                {['', 'Q1', 'Q2', 'Q3', 'Q4', 'T'].map(h => <div key={h} className="qc hd">{h}</div>)}
                {[game.away, game.home].map((t, ri) => {
                  const qs = ri === 0 ? [3, 4, 2, 0] : [2, 3, 2, 0]
                  return [
                    <div key={`n${ri}`} className="qc lbl">{t.name.split(' ').slice(-1)[0]}</div>,
                    ...qs.map((v, ci) => (
                      <div key={`q${ri}${ci}`} className={`qc ${ci === 3 && isLive ? 'dim' : ''} ${ci === 4 ? 'tot' : ''}`}>
                        {ci === 3 && isLive ? '-' : ci === 4 ? t.score : v}
                      </div>
                    ))
                  ]
                })}
              </div>
            </div>

            {/* team stats */}
            <div className="modal-sec">
              <div className="modal-sec-title">Team Stats</div>
              <div className="tstats">
                {[
                  { label: 'Shots',       a: 28, h: 22 },
                  { label: 'Shots on Goal', a: 19, h: 15 },
                  { label: 'FO Won',      a: 14, h: 10 },
                  { label: 'Clears',      a: '8/10', h: '6/9' },
                  { label: 'Turnovers',   a: 7,  h: 10 },
                  { label: 'Penalties',   a: 3,  h: 5 },
                ].map(s => {
                  const av = parseFloat(s.a), hv = parseFloat(s.h), tot = (av + hv) || 1
                  return (
                    <div key={s.label} className="tstat-row">
                      <div className="tstat-val left">{s.a}</div>
                      <div className="tstat-center">
                        <div className="tstat-label">{s.label}</div>
                        <div className="tstat-bar">
                          <div className={`tstat-bar-l ${isW ? 'w' : ''}`} style={{ opacity: Math.max(0.2, av / tot) }} />
                          <div className="tstat-bar-r" style={{ opacity: Math.max(0.2, hv / tot) }} />
                        </div>
                      </div>
                      <div className="tstat-val right">{s.h}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* scoring plays */}
            <div className="modal-sec">
              <div className="modal-sec-title">Scoring Plays</div>
              {SCORING_PLAYS.map((p, i) => (
                <div key={i} className="play-row">
                  <div className="play-qtr">{p.qtr}</div>
                  <div className="play-team" style={{ color: p.team === 'MD' ? color : 'var(--text)' }}>{p.team}</div>
                  <div className="play-desc">{p.desc}</div>
                  <div className={`play-sc ${isW ? 'w' : ''}`}>{p.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AUTH MODAL ──────────────────────────────────────────────────────────────
export function AuthModal({ mode, onClose, isW }) {
  const { signIn } = useAuth()
  const [view, setView] = useState(mode === 'pro' ? 'pro' : 'signin')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const color = ac(isW)

  const handleGoogle = async () => {
    try {
      await signIn()
      onClose()
    } catch (e) {
      setError('Sign in failed. Please try again.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {view === 'pro' ? (
          <>
            <div className="auth-title" style={{ color }}>Go Pro</div>
            <div className="auth-sub" style={{ fontStyle: 'italic', color, opacity: 0.85, marginBottom: 8 }}>Feed the Crease.</div>
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
            <button className={`btn-auth ${isW ? 'w' : ''}`} style={{ marginBottom: 10 }}>
              Start Pro — $9.99/month →
            </button>
            <div className="pro-price" style={{ textAlign: 'center', marginBottom: 16 }}>or $79.99/year · cancel anytime</div>
            <div className="auth-switch">
              Already have an account?{' '}
              <button className={isW ? 'w' : ''} onClick={() => setView('signin')}>Sign in</button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-title">Sign In</div>
            <div className="auth-sub">Create a free account to follow your teams and get live alerts.</div>
            <button className="btn-google" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>OR</span></div>
            <div className="auth-email-form">
              <input
                className={`auth-input ${isW ? 'w' : ''}`}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input className={`auth-input ${isW ? 'w' : ''}`} type="password" placeholder="Password" />
              {error && <div className="auth-error">{error}</div>}
              <button className={`btn-auth ${isW ? 'w' : ''}`}>Continue with Email</button>
            </div>
            <div className="auth-switch" style={{ marginTop: 16 }}>
              Want full access?{' '}
              <button className={isW ? 'w' : ''} onClick={() => setView('pro')}>Try Pro free →</button>
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
