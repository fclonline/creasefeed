import { useState } from 'react'
import { useTeams, ALERT_LEVELS, ALERT_LABELS } from '../hooks/useTeams.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { useScores } from '../hooks/useScores.jsx'
import { GameCard, GameModal, ac } from '../components/shared.jsx'
import FeedPicker from '../components/FeedPicker.jsx'

const CSS = `
/* ── MY FEED ── */
.myfeed-page { max-width: 1320px; margin: 0 auto; padding: 24px 28px 80px; display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
@media(max-width: 960px) { .myfeed-page { grid-template-columns: 1fr; } }

.myfeed-empty {
  grid-column: 1 / -1; text-align: center; padding: 80px 20px;
}
.myfeed-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: .4; }
.myfeed-empty-title { font-family: 'Barlow Condensed', sans-serif; font-weight:800; font-size: 28px; margin-bottom: 8px; }
.myfeed-empty-sub   { font-family: 'Inter',sans-serif; font-size: 14px; color: var(--mid); margin-bottom: 24px; }
.myfeed-empty-cta   { background: var(--accent); color:var(--cf-on-green); font-family: 'Inter', sans-serif; font-weight:700; font-size: 15px; border-radius: 8px; min-height: 44px; padding: 10px 24px; cursor: pointer; transition: background .15s; border: none; }
.myfeed-empty-cta:hover { background: var(--accent-hover); }

/* following sidebar */
.following-widget { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
.fw-team-row { padding: 10px 14px; border-bottom: 1px solid var(--hairline); display: flex; align-items: center; gap: 10px; }
.fw-team-row:last-child { border-bottom: none; }
.fw-team-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; flex: 1; }
.fw-team-meta { font-family: 'Inter',sans-serif; font-size:13px; color: var(--muted); }
.fw-alert-select {
  background: var(--surface2); border: 1px solid var(--border2); color: var(--mid);
  font-family: 'Inter', sans-serif; font-size:13px; border-radius: 6px; padding: 4px 6px; cursor: pointer; outline: none;
}
.fw-unfollow { color: var(--muted); font-size: 16px; cursor: pointer; transition: color .15s; }
.fw-unfollow:hover { color: var(--red); }
.fw-gender-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* gender toggle (My Feed only) */
.myfeed-genderbar { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
.myfeed-gender-label { font-family: 'Inter', sans-serif; font-size:13px; font-weight: 600; color: var(--muted); margin-right: 2px; }
.myfeed-gender-toggle { display: flex; border: 1px solid var(--border); border-radius: 10px; padding: 4px; background: var(--surface); overflow: hidden; }
.myfeed-gtab { font-family: 'Inter', sans-serif; font-weight: 600; font-size:15px; min-height: 40px; border-radius: 7px; padding: 8px 16px; color: var(--cf-text-2); border-right: 0; transition: all .15s; background: transparent; }
.myfeed-gtab:last-child { border-right: none; }
.myfeed-gtab:hover { color: var(--text); background: var(--surface2); }
.myfeed-gtab.active-all, .myfeed-gtab.active-m, .myfeed-gtab.active-w { background: var(--cf-select); color: var(--cf-on-select); }

/* game card following badge */
.gc-following-badge {
  font-family: 'Inter', sans-serif; font-weight: 700; font-size:12px;
  letter-spacing: .06em; padding: 3px 8px; border-radius: 999px; text-transform: uppercase;
  position: absolute; top: 10px; right: 10px;
}
`

export default function MyFeedPage({ onEditTeams, onAuthClick, isW, gender, division }) {
  const { user, pro } = useAuth()
  const { followedList, followedTeams, unfollowTeam, setAlertLevel, isFollowing } = useTeams()
  const [selectedId, setSelectedId] = useState(null)
  const [genderFilter, setGenderFilter] = useState('all') // 'all' | 'M' | 'W'

  // Hooks must be called unconditionally (React rules of hooks)
  const { games: mensGames } = useScores('M')
  const { games: womensGames } = useScores('W')

  // Signed out (or signed in with nothing followed): teams-first picker.
  if (!user || followedList.length === 0) {
    return <FeedPicker gender={gender} division={division} onAuthClick={onAuthClick} />
  }

  // get all games across both genders from real data sources
  const allGames = [...mensGames, ...womensGames]
  const followedNames = new Set(followedList.map(t => t.name?.toLowerCase()).filter(Boolean))

  const myGames = allGames.filter(g =>
    followedNames.has(g.away?.name?.toLowerCase()) ||
    followedNames.has(g.home?.name?.toLowerCase())
  )

  // Show the gender toggle only when the feed actually contains both men's and
  // women's games (matching is by team name, so a followed name can surface both).
  const feedHasBoth = myGames.some(g => g.gender === 'M') && myGames.some(g => g.gender === 'W')
  const genderFiltered = (feedHasBoth && genderFilter !== 'all')
    ? myGames.filter(g => g.gender === genderFilter)
    : myGames
  // In the "All" view (with mixed games), denote each game's gender on the card.
  const showGenderOnCards = feedHasBoth && genderFilter === 'all'

  const live     = genderFiltered.filter(g => g.status === 'live')
  const final    = genderFiltered.filter(g => g.status === 'final')
  const upcoming = genderFiltered.filter(g => g.status === 'upcoming')
  const selected = selectedId ? allGames.find(g => g.id === selectedId) : null

  return (
    <>
      <style>{CSS}</style>
      <div className="myfeed-page">

        {/* main column */}
        <div>
          {followedList.length === 0 ? (
            <div className="myfeed-empty">
              <div className="myfeed-empty-icon">🥍</div>
              <div className="myfeed-empty-title">Your feed is empty</div>
              <div className="myfeed-empty-sub">Follow your teams to see their games here and get alerts when they play.</div>
              <button className="myfeed-empty-cta" onClick={onEditTeams}>Follow Teams →</button>
            </div>
          ) : myGames.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="empty-title">No games today for your teams</div>
              <div style={{ fontFamily: "'Inter'", fontSize: 14, color: 'var(--mid)' }}>Check the Schedule tab for upcoming games.</div>
            </div>
          ) : (
            <>
              {feedHasBoth && (
                <div className="myfeed-genderbar">
                  <span className="myfeed-gender-label">Show</span>
                  <div className="myfeed-gender-toggle">
                    {[{ v: 'all', l: 'All' }, { v: 'M', l: "Men's" }, { v: 'W', l: "Women's" }].map(o => (
                      <button
                        key={o.v}
                        className={`myfeed-gtab ${genderFilter === o.v ? (o.v === 'all' ? 'active-all' : o.v === 'M' ? 'active-m' : 'active-w') : ''}`}
                        onClick={() => setGenderFilter(o.v)}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {genderFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <div className="empty-title" style={{ fontSize: 20 }}>
                    No {genderFilter === 'M' ? "men's" : "women's"} games today for your teams
                  </div>
                  <div style={{ fontFamily: "'Inter'", fontSize: 13, color: 'var(--mid)' }}>Switch the filter above or check the Schedule tab.</div>
                </div>
              ) : (
                <>
                  {live.length > 0 && (
                    <>
                      <div className="sec-header">
                        <span className="sec-title">Your Teams — Live</span>
                        <span className="live-pill">LIVE</span>
                        <span className="count-pill">{live.length}</span>
                      </div>
                      <div className="games-stack">
                        {live.map(g => <GameCard key={g.id} game={g} isW={g.gender === 'W'} showGender={showGenderOnCards} onClick={() => setSelectedId(g.id)} />)}
                      </div>
                    </>
                  )}
                  {final.length > 0 && (
                    <>
                      <div className="sec-header">
                        <span className="sec-title">Your Teams — Final</span>
                        <span className="count-pill">{final.length}</span>
                      </div>
                      <div className="games-stack">
                        {final.map(g => <GameCard key={g.id} game={g} isW={g.gender === 'W'} showGender={showGenderOnCards} onClick={() => setSelectedId(g.id)} />)}
                      </div>
                    </>
                  )}
                  {upcoming.length > 0 && (
                    <>
                      <div className="sec-header">
                        <span className="sec-title">Your Teams — Upcoming</span>
                        <span className="count-pill">{upcoming.length}</span>
                      </div>
                      <div className="games-stack">
                        {upcoming.map(g => <GameCard key={g.id} game={g} isW={g.gender === 'W'} showGender={showGenderOnCards} onClick={() => setSelectedId(g.id)} />)}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* sidebar — Following list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="following-widget">
            <div className="widget-hd" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="widget-title">Following ({followedList.length})</span>
              <button
                onClick={onEditTeams}
                className="link-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>

            {followedList.length === 0 ? (
              <div style={{ padding: '20px 14px', fontFamily: "'Inter'", fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                No teams followed yet.
                <br />
                <button onClick={onEditTeams} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', marginTop: 8 }}>
                  + Follow teams
                </button>
              </div>
            ) : (
              followedList.map(t => {
                const tIsW = t.gender === 'W'
                const pref = followedTeams[t.id]?.alertLevel || ALERT_LEVELS.FINAL
                const proLocked = !pro && (pref === ALERT_LEVELS.GOALS || pref === ALERT_LEVELS.LIVE)
                return (
                  <div key={t.id} className="fw-team-row">
                    <div className="fw-gender-dot" style={{ background: tIsW ? 'var(--women)' : 'var(--accent)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-team-name">{t.name}</div>
                      <div className="fw-team-meta">D{t.div} · {t.conf}</div>
                    </div>
                    <select
                      className="fw-alert-select"
                      value={pref}
                      onChange={e => setAlertLevel(t.id, e.target.value)}
                      title="Alert preferences"
                    >
                      {Object.entries(ALERT_LABELS).map(([k, l]) => (
                        <option key={k} value={k} disabled={!pro && (k === 'goals' || k === 'live')}>
                          {l}{!pro && (k === 'goals' || k === 'live') ? ' (Pro)' : ''}
                        </option>
                      ))}
                    </select>
                    <button className="fw-unfollow" onClick={() => unfollowTeam(t.id)} title="Unfollow">×</button>
                  </div>
                )
              })
            )}
          </div>

          {/* free tier nudge */}
          {!pro && user && (
            <div style={{
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              padding: '16px 14px',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
                {followedList.length >= 2 ? 'Following limit reached' : `${followedList.length}/2 free teams used`}
              </div>
              <div style={{ fontFamily: "'Inter'", fontSize: 13, color: 'var(--mid)', marginBottom: 12, lineHeight: 1.6 }}>
                Upgrade to Pro to follow unlimited teams.
              </div>
              <button
                onClick={() => onAuthClick('pro')}
                className="btn-ink" style={{ width: '100%' }}
              >
                Go Pro →
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && <GameModal game={selected} onClose={() => setSelectedId(null)} isW={selected.gender === 'W'} espnId={selected.espnId} gender={selected.gender} />}
    </>
  )
}
