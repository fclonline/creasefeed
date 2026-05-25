import { useState, useMemo, useEffect } from 'react'
import { PROGRAMS, getConferences, searchPrograms, normTeam } from '../data/programs.js'
import { useTeams } from '../hooks/useTeams.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { fetchTeamRecords } from '../api/firestore.js'
import { CollapsibleFilter, chip, ac } from '../components/shared.jsx'

export default function TeamsPage({ gender, division, isW, onAuthClick, onSelectTeam }) {
  const { user } = useAuth()
  const { followTeam, unfollowTeam, isFollowing } = useTeams()
  const [query, setQuery]       = useState('')
  const [gFilter, setGFilter]   = useState('All')
  const [dFilter, setDFilter]   = useState('all')
  const [confFilter, setConfFilter] = useState('All')
  const [expanded, setExpanded] = useState({})
  const [records, setRecords] = useState({ M: {}, W: {} })
  const ac_ = chip(isW)

  // Load aggregated W-L records for both genders once (written nightly by the
  // aggregateRecords Cloud Function to /records/{M|W}).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [m, w] = await Promise.all([fetchTeamRecords('M'), fetchTeamRecords('W')])
      if (!cancelled) setRecords({ M: m, W: w })
    })()
    return () => { cancelled = true }
  }, [])

  // Look up a program's record by normalized name, falling back to its id slug.
  // NOTE: women's records are temporarily withheld — the women's `games`
  // collection has duplicate/fragmented docs (backfill dupes + mixed NCAA/
  // Sidearm sources) that produce wrong totals. Men's data is clean and
  // verified, so we show it now and re-enable women's once the data is cleaned.
  const lookupRecord = (p) => {
    if (p.gender !== 'M') return null
    const rec = records[p.gender]?.[normTeam(p.name)]
      || records[p.gender]?.['seo:' + p.id.replace(/^[mw]-/, '')]
      || null
    if (!rec) return null
    // Guard against any residual duplicate inflation (a season is ~25 games max).
    if ((rec.w + rec.l) > 28) return null
    return rec
  }

  // Conferences are collapsed by default (browsing), but auto-expand when the
  // user is searching or has narrowed to one conference so results stay visible.
  const autoOpen = query.trim() !== '' || confFilter !== 'All'
  const toggleConf = (conf) => setExpanded(p => ({ ...p, [conf]: !(p[conf] ?? autoOpen) }))

  // Derive conferences from selected gender + division
  const confs = useMemo(() => getConferences(
    gFilter === 'All' ? undefined : gFilter,
    dFilter === 'all' ? undefined : dFilter
  ), [gFilter, dFilter])

  // Reset conf filter when gender/div changes if current conf isn't in new list
  useMemo(() => {
    if (!confs.includes(confFilter)) setConfFilter('All')
  }, [confs, confFilter])

  // Filter programs
  const programs = useMemo(() => {
    let results = searchPrograms(query, {
      gender: gFilter === 'All' ? undefined : gFilter,
      div:    dFilter === 'all' ? undefined : dFilter,
    })
    if (confFilter !== 'All') {
      results = results.filter(p => p.conf === confFilter)
    }
    return results
  }, [query, gFilter, dFilter, confFilter])

  // Group by conference for display
  const grouped = useMemo(() => {
    const map = {}
    programs.forEach(p => {
      if (!map[p.conf]) map[p.conf] = []
      map[p.conf].push(p)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [programs])

  const handleFollow = async (programId) => {
    if (!user) { onAuthClick('signin'); return }
    if (isFollowing(programId)) {
      await unfollowTeam(programId)
    } else {
      const result = await followTeam(programId)
      if (result?.error === 'pro') onAuthClick('pro')
    }
  }

  return (
    <div className="teams-page">
      {/* search + filters */}
      <div className="teams-controls">
        <input
          className="teams-search"
          placeholder="Search teams, conferences, states..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="teams-filter-group">
          {[{ v: 'All', l: 'All' }, { v: 'M', l: "Men's" }, { v: 'W', l: "Women's" }].map(o => (
            <button key={o.v} className={`filter-chip ${gFilter === o.v ? ac_ : ''}`} onClick={() => setGFilter(o.v)}>{o.l}</button>
          ))}
        </div>
        <div className="teams-filter-group">
          {[{ v: 'all', l: 'All Divs' }, { v: '1', l: 'D1' }, { v: '2', l: 'D2' }, { v: '3', l: 'D3' }].map(o => (
            <button key={o.v} className={`filter-chip ${dFilter === o.v ? ac_ : ''}`} onClick={() => setDFilter(o.v)}>{o.l}</button>
          ))}
        </div>
        <div className="teams-count">{programs.length} programs</div>
      </div>

      {/* conference chips */}
      {confs.length > 2 && (
        <div className="filter-row" style={{ paddingTop: 0 }}>
          <CollapsibleFilter
            label="Conference"
            options={confs.map(c => ({ value: c, label: c }))}
            value={confFilter} onChange={setConfFilter} isW={isW}
          />
        </div>
      )}

      {/* teams table grouped by conference (collapsible accordion) */}
      {grouped.map(([conf, teams]) => {
        const open = expanded[conf] ?? autoOpen
        return (
        <div key={conf} className="teams-conf-group">
          <button type="button" className="teams-conf-header" onClick={() => toggleConf(conf)} aria-expanded={open}>
            <span className={`teams-conf-caret ${open ? 'open' : ''}`} aria-hidden="true">▸</span>
            <span className="teams-conf-name">{conf}</span>
            <span className="teams-conf-count">{teams.length} teams</span>
          </button>
          {open && (
          <table className="teams-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Division</th>
                <th>Record</th>
                <th>State</th>
                {user && <th>Follow</th>}
              </tr>
            </thead>
            <tbody>
              {teams.map(p => {
                const pIsW = p.gender === 'W'
                const followed = isFollowing(p.id)
                const rec = lookupRecord(p)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="teams-name teams-name-link" onClick={() => onSelectTeam?.(p.id)}>{p.name}</div>
                    </td>
                    <td><span className="teams-div-badge">D{p.div}</span></td>
                    <td>
                      <span className="teams-record" style={{ color: rec ? 'var(--text)' : 'var(--muted)' }}>
                        {rec ? `${rec.w}-${rec.l}` : '—'}
                      </span>
                    </td>
                    <td><span className="teams-state">{p.state}</span></td>
                    {user && (
                      <td>
                        <button
                          className={`teams-follow-btn ${followed ? 'following' : ''} ${pIsW ? 'w' : ''}`}
                          onClick={() => handleFollow(p.id)}
                        >
                          {followed ? '✓ Following' : '+ Follow'}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>
        )
      })}

      {programs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontFamily: "'Barlow Condensed'", fontSize: 16 }}>
          No programs match your filters.
        </div>
      )}
    </div>
  )
}
