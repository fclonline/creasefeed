// ============================================================================
// src/pages/OffseasonHome.jsx — the Scores view when the selected gender +
// division is in the off-season. Layout: docs/mockups/Main.dc.html
// Every number here comes from Firestore; anything missing is hidden.
// ============================================================================
import { useState } from 'react'
import { useLastFinal } from '../hooks/useSeasonState.jsx'
import { useTeamMeta } from '../hooks/useTeamMeta.jsx'
import { useTeams } from '../hooks/useTeams.jsx'
import { GameModal } from '../components/shared.jsx'
import PollCard from '../components/PollCard.jsx'
import TeamChip from '../components/TeamChip.jsx'
import { SEASON_YEAR, daysUntilSeason, seasonStartLabel } from '../config/season.js'
import { LIVE_PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL, FOLLOW_LIMIT_NOTE, SAVE_FOLLOWS_NOTE, FREE_FOLLOW_LIMIT } from '../config/pro.js'
import { programIdForSeo } from '../data/teamColors.js'
import { PROGRAMS, canonTeam } from '../data/programs.js'

const fmtGameDate = (ymd) => {
  if (!ymd) return ''
  const d = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Program for a poll row ("Penn State") within a gender + division.
function programForName(name, gender, division) {
  const key = canonTeam(name)
  return PROGRAMS.find(p => p.gender === gender && p.div === String(division) && (canonTeam(p.name) === key || canonTeam(p.short) === key)) || null
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="seg">
      {options.map(o => (
        <button key={o.value} type="button" className={`seg-btn ${value === o.value ? 'on' : ''}`}
          aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

function LastFinalCard({ game, isChampionship, gender, division, meta, onBoxScore, onFollow, isFollowing }) {
  if (!game) return null
  const rows = [game.away, game.home]
  const winner = (game.home?.score ?? 0) >= (game.away?.score ?? 0) ? game.home : game.away
  const winnerId = programIdForSeo(gender, winner?.teamSeo) || programForName(winner?.name, gender, division)?.id || null
  // Only offer Box score when the modal can actually render one (per-team player tables).
  const hasBox = Array.isArray(game.playerStats) && game.playerStats.some(t => Array.isArray(t?.players) && t.players.length > 0)
  const quarters = Array.isArray(game.linescores) ? game.linescores : null // not on game docs yet → columns omitted
  const title = isChampionship ? `${game.season} NCAA Championship` : 'Last final'
  return (
    <section className="oh-card">
      <div className="oh-card-hd">
        <h2>{title}</h2>
        <span className="oh-meta">{fmtGameDate(game.gameDate)}</span>
      </div>
      <div className="oh-final">
        <div className={`oh-final-row hd ${quarters ? 'has-q' : ''}`}>
          <span className="oh-final-badge">FINAL</span>
          <span className="oh-t">T</span>
        </div>
        {rows.map((t, i) => {
          const won = t === winner
          const rank = meta.rankFor(t)
          const rec = meta.recordFor(t)
          return (
            <div key={i} className={`oh-final-row ${won ? 'won' : ''}`}>
              <span className="oh-team">
                <TeamChip seo={t.teamSeo} name={t.name} size={36} />
                {rank && <span className="oh-rank">{rank}</span>}
                <span className="oh-name">{t.name}</span>
                {rec && <span className="oh-rec">{rec}</span>}
              </span>
              <span className="oh-score">{t.score}</span>
            </div>
          )
        })}
        <div className="oh-actions">
          {hasBox && <button type="button" className="btn-outline" onClick={onBoxScore}>Box score</button>}
          {winnerId && (
            <button type="button" className="btn-outline" aria-pressed={isFollowing(winnerId)} onClick={() => onFollow(winnerId)}>
              {isFollowing(winnerId) ? `Following ${winner.name} ✓` : `Follow ${winner.name}`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default function OffseasonHome({ gender, setGender, division, setDivision, setPage, onAuthClick }) {
  const { game, isChampionship } = useLastFinal(gender, division)
  const meta = useTeamMeta(gender, division)
  const { isFollowing, toggleFollow } = useTeams()
  const [modal, setModal] = useState(null) // null | 'summary' | 'box score'
  const days = daysUntilSeason()
  const opens = seasonStartLabel()

  const follow = async (programId) => {
    const r = await toggleFollow(programId)
    if (r?.error === 'pro') onAuthClick('pro', FOLLOW_LIMIT_NOTE)
    else if (r?.error === 'signup' || r?.needsAccount) onAuthClick('signin', SAVE_FOLLOWS_NOTE)
  }

  const chipTeams = meta.standings.slice(0, 5)
    .map(s => ({ s, prog: programForName(s.team, gender, division) }))
    .filter(x => x.prog)

  return (
    <div className="oh-page">
      <section className="oh-hero">
        <div className="oh-hero-copy">
          <span className="oh-kicker">{SEASON_YEAR} season</span>
          <h1>Follow every team you care about — D1 to D3, men's and women's — in one feed.</h1>
          <p>Pick your teams now. When the season starts, their scores, standings and polls land in one place.</p>
          <div className="oh-hero-btns">
            <button type="button" className="btn-green" onClick={() => setPage('feed')}>Pick your teams</button>
            {game && <button type="button" className="btn-ghost" onClick={() => setModal('summary')}>See last season's final</button>}
          </div>
        </div>
        {days !== null && (
          <div className="oh-countdown">
            <span className="oh-cd-label">Opening day in</span>
            <span className="oh-cd-num">{days}</span>
            <span className="oh-cd-unit">{days === 1 ? 'day' : 'days'}</span>
            {opens && <span className="oh-cd-label">{opens}</span>}
          </div>
        )}
      </section>

      <div className="oh-toggles">
        <Segmented label="Gender" value={gender} onChange={setGender}
          options={[{ value: 'M', label: "Men's" }, { value: 'W', label: "Women's" }]} />
        <Segmented label="Division" value={division} onChange={setDivision}
          options={[{ value: '1', label: 'D1' }, { value: '2', label: 'D2' }, { value: '3', label: 'D3' }]} />
      </div>

      <div className="oh-grid">
        <LastFinalCard game={game} isChampionship={isChampionship} gender={gender} division={division} meta={meta}
          onBoxScore={() => setModal('box score')} onFollow={follow} isFollowing={isFollowing} />
        <PollCard gender={gender} division={division} limit={5} className="oh-poll"
          title={game?.season ? `Final ${game.season} poll` : 'Latest poll'} onFullPoll={() => setPage('polls')} />
      </div>

      <section className="oh-card oh-start">
        <div className="oh-start-hd">
          <div>
            <h2>Start your feed</h2>
            <p>Pick up to {FREE_FOLLOW_LIMIT} teams and save them with a free account.</p>
          </div>
          <button type="button" className="btn-green" onClick={() => setPage('feed')}>Build my feed</button>
        </div>
        <div className="oh-chips">
          {chipTeams.map(({ s, prog }) => {
            const on = isFollowing(prog.id)
            return (
              <button key={prog.id} type="button" className={`team-pill ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => follow(prog.id)}>
                <TeamChip programId={prog.id} name={s.team} size={32} round />
                {s.team}{on ? ' ✓' : ''}
              </button>
            )
          })}
          <button type="button" className="team-pill search" onClick={() => setPage('feed')}>+ Search any D1–D3 team</button>
        </div>
      </section>

      <section className="oh-plans">
        <div className="oh-plan">
          <h3>Free</h3>
          <p className="oh-price">$0</p>
          <ul>
            <li>Live scores and schedules</li>
            <li>Standings and weekly polls</li>
            <li>Follow up to {FREE_FOLLOW_LIMIT} teams</li>
          </ul>
          <button type="button" className="btn-outline" onClick={() => onAuthClick('signin')}>Create free account</button>
        </div>
        <div className="oh-plan pro">
          <h3>Pro</h3>
          <p className="oh-price">{PRO_PRICE_MONTHLY}<span> / month</span></p>
          <p className="oh-price-alt">or {PRO_PRICE_ANNUAL} / year — save 33%</p>
          <ul>
            <li>Everything in Free</li>
            {LIVE_PRO_FEATURES.map(f => <li key={f.label}>{f.label}</li>)}
          </ul>
          <button type="button" className="btn-ink" onClick={() => onAuthClick('pro')}>Go Pro</button>
        </div>
      </section>

      {modal && game && (
        <GameModal game={game} initialTab={modal} onClose={() => setModal(null)} isW={gender === 'W'} gender={gender} />
      )}
    </div>
  )
}
