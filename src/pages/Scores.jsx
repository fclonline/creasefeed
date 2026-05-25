import { useState, useEffect } from 'react'
import { useScores, useStandings, useStatLeaders } from '../hooks/useScores.jsx'
import { DATE_ENTRIES, CONFERENCES_M, CONFERENCES_W } from '../data/mockData.js'
import { GameCard, GameModal, CollapsibleFilter, ac } from '../components/shared.jsx'

function SourceBadge({ source, error }) {
  if (!source || source === 'loading') return null
  const isNcaa = source === 'ncaa'
  const isEmpty = source === 'empty'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
      color: isNcaa ? 'var(--accent)' : 'var(--muted)',
      marginBottom: 16,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isNcaa ? 'var(--accent)' : 'var(--muted)',
        display: 'inline-block',
        ...(isNcaa ? { animation: 'blink 2s infinite' } : {}),
      }} />
      {isNcaa ? 'Live data · NCAA' : isEmpty ? 'No games scheduled today' : 'Loading...'}
      {error && <span style={{ color: 'var(--yellow)', marginLeft: 4 }}>⚠ {error}</span>}
    </div>
  )
}

function GameSkeleton() {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderLeft:'3px solid var(--border)',padding:'13px 16px 13px 18px',marginBottom:2}}>
      <style>{`@keyframes pulse-sk{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      {[0,1].map(i=>(
        <div key={i} style={{display:'flex',gap:10,marginBottom:i===0?8:0,alignItems:'center'}}>
          <div style={{width:22}}/>
          <div style={{flex:1,height:16,background:'var(--surface2)',animation:'pulse-sk 1.5s infinite'}}/>
          <div style={{width:30,height:16,background:'var(--surface2)',animation:'pulse-sk 1.5s infinite'}}/>
        </div>
      ))}
    </div>
  )
}

export default function ScoresPage({ gender, division, isW, onAuthClick }) {
  const todayIdx = DATE_ENTRIES.findIndex(d => d.isToday)
  const [activeDateIdx, setActiveDateIdx] = useState(todayIdx >= 0 ? todayIdx : 3)
  const [activeConf, setActiveConf] = useState('All')
  const [selectedId, setSelectedId] = useState(null)

  // Reset conference filter when division or gender changes (conferences differ across divisions)
  useEffect(() => { setActiveConf('All') }, [division, gender])

  // Convert selected date to YYYYMMDD for ESPN API
  const activeEntry = DATE_ENTRIES[activeDateIdx]
  const activeDate  = activeEntry?.label
  const dateObj     = activeEntry?.date
  const dateParam   = dateObj
    ? `${dateObj.getFullYear()}${String(dateObj.getMonth()+1).padStart(2,'0')}${String(dateObj.getDate()).padStart(2,'0')}`
    : undefined

  const { games, loading, error, source } = useScores(gender, dateParam, division)
  const { standings } = useStandings(gender)

  const confs    = isW ? CONFERENCES_W : CONFERENCES_M
  const filtered = games.filter(g => activeConf === 'All' || g.conf === activeConf)
  const live     = filtered.filter(g => g.status === 'live')
  const final    = filtered.filter(g => g.status === 'final')
  const upcoming = filtered.filter(g => g.status === 'upcoming')
  const selected = selectedId ? games.find(g => g.id === selectedId) : null
  const { rows: goalLeaders, source: statsSource } = useStatLeaders(gender, 'goals')
  const performers = goalLeaders.slice(0, 4)

  return (
    <>
      <div className="date-bar">
        <button className="date-arrow" onClick={()=>setActiveDateIdx(i=>Math.max(0,i-1))}>‹</button>
        {DATE_ENTRIES.map((d,i)=>(
          <button key={d.label} className={`date-btn ${activeDateIdx===i?`active ${isW?'w':''}`:''}` } onClick={()=>setActiveDateIdx(i)}>{d.label}</button>
        ))}
        <button className="date-arrow" onClick={()=>setActiveDateIdx(i=>Math.min(DATE_ENTRIES.length-1,i+1))}>›</button>
      </div>

      <div className="page-layout">
        <div>
          <SourceBadge source={source} error={error}/>

          <div className="filter-row">
            <CollapsibleFilter
              label="Conference"
              options={confs.map(c => ({ value: c, label: c }))}
              value={activeConf} onChange={setActiveConf} isW={isW}
            />
          </div>

          {loading && [1,2,3].map(i=><GameSkeleton key={i}/>)}

          {!loading && live.length>0 && (<>
            <div className="sec-header">
              <span className="sec-title">In Progress</span>
              <span className={`live-pill ${isW?'w':''}`}>LIVE</span>
              <span className="count-pill">{live.length}</span>
            </div>
            <div className="games-stack">{live.map(g=><GameCard key={g.id} game={g} isW={isW} onClick={()=>setSelectedId(g.id)}/>)}</div>
          </>)}

          {!loading && final.length>0 && (<>
            <div className="sec-header">
              <span className="sec-title">Final</span>
              <span className="count-pill">{final.length}</span>
            </div>
            <div className="games-stack">{final.map(g=><GameCard key={g.id} game={g} isW={isW} onClick={()=>setSelectedId(g.id)}/>)}</div>
          </>)}

          {!loading && upcoming.length>0 && (<>
            <div className="sec-header">
              <span className="sec-title">Upcoming</span>
              <span className="count-pill">{upcoming.length}</span>
            </div>
            <div className="games-stack">{upcoming.map(g=><GameCard key={g.id} game={g} isW={isW} onClick={()=>setSelectedId(g.id)}/>)}</div>
          </>)}

          {!loading && games.length===0 && (
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted)',fontFamily:"'Barlow Condensed'",fontSize:16}}>
              No games scheduled for this date.
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="widget">
            <div className="widget-hd">
              <span className="widget-title">AP Top 20</span>
              <span className="widget-sub">{gender==='M'?"Men's":"Women's"} · D{division}</span>
            </div>
            {standings.length === 0 ? (
              <div style={{padding:'20px 14px',fontFamily:"'Barlow'",fontSize:12,color:'var(--red)',textAlign:'center'}}>
                NO DATA — polls/standings not yet scraped
              </div>
            ) : (
              <table className="std-table">
                <thead><tr><th>Team</th><th>W</th><th>L</th><th>Streak</th></tr></thead>
                <tbody>
                  {standings.map(s=>(
                    <tr key={s.rank}>
                      <td><span className="std-rank">{s.rank}</span>{s.team}</td>
                      <td style={{color:'var(--text)'}}>{s.w}</td>
                      <td>{s.l}</td>
                      <td style={{color:s.streak?.startsWith?.('W')?ac(isW):'var(--red)'}}>{s.streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="widget">
            <div className="widget-hd">
              <span className="widget-title">Goals Leaders</span>
              <span className="widget-sub">2026 · D{division}</span>
            </div>
            {performers.length === 0 ? (
              <div style={{padding:'20px 14px',fontFamily:"'Barlow'",fontSize:12,color:'var(--red)',textAlign:'center'}}>
                NO DATA — playerStats not yet scraped
              </div>
            ) : performers.map((p,i)=>(
              <div key={i} className="perf-row">
                <div className={`perf-num ${isW?'w':''}`}>{p.g}</div>
                <div className="perf-info">
                  <div className="perf-name">{p.name}</div>
                  <div className="perf-school">{p.team} · {p.pos}</div>
                </div>
                <div className="perf-cat">Goals</div>
              </div>
            ))}
          </div>

          <div className={`pro-widget ${isW?'w':''}`}>
            <div className="pro-title" style={{color:ac(isW)}}>Go Pro</div>
            <div className="pro-tagline" style={{color:ac(isW)}}>Feed the Crease.</div>
            <ul className={`pro-features ${isW?'w':''}`}>
              <li>Live play-by-play & shot charts</li>
              <li>Push alerts for your teams</li>
              <li>Full advanced stats database</li>
              <li>Recruiting board (coming soon)</li>
              <li>Ad-free everywhere</li>
            </ul>
            <button className={`btn-pro ${isW?'w':''}`} style={{width:'100%',padding:10,fontSize:13}} onClick={()=>onAuthClick('pro')}>
              $9.99 / month →
            </button>
            <div className="pro-price">or $79.99 / year · cancel anytime</div>
          </div>
        </div>
      </div>

      {selected && <GameModal game={selected} onClose={()=>setSelectedId(null)} isW={isW} espnId={selected.espnId} gender={gender}/>}
    </>
  )
}
