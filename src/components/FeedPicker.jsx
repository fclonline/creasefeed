// ============================================================================
// src/components/FeedPicker.jsx — teams-first My Feed (docs/mockups/Feed.dc.html)
// Signed-out visitors pick teams with no account; picks persist in
// localStorage (cf_pending_follows) until "Save my feed — free" signs them in,
// at which point useTeams merges them into Firestore.
// ============================================================================
import { useEffect, useMemo, useState } from 'react'
import { useTeams } from '../hooks/useTeams.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { searchPrograms, canonTeam } from '../data/programs.js'
import { PROGRAM_SEO } from '../data/teamColors.js'
import { fetchTeamGames } from '../api/firestore.js'
import { seasonStartLabel } from '../config/season.js'
import { FOLLOW_LIMIT_NOTE } from '../config/pro.js'
import TeamChip from './TeamChip.jsx'
import { finalLine } from './shared.jsx'

const MAX_ROWS = 60

const fmtDate = (ymd) => {
  if (!ymd) return ''
  const d = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Chip({ on, onClick, children }) {
  return <button type="button" className={`pick-chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={onClick}>{children}</button>
}

// Each followed team's most recent final + next scheduled game, deduped across
// teams (two followed teams that played each other show one line).
function useFeedPreview(programs) {
  const ids = programs.map(p => p.id).join(',')
  const [state, setState] = useState({ loading: true, rows: [] })
  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    Promise.all(programs.map(async (program) => {
      const seo = PROGRAM_SEO[program.id]
      const key = canonTeam(program.name)
      const match = seo || ((t) => t?.name && canonTeam(t.name) === key)
      return { program, ...(await fetchTeamGames(program.gender, program.div, match)) }
    })).then(results => {
      if (cancelled) return
      const seen = new Set()
      const rows = []
      for (const { program, last, next } of results) {
        if (last && !seen.has(last.id)) { seen.add(last.id); rows.push({ kind: 'final', game: last }) }
        if (next && !seen.has(next.id)) { seen.add(next.id); rows.push({ kind: 'next', game: next, program }) }
        if (!last && !next) rows.push({ kind: 'none', program })
      }
      setState({ loading: false, rows })
    })
    return () => { cancelled = true }
  }, [ids])
  return state
}

function FeedPreview({ programs }) {
  const { loading, rows } = useFeedPreview(programs)
  const opens = seasonStartLabel()
  return (
    <section className="fp-preview" aria-live="polite" aria-busy={loading}>
      <h2>Your feed preview</h2>
      {loading ? programs.map(p => <div key={p.id} className="fp-prev-row"><span className="fp-prev-sk" /></div>)
        : rows.map((r, i) => {
          if (r.kind === 'final') {
            const f = finalLine(r.game)
            return (
              <div key={i} className="fp-prev-row">
                <span className="fp-prev-tag">FINAL</span>
                <span className="fp-prev-main"><strong>{f.winner} {f.wScore}</strong>, {f.loser} {f.lScore}</span>
                <span className="fp-prev-date">{fmtDate(r.game.gameDate)}</span>
              </div>
            )
          }
          if (r.kind === 'next') {
            return (
              <div key={i} className="fp-prev-row">
                <span className="fp-prev-tag">NEXT</span>
                <span className="fp-prev-main">{r.game.away?.name} @ {r.game.home?.name}</span>
                <span className="fp-prev-date">{fmtDate(r.game.gameDate)}</span>
              </div>
            )
          }
          return (
            <div key={i} className="fp-prev-row">
              <span className="fp-prev-tag">NEXT</span>
              <span className="fp-prev-main">{r.program.name}</span>
              <span className="fp-prev-date">{opens ? `Season starts ${opens}` : 'Schedule coming soon'}</span>
            </div>
          )
        })}
    </section>
  )
}

export default function FeedPicker({ gender: initialGender = 'M', division: initialDiv = '1', onAuthClick }) {
  const { user } = useAuth()
  const { isFollowing, toggleFollow, followedList } = useTeams()
  const [q, setQ] = useState('')
  const [gender, setGender] = useState(initialGender)
  const [div, setDiv] = useState(initialDiv)

  const results = useMemo(() => searchPrograms(q.trim(), { gender, div }), [q, gender, div])
  const shown = results.slice(0, MAX_ROWS)

  const follow = async (id) => {
    const r = await toggleFollow(id)
    if (r?.error === 'pro') onAuthClick('pro', FOLLOW_LIMIT_NOTE)
  }

  const n = followedList.length
  return (
    <div className={`fp ${!user ? 'has-bar' : ''}`}>
      <div className="fp-head">
        {!user && <span className="fp-step">Step 1 of 2 · No account needed</span>}
        <h1>Pick your teams</h1>
      </div>

      <label className="fp-search">Search D1–D3 teams
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder='Try "Duke" or "Tufts"' autoComplete="off" />
      </label>

      <div className="fp-chips" role="group" aria-label="Filter teams">
        <Chip on={gender === 'M'} onClick={() => setGender('M')}>Men's</Chip>
        <Chip on={gender === 'W'} onClick={() => setGender('W')}>Women's</Chip>
        <Chip on={div === '1'} onClick={() => setDiv('1')}>D1</Chip>
        <Chip on={div === '2'} onClick={() => setDiv('2')}>D2</Chip>
        <Chip on={div === '3'} onClick={() => setDiv('3')}>D3</Chip>
      </div>

      {shown.length === 0 ? (
        <div className="fp-empty">No teams match "{q}".</div>
      ) : (
        <ul className="fp-list">
          {shown.map(p => {
            const on = isFollowing(p.id)
            return (
              <li key={p.id} className="fp-row">
                <TeamChip programId={p.id} name={p.short || p.name} size={36} />
                <span className="fp-team">
                  <span className="fp-name">{p.name}</span>
                  <span className="fp-sub">{p.gender === 'M' ? "Men's" : "Women's"} D{p.div} · {p.conf}</span>
                </span>
                <button type="button" className={`fp-follow ${on ? 'on' : ''}`} aria-pressed={on}
                  aria-label={`${on ? 'Unfollow' : 'Follow'} ${p.name}`} onClick={() => follow(p.id)}>
                  {on ? 'Following ✓' : '+ Follow'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {results.length > MAX_ROWS && <div className="fp-more">Showing {MAX_ROWS} of {results.length}. Search to narrow it down.</div>}

      {n > 0 && (
        <FeedPreview programs={followedList} />
      )}

      {!user && (
        <div className="fp-bar">
          <span><strong>{n} {n === 1 ? 'team' : 'teams'}</strong> selected</span>
          <button type="button" className="btn-ink" onClick={() => onAuthClick('signin')}>Save my feed — free</button>
        </div>
      )}
    </div>
  )
}
