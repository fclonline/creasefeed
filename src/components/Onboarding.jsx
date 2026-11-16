import { useState, useMemo, useEffect, useRef } from 'react'
import { searchPrograms, getProgramById } from '../data/programs.js'
import { useTeams } from '../hooks/useTeams.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

const GENDER_OPTS = [
  { v: 'all', l: "All" },
  { v: 'M',   l: "Men's" },
  { v: 'W',   l: "Women's" },
]
const DIV_OPTS = [
  { v: 'all', l: "All Divisions" },
  { v: '1',   l: "D1" },
  { v: '2',   l: "D2" },
  { v: '3',   l: "D3" },
]

const CSS = `
.ob-root {
  position: fixed; inset: 0; background: var(--bg); z-index: 300;
  display: flex; flex-direction: column; overflow: hidden;
}
.ob-header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 20px 32px; flex-shrink: 0;
}
.ob-logo { font-family: 'Barlow Condensed', sans-serif; font-weight:800; font-size: 22px; margin-bottom: 12px; }
.ob-logo em { color: var(--accent); font-style: normal; }
.ob-headline { font-family: 'Barlow Condensed', sans-serif; font-weight:800; font-size: 32px; line-height: 1.1; margin-bottom: 6px; }
.ob-sub { font-family: 'Inter',sans-serif; font-size: 14px; color: var(--mid); }
.ob-sub strong { color: var(--accent); }

.ob-controls {
  background: var(--surface2); border-bottom: 1px solid var(--border);
  padding: 12px 32px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0;
}
.ob-search {
  flex: 1; min-width: 200px; border-radius: 8px; min-height: 44px;
  background: var(--surface); border: 1px solid var(--border2);
  color: var(--text); padding: 8px 14px;
  font-family: 'Inter',sans-serif; font-size: 14px; outline: none;
  transition: border-color .15s;
}
.ob-search:focus { border-color: var(--accent); }
.ob-search::placeholder { color: var(--muted); }
.ob-filter-group { display: flex; border: 1px solid var(--border); border-radius: 10px; padding: 3px; background: var(--surface); overflow: hidden; }
.ob-filter-btn {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size:14px;
  border-radius: 7px; padding: 8px 14px; min-height: 38px;
  color: var(--cf-text-2); border-right: 0; transition: all .15s;
}
.ob-filter-btn:last-child { border-right: none; }
.ob-filter-btn:hover { color: var(--text); background: var(--surface3); }
.ob-filter-btn.on { background: var(--cf-select); color: var(--cf-on-select); }
.ob-count { font-family: 'Inter',sans-serif; font-size:13px; color: var(--muted); white-space: nowrap; }

.ob-grid-wrap { flex: 1; overflow-y: auto; padding: 20px 32px; scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
.ob-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }

.ob-team-card {
  background: var(--surface); border: 2px solid var(--border); border-radius: 12px;
  padding: 14px 16px; cursor: pointer; transition: all .15s;
  display: flex; flex-direction: column; gap: 4px; position: relative;
}
.ob-team-card:hover { border-color: var(--border2); background: var(--surface2); }
.ob-team-card.selected { border-color: var(--accent); background: var(--accent-bg); }
.ob-team-card.selected.w { border-color: var(--women); background: var(--women-bg); }
.ob-team-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; line-height: 1.1; }
.ob-team-meta { font-family: 'Inter',sans-serif; font-size:13px; color: var(--muted); }
.ob-team-badges { display: flex; gap: 5px; margin-top: 2px; }
.ob-badge {
  font-family: 'Inter', sans-serif; font-weight: 700; font-size:12px;
  letter-spacing: .06em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; border: 1px solid;
}
.ob-badge-div { color: var(--muted); border-color: var(--border2); }
.ob-badge-m   { color: var(--accent); border-color: var(--accent-border); }
.ob-badge-w   { color: var(--women);  border-color: var(--women-border); }
.ob-check {
  position: absolute; top: 10px; right: 10px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--accent); display: flex; align-items: center; justify-content: center;
  font-size:12px; font-weight:800; color:var(--cf-on-green);
}
.ob-check.w { background: var(--women); }

.ob-footer {
  background: var(--surface); border-top: 1px solid var(--border);
  padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; gap: 16px;
}
.ob-selected-preview { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
.ob-sel-tag {
  background: var(--surface2); border: 1px solid var(--border2);
  font-family: 'Inter', sans-serif; font-weight: 600; font-size:14px; border-radius: 999px;
  padding: 4px 10px; display: flex; align-items: center; gap: 6px; color: var(--text);
}
.ob-sel-remove { color: var(--muted); cursor: pointer; font-size: 14px; line-height: 1; }
.ob-sel-remove:hover { color: var(--red); }
.ob-sel-empty { font-family: 'Inter',sans-serif; font-size: 13px; color: var(--muted); font-style: italic; }
.ob-free-note { font-family: 'Inter',sans-serif; font-size:13px; color: var(--muted); }
.ob-free-note strong { color: var(--accent); }
.ob-cta-group { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ob-skip { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; min-height: 44px; color: var(--muted); padding: 8px 16px; transition: color .15s; }
.ob-skip:hover { color: var(--text); }
.ob-done {
  background: var(--accent); color:var(--cf-on-green);
  font-family: 'Barlow Condensed', sans-serif; font-weight:700; font-size: 18px; border-radius: 8px; min-height: 44px;
  letter-spacing: .05em; text-transform: uppercase; padding: 10px 28px;
  transition: background .15s;
}
.ob-done:hover { background: var(--accent-hover); }
.ob-done:disabled { opacity: .4; cursor: not-allowed; }

@media(max-width: 600px) {
  .ob-header, .ob-controls, .ob-grid-wrap, .ob-footer { padding-left: 16px; padding-right: 16px; }
  .ob-headline { font-size: 24px; }
  .ob-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}
`

export default function Onboarding({ onDone }) {
  const { user, pro } = useAuth()
  const { completeOnboarding, followedTeams, loading } = useTeams()
  // Pre-select the teams the user already follows so editing starts from their
  // current set (they actively unselect to remove). Captures synchronously if
  // follows are already loaded; the effect below seeds them once they arrive.
  const [selected, setSelected] = useState(() => new Set(Object.keys(followedTeams || {})))
  const [query, setQuery]       = useState('')
  const [gFilter, setGFilter]   = useState('all')
  const [dFilter, setDFilter]   = useState('all')
  const [saving, setSaving]     = useState(false)
  const seeded = useRef(Object.keys(followedTeams || {}).length > 0)

  // Seed from followed teams once they finish loading (handles the async case
  // where the user's follows aren't available on first render).
  useEffect(() => {
    if (seeded.current || loading) return
    const ids = Object.keys(followedTeams || {})
    if (ids.length === 0) return
    seeded.current = true
    setSelected(prev => (prev.size > 0 ? prev : new Set(ids)))
  }, [loading, followedTeams])

  const FREE_LIMIT = 2
  const atLimit    = !pro && selected.size >= FREE_LIMIT

  const results = useMemo(() => searchPrograms(query, {
    gender: gFilter === 'all' ? undefined : gFilter,
    div:    dFilter === 'all' ? undefined : dFilter,
  }), [query, gFilter, dFilter])

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); return next }
      if (atLimit) return prev  // can't add more on free
      next.add(id)
      return next
    })
  }

  const handleDone = async () => {
    setSaving(true)
    await completeOnboarding([...selected])
    onDone()
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ob-root">

        {/* header */}
        <div className="ob-header">
          <div className="ob-logo">CREASE<em>FEED</em></div>
          <div className="ob-headline">Which teams do you follow?</div>
          <div className="ob-sub">
            Pick your teams and we'll build your personal feed.
            {!pro && <> <strong>Free accounts follow up to 2 teams.</strong> Upgrade for unlimited.</>}
          </div>
        </div>

        {/* search + filters */}
        <div className="ob-controls">
          <input
            className="ob-search"
            placeholder="Search teams, conferences, states..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <div className="ob-filter-group">
            {GENDER_OPTS.map(o => (
              <button key={o.v} className={`ob-filter-btn ${gFilter === o.v ? 'on' : ''}`} onClick={() => setGFilter(o.v)}>{o.l}</button>
            ))}
          </div>
          <div className="ob-filter-group">
            {DIV_OPTS.map(o => (
              <button key={o.v} className={`ob-filter-btn ${dFilter === o.v ? 'on' : ''}`} onClick={() => setDFilter(o.v)}>{o.l}</button>
            ))}
          </div>
          <div className="ob-count">{results.length} programs</div>
        </div>

        {/* team grid */}
        <div className="ob-grid-wrap">
          {atLimit && (
            <div style={{
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              padding: '10px 16px', marginBottom: 16, fontFamily: "'Inter',sans-serif",
              fontSize: 13, color: 'var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>You've reached the free limit of 2 teams.</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>
                Upgrade to Pro for unlimited →
              </span>
            </div>
          )}

          <div className="ob-grid">
            {results.map(p => {
              const isSel = selected.has(p.id)
              const isW   = p.gender === 'W'
              const locked = atLimit && !isSel
              return (
                <div
                  key={p.id}
                  className={`ob-team-card ${isSel ? 'selected' : ''} ${isSel && isW ? 'w' : ''}`}
                  onClick={() => !locked && toggle(p.id)}
                  style={locked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  {isSel && <div className={`ob-check ${isW ? 'w' : ''}`}>✓</div>}
                  <div className="ob-team-name">{p.name}</div>
                  <div className="ob-team-meta">{p.conf}</div>
                  <div className="ob-team-badges">
                    <span className="ob-badge ob-badge-div">D{p.div}</span>
                    <span className={`ob-badge ${isW ? 'ob-badge-w' : 'ob-badge-m'}`}>{isW ? "W" : "M"}</span>
                    <span className="ob-badge ob-badge-div">{p.state}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* footer */}
        <div className="ob-footer">
          <div className="ob-selected-preview">
            {selected.size === 0
              ? <div className="ob-sel-empty">No teams selected yet — pick the ones you follow</div>
              : [...selected].map(id => {
                  const p = getProgramById(id)
                  const isW = p?.gender === 'W'
                  return (
                    <div key={id} className="ob-sel-tag">
                      <span style={{ color: isW ? 'var(--women)' : 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
                        {isW ? 'W' : 'M'} D{p?.div}
                      </span>
                      {p?.short || p?.name || id}
                      <span className="ob-sel-remove" onClick={() => toggle(id)}>×</span>
                    </div>
                  )
                })
            }
          </div>
          <div className="ob-cta-group">
            {!pro && selected.size > 0 && (
              <div className="ob-free-note">
                <strong>{selected.size}/{FREE_LIMIT}</strong> free teams used
              </div>
            )}
            <button className="ob-skip" onClick={onDone}>Skip for now</button>
            <button className="ob-done" onClick={handleDone} disabled={saving}>
              {saving ? 'Saving...' : selected.size === 0 ? 'Skip →' : `Follow ${selected.size} Team${selected.size > 1 ? 's' : ''} →`}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
