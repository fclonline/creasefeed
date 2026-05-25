// ============================================================================
// src/api/ncaa.js
//
// PRIMARY DATA SOURCE — NCAA Official Stats (sdataprod.ncaa.com)
//
// Uses the same GraphQL persisted-query endpoints that ncaa.com uses.
// Provides full scoreboard + box-score data for every D1 lacrosse game.
//
// ✅  SAME API AS espn.js — drop-in replacement:
//       fetchScoreboard(gender, date?)  → Game[]
//       fetchGameDetail(ncaaGameId)     → GameDetail
//       fetchStatLeaders(gender, stat)  → StatRow[]
//       fetchStandings(gender)          → Standing[]
// ============================================================================

// Use Cloud Function proxy to avoid CORS blocking from sdataprod.ncaa.com
// In development, you can switch back to the direct URL if needed
const BASE = 'https://us-east1-creasefeed.cloudfunctions.net/ncaaProxy'

// ── Sport codes & hashes ────────────────────────────────────────────────────
const SPORT_CODE = { M: 'MLA', W: 'WLA' }

// NCAA uses academic-year seasons: 2025 = the 2025-26 season
// We derive it: if month >= August, season = current year; else season = year - 1
function currentSeason() {
  const now = new Date()
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
}

// Persisted query hashes (from ncaa.com network traffic)
const HASHES = {
  schedules:  'a25ad021179ce1d97fb951a49954dc98da150089f9766e7e85890e439516ffbf',
  contests:   '6b26e5cda954c1302873c52835bfd223e169e2068b12511e92b3ef29fac779c2',
  boxscore:   'dfd0e926e92e81c2917b8f4ae564fbdcd5c69cd0441a2a8095b6b09e4cee7c36',
}

// ── Conference seo → display name ──────────────────────────────────────────
const CONF_DISPLAY = {
  'acc': 'ACC', 'big-ten': 'Big Ten', 'ivy-league': 'Ivy League',
  'patriot': 'Patriot', 'caa': 'CAA', 'big-east': 'Big East',
  'maac': 'MAAC', 'atlantic-10': 'Atlantic 10', 'nec': 'NEC',
  'america-east': 'America East', 'asun': 'ASUN', 'american': 'American',
  'big-12': 'Big 12', 'mac': 'MAC', 'big-south': 'Big South',
  'sec': 'SEC', 'independent': 'Independent', 'big-west': 'Big West',
  'socon': 'SoCon',
}

function confDisplay(seo) {
  if (!seo) return ''
  return CONF_DISPLAY[seo] || seo.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ncaaStatus(gameState) {
  if (gameState === 'L' || gameState === 'I') return 'live'
  if (gameState === 'F')                       return 'final'
  return 'upcoming'  // P = pre-game, S = scheduled
}

// Extract a clean start-time string, filtering out TBA and bogus early-AM times
function ncaaStartTime(contest) {
  const t = contest.startTime
  if (t && t !== 'TBA' && t !== 'TBD') {
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      const hour = parseInt(match[1], 10)
      const ampm = match[3].toUpperCase()
      if (ampm === 'AM' && hour >= 1 && hour <= 7) return 'TBA'
    }
    return t.replace(/\s*ET$/i, '').trim()
  }
  // Try epoch
  if (contest.startTimeEpoch) {
    const epoch = parseInt(contest.startTimeEpoch, 10)
    if (epoch > 0) {
      const d = new Date(epoch * 1000)
      const etStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
      const hm = etStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (hm) {
        const h = parseInt(hm[1], 10)
        const ap = hm[3].toUpperCase()
        const h24 = ap === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12)
        if (h24 >= 8 && h24 <= 23) return etStr
      }
    }
  }
  return 'TBA'
}

function ncaaPeriod(contest) {
  const state = ncaaStatus(contest.gameState)
  if (state === 'live') {
    const q = contest.currentPeriod || ''
    const clk = contest.contestClock || ''
    return q && clk ? `${q} ${clk}` : q || clk || 'LIVE'
  }
  if (state === 'final') {
    return contest.finalMessage || 'FINAL'
  }
  // Upcoming — show clean start time
  return ncaaStartTime(contest)
}

function ncaaDateParam(dateStr) {
  // Convert YYYYMMDD → MM/DD/YYYY for NCAA API
  if (!dateStr || dateStr.length !== 8) return null
  const y = dateStr.substring(0, 4)
  const m = dateStr.substring(4, 6)
  const d = dateStr.substring(6, 8)
  return `${m}/${d}/${y}`
}

function buildUrl(queryName, hash, variables) {
  const params = new URLSearchParams({
    meta: queryName,
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }),
    queryName,
    variables: JSON.stringify(variables),
  })
  return `${BASE}?${params}`
}

// ── Normalize a single NCAA contest → CreaseFeed Game ────────────────────────
function normalizeGame(contest, gender) {
  const teams     = contest.teams || []
  const homeTeam  = teams.find(t => t.isHome) || teams[0] || {}
  const awayTeam  = teams.find(t => !t.isHome) || teams[1] || {}
  const status    = ncaaStatus(contest.gameState)
  const hasScore  = status !== 'upcoming'

  // Prefer home team's conference for the game card display
  const confSeo = homeTeam.conferenceSeo || awayTeam.conferenceSeo || ''

  return {
    // ── IDs ──
    id:       String(contest.contestId),
    ncaaId:   String(contest.contestId),
    espnId:   null,                          // no ESPN ID — NCAA is primary now

    // ── Status ──
    status,
    period:   ncaaPeriod(contest),
    time:     ncaaStartTime(contest),

    // ── Context ──
    conf:     confDisplay(confSeo),
    loc:      '',                            // NCAA scoreboard doesn't include venue
    gender,

    // ── Teams ──
    away: {
      name:  awayTeam.nameShort || 'Away',
      rank:  awayTeam.teamRank || null,
      score: hasScore ? (awayTeam.score ?? null) : null,
      rec:   '',                             // NCAA scoreboard doesn't include records
    },
    home: {
      name:  homeTeam.nameShort || 'Home',
      rank:  homeTeam.teamRank || null,
      score: hasScore ? (homeTeam.score ?? null) : null,
      rec:   '',
    },

    // ── Meta ──
    _source:    'ncaa',
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
export async function fetchScoreboard(gender, date, division = 1) {
  const sportCode = SPORT_CODE[gender]
  if (!sportCode) throw new Error(`Unknown gender: ${gender}`)

  // Build NCAA date format MM/DD/YYYY
  let contestDate
  if (date) {
    contestDate = ncaaDateParam(date)
  } else {
    const now = new Date()
    contestDate = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}/${now.getFullYear()}`
  }

  // Determine which month we're querying (for the schedule context)
  const month = contestDate ? parseInt(contestDate.split('/')[0], 10) : (new Date().getMonth() + 1)

  const url = buildUrl('GetContests_web', HASHES.contests, {
    sportCode,
    division:    parseInt(division, 10),
    seasonYear:  currentSeason(),
    month,
    contestDate,
    week:        null,
  })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NCAA scoreboard fetch failed: ${res.status}`)

  const data     = await res.json()
  const contests = data?.data?.contests || []

  return contests
    .map(c => normalizeGame(c, gender))
    .filter(Boolean)
}

/**
 * Fetch detailed box score for a single game.
 * Returns full player stats, goalie stats, team colors, etc.
 * @param {string} ncaaContestId
 * @param {string} gender 'M' | 'W' (unused but kept for API compat)
 * @returns {Promise<GameDetail>}
 */
export async function fetchGameDetail(ncaaContestId, gender) {
  const url = buildUrl('NCAA_GetGamecenterBoxscoreLacrosseById_web', HASHES.boxscore, {
    contestId:     String(ncaaContestId),
    staticTestEnv: null,
  })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NCAA boxscore fetch failed: ${res.status}`)

  const data = await res.json()
  const box  = data?.data?.boxscore
  if (!box) return null

  const teams = box.teams || []
  const teamBoxscores = box.teamBoxscore || []

  // ── Build team stats summary ──
  const teamStats = teamBoxscores.map(tb => {
    const team = teams.find(t => t.teamId == tb.teamId)
    const players = tb.playerStats || []

    // Aggregate team totals from player stats
    let goals = 0, assists = 0, shots = 0, sog = 0, gb = 0, to = 0, ct = 0, saves = 0, ga = 0
    for (const p of players) {
      goals   += parseInt(p.goals || 0)
      assists += parseInt(p.assists || 0)
      shots   += parseInt(p.shots || 0)
      sog     += parseInt(p.shotsOnGoal || 0)
      gb      += parseInt(p.groundBalls || 0)
      to      += parseInt(p.turnovers || 0)
      ct      += parseInt(p.causedTurnovers || 0)
      if (p.goalie) {
        saves += parseInt(p.goalie.saves || 0)
        ga    += parseInt(p.goalie.goalsAllowed || 0)
      }
    }

    return {
      team:  team?.name6Char || team?.nameShort || '—',
      stats: {
        Goals: String(goals),
        Assists: String(assists),
        Shots: String(shots),
        'Shots on Goal': String(sog),
        'Ground Balls': String(gb),
        Turnovers: String(to),
        'Caused Turnovers': String(ct),
        Saves: String(saves),
        'Goals Allowed': String(ga),
      },
    }
  })

  // ── Build player box scores ──
  const playerStats = teamBoxscores.map(tb => {
    const team = teams.find(t => t.teamId == tb.teamId)
    const players = (tb.playerStats || [])
      .filter(p => p.participated)
      .map(p => {
        const name = [p.firstName, p.lastName].map(n =>
          n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : ''
        ).join(' ').trim()

        return {
          name,
          number:  p.number,
          pos:     (p.position || '').toUpperCase(),
          starter: p.starter,
          goals:   parseInt(p.goals || 0),
          assists: parseInt(p.assists || 0),
          points:  parseInt(p.goals || 0) + parseInt(p.assists || 0),
          shots:   parseInt(p.shots || 0),
          sog:     parseInt(p.shotsOnGoal || 0),
          gb:      parseInt(p.groundBalls || 0),
          to:      parseInt(p.turnovers || 0),
          ct:      parseInt(p.causedTurnovers || 0),
          ...(p.goalie ? {
            saves:  parseInt(p.goalie.saves || 0),
            ga:     parseInt(p.goalie.goalsAllowed || 0),
          } : {}),
        }
      })

    return {
      teamId:    team?.teamId,
      team:      team?.nameShort || '—',
      teamFull:  team?.nameFull || '',
      color:     team?.color || '',
      mascot:    team?.teamName || '',
      players,
    }
  })

  // ── Scoring plays (NCAA box score doesn't have play-by-play, derive from scorers) ──
  const plays = []
  for (const tb of teamBoxscores) {
    const team = teams.find(t => t.teamId == tb.teamId)
    const abbr = team?.name6Char || team?.nameShort || ''
    for (const p of (tb.playerStats || [])) {
      const g = parseInt(p.goals || 0)
      if (g > 0) {
        const name = [p.firstName, p.lastName].map(n =>
          n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : ''
        ).join(' ').trim()
        plays.push({
          period: '',
          clock:  '',
          team:   abbr,
          desc:   `${name} — ${g}G ${p.assists || 0}A`,
          score:  '',
        })
      }
    }
  }
  // Sort by goals descending
  plays.sort((a, b) => {
    const ga = parseInt(a.desc.match(/(\d+)G/)?.[1] || 0)
    const gb = parseInt(b.desc.match(/(\d+)G/)?.[1] || 0)
    return gb - ga
  })

  return {
    ncaaContestId: String(box.contestId),
    espnGameId:    null,
    quarters:      [],   // NCAA boxscore doesn't include period-by-period scores
    plays,
    teamStats,
    playerStats,         // BONUS: full player box scores (not available from ESPN)
    _source:    'ncaa',
    _fetchedAt: Date.now(),
  }
}

/**
 * Fetch standings — NCAA doesn't expose this via the scoreboard API.
 * Returns null so the caller falls back.
 * TODO: Scrape from stats.ncaa.org rankings page.
 * @param {string} gender 'M' | 'W'
 * @returns {Promise<Standing[]|null>}
 */
export async function fetchStandings(gender) {
  // NCAA scoreboard API doesn't provide standings
  // Will be populated by scraping polls (IMLCA / IWLCA / NCAA RPI)
  return null
}

/**
 * Fetch stat leaders — NCAA doesn't expose this via the scoreboard API.
 * Returns null so the caller falls back.
 * TODO: Scrape from stats.ncaa.org leaders page.
 * @param {string} gender 'M' | 'W'
 * @returns {Promise<StatLeader[]|null>}
 */
export async function fetchStatLeaders(gender) {
  // Will be populated by scraping stats.ncaa.org
  return null
}

/**
 * Fetch schedule calendar — which dates have games this month.
 * Useful for the date bar to show game counts.
 * @param {string} gender 'M' | 'W'
 * @param {number} [month] — defaults to current month
 * @returns {Promise<{date:string, count:number}[]>}
 */
export async function fetchScheduleCalendar(gender, month, division = 1) {
  const sportCode = SPORT_CODE[gender]
  if (!sportCode) return []

  const m = month || (new Date().getMonth() + 1)

  const url = buildUrl('NCAA_schedules_today_web', HASHES.schedules, {
    sportCode,
    division:    parseInt(division, 10),
    seasonYear:  currentSeason(),
    month:       m,
    contestDate: null,
    week:        null,
  })

  try {
    const res  = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.schedules?.games || []).map(g => ({
      date:  g.contestDate,
      count: g.count,
    }))
  } catch {
    return []
  }
}
