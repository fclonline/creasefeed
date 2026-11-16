import { useState, useEffect } from 'react'
import { useScores, useStatLeaders } from '../hooks/useScores.jsx'
import { useSeasonState } from '../hooks/useSeasonState.jsx'
import PollCard from '../components/PollCard.jsx'
import { LIVE_PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL } from '../config/pro.js'
import { getSeason } from '../api/firestore.js'
import { DATE_ENTRIES, CONFERENCES_M, CONFERENCES_W } from '../data/mockData.js'
import { GameCard, GameModal, CollapsibleFilter, ac } from '../components/shared.jsx'

// Only surfaces a load failure; no data-source labels in the UI.
function LoadError({ error }) {
  if (!error) return null
  return <div className="load-error" role="alert">Scores couldn't load. Please refresh.</div>
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

  const { games, loading, error } = useScores(gender, dateParam, division)

  const confs    = isW ? CONFERENCES_W : CONFERENCES_M
  const filtered = games.filter(g => activeConf === 'All' || g.conf === activeConf)
  const live     = filtered.filter(g => g.status === 'live')
  const final    = filtered.filter(g => g.status === 'final')
  const upcoming = filtered.filter(g => g.status === 'upcoming')
  const selected = selectedId ? games.find(g => g.id === selectedId) : null
  const season = useSeasonState()
  const offseason = !!season?.offseason
  const { rows: goalLeaders, loading: statsLoading } = useStatLeaders(gender, 'goals', division)
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
          <LoadError error={error}/>

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
            <div className="empty-state">No games scheduled for this date.</div>
          )}
        </div>

        <div className="sidebar">
          <PollCard gender={gender} division={division} />

          {/* Stat leaders: hidden in the off-season; neutral line in season with no data yet */}
          {!offseason && !statsLoading && (
            <div className="widget">
              <div className="widget-hd">
                <h2 className="widget-title">Goals Leaders</h2>
                <span className="widget-sub">{getSeason()} · D{division}</span>
              </div>
              {performers.length === 0 ? (
                <div className="widget-empty">Stats update after games are final.</div>
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
          )}

          <div className={`pro-widget ${isW?'w':''}`}>
            <div className="pro-title" style={{color:ac(isW)}}>Go Pro</div>
            <ul className={`pro-features ${isW?'w':''}`}>
              {LIVE_PRO_FEATURES.map(f => <li key={f.label}>{f.label}</li>)}
            </ul>
            <button className={`btn-pro ${isW?'w':''}`} style={{width:'100%',padding:10,fontSize:13}} onClick={()=>onAuthClick('pro')}>
              {PRO_PRICE_MONTHLY} / month →
            </button>
            <div className="pro-price">or {PRO_PRICE_ANNUAL} / year · cancel anytime</div>
          </div>
        </div>
      </div>

      {selected && <GameModal game={selected} onClose={()=>setSelectedId(null)} isW={isW} espnId={selected.espnId} gender={gender}/>}
    </>
  )
}
