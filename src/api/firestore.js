// ============================================================================
// src/api/firestore.js
//
// PRIMARY DATA SOURCE — reads from Firestore collections populated by
// Cloud Functions scrapers (box scores from school sites + polls).
//
// Uses onSnapshot() for real-time updates — when the scraper writes a new
// goal to Firestore, the UI updates instantly with no polling needed.
//
// Falls back to ESPN API if Firestore has no data for the requested date.
//
// ✅ TO SWAP TO A PAID API PROVIDER:
//   Create src/api/sportradar.js with the same exported functions,
//   then change the import in src/hooks/useScores.jsx — one line.
// ============================================================================

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { canonTeam, seoKey } from '../data/programs.js'

// The season the site displays. aggregateRecords publishes this to
// /config/site every run, resolved from the season that actually has games, so
// the rollover to 2027 needs no redeploy. The literal is only a first-paint
// fallback for the moment before the config doc loads.
let SEASON = '2026'
export const getSeason = () => SEASON

let seasonReady = null
export function initSeason() {
  if (seasonReady) return seasonReady
  seasonReady = getDoc(doc(db, 'config', 'site'))
    .then(snap => {
      const s = snap.exists() ? snap.data().season : null
      if (s) SEASON = String(s)
      return SEASON
    })
    .catch(err => {
      console.warn('[CreaseFeed] season config unavailable, using', SEASON, err.message)
      return SEASON
    })
  return seasonReady
}

// Kick this off at import time so the real season is usually resolved before
// the first query fires.
initSeason()

// ── Canonical game docs ───────────────────────────────────────────────────────
// /games holds two eras: current `ncaa-*` docs from the NCAA API, and orphaned
// `m-*` / `w-*` docs from the retired Sidearm scraper (_source
// 'sidearm-boxscore-header'). The two are cleanly separated by doc-ID prefix.
//
// 280 Sidearm docs carry a gameDate, so they match the date-filtered queries
// below and surface in Scores, Schedule, the ticker and team pages. 169 of them
// have placeholder team names ("Home" / "Away") -- the source of ticker
// artifacts like "AWAY · LEHIGH" (Lehigh alone appears 19 times). Only 6
// duplicate a real game; the other 274 are phantom fixtures that never map to
// anything.
//
// Filtered client-side on purpose: an equality filter on _source would need a
// new composite index on every one of these query shapes, and the volume here
// is trivial.
const isCanonicalGame = (d) => d.id.startsWith('ncaa-')

// ── Subscribe to live scoreboard (real-time) ──────────────────────────────────
// Returns an unsubscribe function — call it on component unmount
// date param is YYYYMMDD string (e.g. "20260402"), div is "1"/"2"/"3"
export function subscribeToScoreboard(gender, onData, onError, date, div) {
  // Build query — filter by gameDate + division when provided
  const constraints = [
    where('gender', '==', gender),
    where('season', '==', SEASON),
  ]
  if (date) {
    constraints.push(where('gameDate', '==', date))
  }
  if (div) {
    constraints.push(where('div', '==', div))
  }
  constraints.push(orderBy('updatedAt', 'desc'))
  constraints.push(limit(200))

  const q = query(collection(db, 'games'), ...constraints)

  return onSnapshot(q,
    (snap) => {
      const games = snap.docs.filter(isCanonicalGame).map(d => ({ id: d.id, ...d.data() }))
      if (games.length > 0) {
        onData(games)
        console.info(`[CreaseFeed] ✓ Firestore — ${games.length} games (${gender}) real-time${date ? ` for ${date}` : ''}`)
      } else {
        onData([])
      }
    },
    (err) => {
      console.warn('[CreaseFeed] Firestore scoreboard error:', err.message)
      onError?.(err)
    }
  )
}

// ── Fetch scoreboard once (for non-real-time use) ─────────────────────────────
export async function fetchScoreboard(gender, date, div) {
  try {
    const constraints = [
      where('gender', '==', gender),
      where('season', '==', SEASON),
    ]
    if (date) {
      constraints.push(where('gameDate', '==', date))
    }
    if (div) {
      constraints.push(where('div', '==', div))
    }
    constraints.push(orderBy('updatedAt', 'desc'))
    constraints.push(limit(200))

    const q = query(collection(db, 'games'), ...constraints)
    const snap = await getDocs(q)
    return snap.docs.filter(isCanonicalGame).map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('[CreaseFeed] Firestore fetchScoreboard failed:', err.message)
    return []
  }
}

// ── Fetch aggregated team records (W-L) for one gender ────────────────────────
// Reads /records/{M|W} (written by the aggregateRecords Cloud Function) and
// returns a lookup keyed by normalized team name + "seo:<slug>" so the Teams
// page can match a program to its record in O(1).
export async function fetchTeamRecords(gender) {
  try {
    const snap = await getDoc(doc(db, 'records', gender))
    if (!snap.exists()) return {}
    const data = snap.data()
    // Index each record under every key a program might match on. See the
    // "Record matching" block in programs.js for why the extra folds exist.
    const map = {}
    for (const t of (data.teams || [])) {
      if (t.nameKey) map[t.nameKey] = t
      if (t.seo) {
        map['seo:' + String(t.seo).toLowerCase()] = t
        map['sk:' + seoKey(t.seo)] = t
      }
      if (t.name) map['c:' + canonTeam(t.name)] = t
    }
    return map
  } catch (err) {
    console.warn('[CreaseFeed] fetchTeamRecords failed:', err.message)
    return {}
  }
}

// ── Poll IDs per gender + division ───────────────────────────────────────────
// These must match what functions/src/scrapers/polls.js writes. USILA covers
// men only (its D1 doc keeps the legacy `imlca` id); USA Lacrosse Magazine
// covers both genders. There is no automated women's coaches poll (IWLCA's site
// can't be scraped) and Inside Lacrosse is not carried.
export function pollIdsFor(gender, division = '1') {
  return gender === 'M'
    ? [division === '1' ? 'imlca' : `usila-m-d${division}`, `usal-m-d${division}`]
    : [`usal-w-d${division}`]
}

// ── Fetch the Scores sidebar poll ────────────────────────────────────────────
// Prefers USA Lacrosse because it carries W-L records; falls back to USILA.
// One retry: a failed read used to leave the poll card stuck on its empty
// state on flaky mobile connections.
export async function fetchStandings(gender, division = '1') {
  const first = await fetchStandingsOnce(gender, division)
  return first === undefined ? ((await fetchStandingsOnce(gender, division)) ?? null) : first
}

async function fetchStandingsOnce(gender, division) {
  try {
    const ids = [...pollIdsFor(gender, division)].reverse()
    for (const id of ids) {
      const snap = await getDoc(doc(db, 'polls', id))
      if (!snap.exists() || !(snap.data().entries || []).length) continue
      const data = snap.data()
      return {
        source:    data.source || '',
        weekLabel: data.weekLabel || '',
        rows: data.entries.map(e => ({
          rank:     e.rank,
          team:     e.team,
          w:        e.record ? e.record.split('-')[0].trim() : '—',
          l:        e.record ? e.record.split('-')[1]?.trim() || '—' : '—',
          movement: e.movement || 0,
        })),
      }
    }
    return null
  } catch (err) {
    console.warn('[CreaseFeed] Firestore fetchStandings failed:', err.message)
    return undefined
  }
}

// ── Fetch NCAA RPI rankings ───────────────────────────────────────────────────
export async function fetchRPI(gender, division = '1') {
  try {
    const pollId = `rpi-${gender.toLowerCase()}-d${division}`
    const snap   = await getDoc(doc(db, 'rpi', pollId))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      ...data,
      updatedAt: data.fetchedAt
        ? new Date(data.fetchedAt).toLocaleDateString()
        : '—',
    }
  } catch (err) {
    console.warn('[CreaseFeed] fetchRPI failed:', err.message)
    return null
  }
}

// ── Fetch all polls for Rankings page ────────────────────────────────────────
export async function fetchAllPolls(gender, division = '1') {
  try {
    const [polls, rpi] = await Promise.all([
      Promise.all(
        pollIdsFor(gender, division).map(async (id) => {
          const snap = await getDoc(doc(db, 'polls', id))
          return snap.exists() ? { pollId: id, ...snap.data() } : null
        })
      ),
      fetchRPI(gender, division),
    ])

    return {
      coachesPolls: polls.filter(Boolean),
      rpi: rpi || null,
    }
  } catch (err) {
    console.warn('[CreaseFeed] fetchAllPolls failed:', err.message)
    return { coachesPolls: [], rpi: null }
  }
}

// Normalize the NCAA position code for display. The feed is inconsistent —
// 'a', 'A', 'm', 'gk', 'g', 'Goalkeeper', '*' and '' all appear — so map the
// known codes and fall back to a dash rather than surfacing raw junk.
// The feed uses two vocabularies for the same thing, sometimes within one team's
// season: single letters ('a'/'A', 'm', 'd') and full words ('Attacker',
// 'Midfielder', 'Defender', 'Goalkeeper'). The full words were missing here, so
// 187 of 373 non-blank values in a two-team sample still rendered as '—'.
// '*' is the feed's own placeholder and correctly falls through to '—'.
const POS_MAP = {
  a: 'ATT', att: 'ATT', attack: 'ATT', attacker: 'ATT',
  m: 'MID', mid: 'MID', midfield: 'MID', mf: 'MID', midfielder: 'MID',
  d: 'DEF', def: 'DEF', defense: 'DEF', defender: 'DEF',
  g: 'GK', gk: 'GK', goalie: 'GK', goalkeeper: 'GK',
  fo: 'FO', faceoff: 'FO', lsm: 'LSM', ssdm: 'SSDM',
}
function normPos(raw) {
  const key = String(raw || '').trim().toLowerCase()
  return POS_MAP[key] || '—'
}

// ── Fetch stat leaders from aggregated playerStats ────────────────────────────
export async function fetchStatLeaders(gender, stat = 'goals', division = '1') {
  try {
    // Goalies and face-offs are NOT read from here -- see fetchOfficialBoard.
    const orderField =
      stat === 'assists' ? 'assists' :
      stat === 'draws'   ? 'drawControls' : 'goals'
    const q = query(
      collection(db, 'playerStats'),
      where('gender', '==', gender),
      where('season', '==', SEASON),
      where('div',    '==', String(division)),
      orderBy(orderField, 'desc'),
      limit(25)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null

    return snap.docs.map((d, i) => {
      const r = d.data()
      return {
        rank:   i + 1,
        name:   r.name,
        team:    r.teamName || r.team || '—',
        teamSeo: r.teamSeo  || '',
        pos:    normPos(r.position || r.pos),
        gp:     r.gp  || 0,
        g:      r.goals   || 0,
        a:      r.assists || 0,
        pts:    r.points  || 0,
        gpg:    r.gp ? (r.goals / r.gp).toFixed(1) : '—',
        apg:    r.gp ? (r.assists / r.gp).toFixed(1) : '—',
        // Draw controls: the women's possession stat, and the only face-off
        // equivalent the NCAA box score carries. Men's docs are all 0 here.
        dc:     r.drawControls || 0,
        dcpg:   r.gp ? ((r.drawControls || 0) / r.gp).toFixed(1) : '—',
        _source: 'firestore',
      }
    })
  } catch (err) {
    console.warn('[CreaseFeed] fetchStatLeaders failed:', err.message)
    return null
  }
}

// ── Fetch an official NCAA leaderboard (goalies, face-offs) ──────────────────
// One doc per board, written nightly by functions/src/scrapers/ncaaLeaderboards.js
// from ncaa.com's official stat lists -- not aggregated from box scores, which
// carry no usable per-player goalie lines and no face-offs at all.
// Returns { rows, throughDate } or null.
const fmtPct = (v) => v == null ? '—' : v.toFixed(3).replace(/^0\./, '.')
const fmtOr  = (v, d) => v == null ? '—' : (d == null ? v : v.toFixed(d))

export async function fetchOfficialBoard(gender, stat, division = '1') {
  try {
    const snap = await getDoc(doc(db, 'leaderboards', `${SEASON}-${gender}-d${division}-${stat}`))
    if (!snap.exists()) return null
    const b = snap.data()
    const rows = (b.rows || []).map(r => ({
      rank: r.rank, name: r.name, team: r.team || '—', teamSeo: r.teamSeo || '',
      cl: r.cl || '—', pos: normPos(r.pos), gp: fmtOr(r.gp),
      // goalies -- minutes are real minutes here, unlike playerStats.goalieMinutes
      min: fmtOr(r.min), sv: fmtOr(r.sv), ga: fmtOr(r.ga),
      svpct: fmtPct(r.svpct), gaa: fmtOr(r.gaa, 2),
      // face-offs
      fow: fmtOr(r.fow), fol: fmtOr(r.fol), fot: fmtOr(r.fot),
      fopct: fmtPct(r.fopct),
    }))
    return { rows, throughDate: b.throughDate || null }
  } catch (err) {
    console.warn('[CreaseFeed] fetchOfficialBoard failed:', err.message)
    return null
  }
}

// ── Fetch full game detail (plays, quarter scores, team stats) ─────────────────
export async function fetchGameDetail(gameId, gender) {
  try {
    const snap = await getDoc(doc(db, 'games', gameId))
    if (!snap.exists()) return null
    return { ...snap.data(), _source: 'firestore' }
  } catch (err) {
    console.warn('[CreaseFeed] fetchGameDetail failed:', err.message)
    return null
  }
}

// ── Date helpers for windowed game queries ───────────────────────────────────
export const toYmd = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

// YYYYMMDD strings for each day from `from` to `to` days relative to `base`.
export function dayRange(base, from, to) {
  const out = []
  for (let i = from; i <= to; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)
    out.push(toYmd(d))
  }
  return out
}

const gamesInDates = (gender, div, dates) => query(
  collection(db, 'games'),
  where('gender', '==', gender),
  where('season', '==', SEASON),
  where('gameDate', 'in', dates),
  where('div', '==', String(div)),
  orderBy('updatedAt', 'desc'),
  limit(200),
)

// ── Subscribe to one gender + division over a short list of dates ─────────────
// `in` on gameDate is index-equivalent to equality, so this rides the existing
// (gender, season, gameDate, div, updatedAt) composite index. Max 30 dates.
export function subscribeToGameWindow(gender, div, dates, onData, onError) {
  return onSnapshot(gamesInDates(gender, div, dates.slice(0, 30)),
    (snap) => onData(snap.docs.filter(isCanonicalGame).map(d => ({ id: d.id, ...d.data() }))),
    (err) => { console.warn('[CreaseFeed] game window error:', err.message); onError?.(err) },
  )
}

// ── 30-day chunks of a division's games, newest first (memoized) ─────────────
// Game docs carry full box scores, so these reads are kept to 30-day windows
// and cached for the session rather than pulling the whole season.
const chunkCache = new Map()
function fetchChunk(gender, div, endDate) {
  const key = `${SEASON}|${gender}|${div}|${toYmd(endDate)}`
  if (!chunkCache.has(key)) {
    chunkCache.set(key, getDocs(gamesInDates(gender, div, dayRange(endDate, -29, 0)))
      .then(snap => snap.docs.filter(isCanonicalGame).map(d => ({ id: d.id, ...d.data() })))
      .catch(err => { chunkCache.delete(key); throw err }))
  }
  return chunkCache.get(key)
}

const byNewest = (a, b) =>
  (b.gameDate + (b.startTimeEpoch || '')).localeCompare(a.gameDate + (a.startTimeEpoch || ''))

// Walks back from today (capped at June 30 of the data season) one 30-day
// chunk at a time, calling `pick(finals)` until it returns something.
async function walkFinals(gender, div, pick) {
  await initSeason()
  const now = new Date()
  const seasonEnd = new Date(Number(SEASON), 5, 30)
  const seasonStart = new Date(Number(SEASON), 0, 1)
  let cursor = now < seasonEnd ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : seasonEnd
  for (let i = 0; i < 7 && cursor >= seasonStart; i++) {
    const finals = (await fetchChunk(gender, div, cursor)).filter(g => g.status === 'final').sort(byNewest)
    const hit = pick(finals)
    if (hit) return hit
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 30)
  }
  return null
}

// ── Most recent final game for one gender + division (null if none) ───────────
export async function fetchLastFinal(gender, div) {
  try {
    return await walkFinals(gender, div, finals => finals[0] || null)
  } catch (err) {
    console.warn('[CreaseFeed] fetchLastFinal failed:', err.message)
    return null
  }
}

// ── One game doc by id (canonical docs only) ──────────────────────────────────
export async function fetchGameById(id) {
  if (!id || !String(id).startsWith('ncaa-')) return null
  try {
    const snap = await getDoc(doc(db, 'games', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    console.warn('[CreaseFeed] fetchGameById failed:', err.message)
    return null
  }
}

// ── Most recent final + next scheduled game for one team ──────────────────────
// For the My Feed preview. `seo` is the NCAA team slug on game docs.
// `match` is either the team's seo slug or a predicate over a game side.
export async function fetchTeamGames(gender, div, match) {
  if (!match) return { last: null, next: null }
  const isTeam = typeof match === 'function' ? match : (t) => t?.teamSeo === match
  const hasTeam = (g) => isTeam(g.away) || isTeam(g.home)
  try {
    const last = await walkFinals(gender, div, finals => finals.find(hasTeam) || null)
    const today = new Date()
    const upcoming = await fetchChunk(gender, div, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 29))
    const todayYmd = toYmd(today)
    const next = upcoming
      .filter(g => g.status !== 'final' && g.gameDate >= todayYmd && hasTeam(g))
      .sort((a, b) => byNewest(b, a))[0] || null
    return { last, next }
  } catch (err) {
    console.warn('[CreaseFeed] fetchTeamGames failed:', err.message)
    return { last: null, next: null }
  }
}

// ── One team's games for the data season ─────────────────────────────────────
// Two equality-only queries (home side, away side). Equality filters merge
// existing single-field indexes, so no new composite index is needed.
export async function fetchTeamSeason(gender, seo) {
  if (!seo) return []
  await initSeason()
  const side = (field) => getDocs(query(collection(db, 'games'),
    where('gender', '==', gender), where('season', '==', SEASON), where(`${field}.teamSeo`, '==', seo)))
  try {
    const [home, away] = await Promise.all([side('home'), side('away')])
    const seen = new Set()
    const games = []
    for (const [snap, isHome] of [[home, true], [away, false]]) {
      for (const d of snap.docs) {
        if (!isCanonicalGame(d) || seen.has(d.id)) continue
        seen.add(d.id)
        const g = d.data()
        const ymd = g.gameDate || ''
        games.push({ id: d.id, ...g, isHome, date: ymd.length === 8 ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : null })
      }
    }
    return games.sort((a, b) => (a.gameDate + (a.startTimeEpoch || '')).localeCompare(b.gameDate + (b.startTimeEpoch || '')))
  } catch (err) {
    console.warn('[CreaseFeed] fetchTeamSeason failed:', err.message)
    throw err
  }
}
