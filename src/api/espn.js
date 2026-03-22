// ============================================================================
// src/api/espn.js
//
// ⚠️  TEMPORARY DATA SOURCE — ESPN UNDOCUMENTED API
//
// ESPN does not officially support third-party use of these endpoints.
// They are publicly accessible with no auth key required, but:
//   - Could break or be rate-limited without notice
//   - Not suitable for production at scale
//   - No SLA, no support
//
// ✅  HOW TO SWAP THIS OUT:
//   1. Create src/api/sportradar.js (or sportsdata.js, etc.)
//   2. Export the same four functions with the same signatures:
//        fetchScoreboard(gender, date?)  → Game[]
//        fetchStandings(gender)          → Standing[]
//        fetchGameDetail(espnGameId)     → GameDetail
//        fetchStatLeaders(gender, stat)  → StatRow[]
//   3. In src/hooks/useScores.jsx, change ONE import line:
//        import * as DataSource from '../api/espn'
//        → import * as DataSource from '../api/sportradar'
//   4. Done. Zero UI changes required.
//
// All normalization happens here — the rest of the app only ever sees
// the CreaseFeed internal data shape defined at the bottom of this file.
// ============================================================================

// ── ESPN slug map ────────────────────────────────────────────────────────────
const ESPN_SLUGS = {
  M: 'mens-college-lacrosse',
  W: 'womens-college-lacrosse',
}

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/lacrosse'

// ── Helpers ──────────────────────────────────────────────────────────────────

function espnStatus(comp) {
  const type = comp?.status?.type?.name || ''
  if (type === 'STATUS_IN_PROGRESS' || type === 'STATUS_HALFTIME') return 'live'
  if (type === 'STATUS_FINAL' || type === 'STATUS_FULL_TIME')      return 'final'
  return 'upcoming'
}

function espnPeriod(comp) {
  const status = comp?.status
  const type   = status?.type?.name || ''

  if (type === 'STATUS_IN_PROGRESS') {
    const q   = status.period || ''
    const clk = status.displayClock || ''
    return q ? `Q${q} ${clk}` : clk
  }
  if (type === 'STATUS_HALFTIME') return 'HALFTIME'
  if (type === 'STATUS_FINAL')    return status.type?.shortDetail || 'FINAL'
  if (type === 'STATUS_SCHEDULED') {
    // Format: "7:00 PM ET"
    return status.type?.shortDetail || comp?.date || 'TBD'
  }
  return status?.type?.shortDetail || 'TBD'
}

function espnRecord(competitor) {
  const rec = competitor?.records?.[0]
  if (!rec) return ''
  return rec.summary || ''   // "8-1"
}

function espnRank(competitor) {
  const rank = competitor?.curatedRank?.current
  return rank && rank < 99 ? rank : null
}

function espnConference(comp) {
  // ESPN buries conference inside notes or groups — best effort
  const note = comp?.notes?.[0]?.headline || ''
  return note || ''
}

function espnLocation(comp) {
  const venue = comp?.venue
  if (!venue) return ''
  const city  = venue.address?.city  || ''
  const state = venue.address?.state || ''
  const name  = venue.fullName       || ''
  return [name, city && state ? `${city}, ${state}` : city || state].filter(Boolean).join(' · ')
}

// ── Normalize a single ESPN event → CreaseFeed Game ─────────────────────────
function normalizeGame(event, gender) {
  const comp       = event.competitions?.[0]
  if (!comp) return null

  const competitors = comp.competitors || []
  const away        = competitors.find(c => c.homeAway === 'away') || competitors[0] || {}
  const home        = competitors.find(c => c.homeAway === 'home') || competitors[1] || {}
  const status      = espnStatus(comp)
  const hasScore    = status !== 'upcoming'

  return {
    // ── IDs ──
    id:       event.id,
    espnId:   event.id,         // preserve for game detail fetches

    // ── Status ──
    status,
    period:   espnPeriod(comp),

    // ── Context ──
    conf:     espnConference(comp),
    loc:      espnLocation(comp),
    gender,

    // ── Teams ──
    away: {
      name:  away.team?.shortDisplayName || away.team?.displayName || 'Away',
      rank:  espnRank(away),
      score: hasScore ? parseInt(away.score, 10) : null,
      rec:   espnRecord(away),
    },
    home: {
      name:  home.team?.shortDisplayName || home.team?.displayName || 'Home',
      rank:  espnRank(home),
      score: hasScore ? parseInt(home.score, 10) : null,
      rec:   espnRecord(home),
    },

    // ── Meta ──
    _source: 'espn',            // tag so we know where this came from
    _fetchedAt: Date.now(),
  }
}

// ── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Fetch today's (or a specific date's) scoreboard.
 * @param {string} gender  'M' | 'W'
 * @param {string} [date]  'YYYYMMDD' — defaults to today
 * @returns {Promise<Game[]>}
 */
export async function fetchScoreboard(gender, date) {
  const slug = ESPN_SLUGS[gender]
  if (!slug) throw new Error(`Unknown gender: ${gender}`)

  const params = new URLSearchParams({ limit: 100 })
  if (date) params.set('dates', date)

  const url = `${BASE}/${slug}/scoreboard?${params}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN scoreboard fetch failed: ${res.status}`)

  const data   = await res.json()
  const events = data?.events || []

  return events
    .map(e => normalizeGame(e, gender))
    .filter(Boolean)
}

/**
 * Fetch standings for a gender.
 * ESPN doesn't expose a clean standings endpoint for college lacrosse,
 * so we derive from the scoreboard teams' records.
 * TODO: Replace with provider standings endpoint when available.
 * @param {string} gender 'M' | 'W'
 * @returns {Promise<Standing[]>}
 */
export async function fetchStandings(gender) {
  // ESPN college lacrosse standings endpoint (limited support)
  const slug = ESPN_SLUGS[gender]
  const url  = `${BASE}/${slug}/standings`

  try {
    const res  = await fetch(url)
    if (!res.ok) throw new Error(`standings ${res.status}`)
    const data = await res.json()

    const entries = data?.standings?.entries || []
    return entries.slice(0, 20).map((entry, i) => {
      const stats = {}
      entry.stats?.forEach(s => { stats[s.name] = s.value })
      return {
        rank:   i + 1,
        team:   entry.team?.shortDisplayName || entry.team?.displayName || '—',
        w:      stats.wins         ?? 0,
        l:      stats.losses       ?? 0,
        conf:   stats.gamesBehind  !== undefined ? `${stats.wins ?? 0}-${stats.losses ?? 0}` : '—',
        streak: entry.streak?.summary || '—',
        _source: 'espn',
      }
    })
  } catch (err) {
    // ESPN standings often 404 for lacrosse — fall back to mock
    console.warn('[CreaseFeed] ESPN standings unavailable, using mock:', err.message)
    return null  // caller falls back to mockData
  }
}

/**
 * Fetch detailed game data (quarter scores, plays) for a single game.
 * This is a Pro-only feature — only called when user is Pro.
 * @param {string} espnGameId
 * @param {string} gender 'M' | 'W'
 * @returns {Promise<GameDetail>}
 */
export async function fetchGameDetail(espnGameId, gender) {
  const slug = ESPN_SLUGS[gender]
  const url  = `${BASE}/${slug}/summary?event=${espnGameId}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN game detail fetch failed: ${res.status}`)

  const data = await res.json()
  const comp = data?.header?.competitions?.[0]

  // Quarter/period line scores
  const competitors = comp?.competitors || []
  const quarters    = competitors.map(c => ({
    team:   c.team?.abbreviation || c.team?.shortDisplayName,
    scores: c.linescores?.map(ls => ls.value ?? ls.displayValue ?? '—') || [],
    total:  c.score || '—',
  }))

  // Scoring plays
  const plays = (data?.scoringPlays || []).map(p => ({
    period: p.period?.displayValue || '',
    clock:  p.clock?.displayValue  || '',
    team:   p.team?.abbreviation   || '',
    desc:   p.text || p.type?.text || '',
    score:  p.awayScore !== undefined ? `${p.awayScore}-${p.homeScore}` : '',
  }))

  // Team stats
  const rawStats  = data?.boxscore?.teams || []
  const teamStats = rawStats.map(ts => {
    const statsMap = {}
    ts.statistics?.forEach(s => { statsMap[s.name] = s.displayValue })
    return {
      team:  ts.team?.abbreviation || ts.team?.shortDisplayName,
      stats: statsMap,
    }
  })

  return {
    espnGameId,
    quarters,
    plays,
    teamStats,
    _source:    'espn',
    _fetchedAt: Date.now(),
  }
}

/**
 * Fetch stat leaders.
 * ESPN college lacrosse leaders endpoint — limited availability.
 * Falls back to null so caller uses mockData.
 * @param {string} gender 'M' | 'W'
 * @returns {Promise<StatLeader[]|null>}
 */
export async function fetchStatLeaders(gender) {
  const slug = ESPN_SLUGS[gender]
  const url  = `${BASE}/${slug}/leaders`

  try {
    const res  = await fetch(url)
    if (!res.ok) throw new Error(`leaders ${res.status}`)
    const data = await res.json()

    // ESPN leaders shape varies — best effort normalization
    const categories = data?.leaders || []
    const goals = categories.find(c => c.name === 'goals' || c.abbreviation === 'G')
    if (!goals) return null

    return (goals.leaders || []).slice(0, 15).map((l, i) => ({
      rank:  i + 1,
      name:  l.athlete?.displayName || '—',
      team:  l.team?.shortDisplayName || l.team?.displayName || '—',
      pos:   l.athlete?.position?.abbreviation || '—',
      gp:    l.athlete?.statistics?.gamesPlayed ?? '—',
      g:     l.value ?? '—',
      a:     '—',   // ESPN leaders don't always include assists
      pts:   '—',
      gpg:   l.value && l.athlete?.statistics?.gamesPlayed
               ? (l.value / l.athlete.statistics.gamesPlayed).toFixed(1)
               : '—',
      _source: 'espn',
    }))
  } catch (err) {
    console.warn('[CreaseFeed] ESPN leaders unavailable, using mock:', err.message)
    return null
  }
}

// ── TYPE DOCS (JSDoc — no TypeScript required) ────────────────────────────────
/**
 * @typedef {Object} Game
 * @property {string}      id
 * @property {string}      espnId
 * @property {'live'|'final'|'upcoming'} status
 * @property {string}      period     — "Q3 8:42" | "FINAL" | "7:00 PM ET"
 * @property {string}      conf
 * @property {string}      loc
 * @property {'M'|'W'}    gender
 * @property {TeamSide}    away
 * @property {TeamSide}    home
 * @property {string}      _source    — 'espn' | 'sportradar' | 'mock'
 * @property {number}      _fetchedAt — ms timestamp
 *
 * @typedef {Object} TeamSide
 * @property {string}      name
 * @property {number|null} rank
 * @property {number|null} score
 * @property {string}      rec        — "8-1"
 *
 * @typedef {Object} Standing
 * @property {number} rank
 * @property {string} team
 * @property {number} w
 * @property {number} l
 * @property {string} conf
 * @property {string} streak
 *
 * @typedef {Object} GameDetail
 * @property {string}        espnGameId
 * @property {Array}         quarters
 * @property {Array}         plays
 * @property {Array}         teamStats
 */
