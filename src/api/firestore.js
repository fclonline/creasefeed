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

const SEASON = '2026'

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
      const games = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
    const games = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return games
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

// ── Fetch standings from polls collection ────────────────────────────────────
export async function fetchStandings(gender) {
  try {
    // Use IMLCA for men's, IWLCA for women's as primary coaches poll
    const pollId   = gender === 'M' ? 'imlca' : 'iwlca'
    const fallback = gender === 'M' ? 'inside-lacrosse-m' : 'inside-lacrosse-w'

    let snap = await getDoc(doc(db, 'polls', pollId))
    if (!snap.exists()) {
      snap = await getDoc(doc(db, 'polls', fallback))
    }
    if (!snap.exists()) return null

    const data = snap.data()
    return (data.entries || []).map(e => ({
      rank:   e.rank,
      team:   e.team,
      w:      e.record?.split('-')[0] || '—',
      l:      e.record?.split('-')[1] || '—',
      conf:   e.record || '—',
      streak: e.movement > 0 ? `▲${e.movement}` : e.movement < 0 ? `▼${Math.abs(e.movement)}` : '—',
      points: e.points || '',
      _source: 'firestore-poll',
    }))
  } catch (err) {
    console.warn('[CreaseFeed] Firestore fetchStandings failed:', err.message)
    return null
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
    const pollIds = gender === 'M'
      ? ['imlca', 'inside-lacrosse-m']
      : ['iwlca', 'inside-lacrosse-w']

    const [polls, rpi] = await Promise.all([
      Promise.all(
        pollIds.map(async (id) => {
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
const POS_MAP = {
  a: 'ATT', att: 'ATT', attack: 'ATT',
  m: 'MID', mid: 'MID', midfield: 'MID', mf: 'MID',
  d: 'DEF', def: 'DEF', defense: 'DEF',
  g: 'GK', gk: 'GK', goalie: 'GK', goalkeeper: 'GK',
  fo: 'FO', faceoff: 'FO', lsm: 'LSM',
}
function normPos(raw) {
  const key = String(raw || '').trim().toLowerCase()
  return POS_MAP[key] || '—'
}

// ── Fetch stat leaders from aggregated playerStats ────────────────────────────
export async function fetchStatLeaders(gender, stat = 'goals', division = '1') {
  try {
    const orderField = stat === 'saves' ? 'saves' : stat === 'assists' ? 'assists' : 'goals'
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
      const saves    = r.saves        || 0
      const ga       = r.goalsAllowed || 0
      // `goalieMinutes` is a misnomer: the NCAA box score reports goalie time
      // in SECONDS, and the aggregator stores it verbatim. GAA is therefore
      // goals-against per 3600s, not per 60.
      const gSecs    = r.goalieMinutes || 0
      const svptotal = saves + ga
      const svpct = svptotal > 0 ? (saves / svptotal).toFixed(3).replace(/^0\./, '.') : '—'
      const gaa   = gSecs   > 0 ? (ga * 3600 / gSecs).toFixed(2) : '—'
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
        sv:     saves,
        ga,
        svpct,
        gaa,
        apg:    r.gp ? (r.assists / r.gp).toFixed(1) : '—',
        _source: 'firestore',
      }
    })
  } catch (err) {
    console.warn('[CreaseFeed] fetchStatLeaders failed:', err.message)
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
