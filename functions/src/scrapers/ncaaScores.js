// ============================================================================
// functions/src/scrapers/ncaaScores.js
//
// Fetches lacrosse scores from the NCAA API (henrygd proxy) and writes to
// Firestore /games/{ncaa-gameId}. This is the PRIMARY source for game scores,
// team names, and live status. Sidearm scraping is only used for player stats.
//
// NCAA API endpoint pattern:
//   https://ncaa-api.henrygd.me/scoreboard/lacrosse-men/d1/YYYY/MM/DD/all-conf
//   https://ncaa-api.henrygd.me/scoreboard/lacrosse-women/d1/YYYY/MM/DD/all-conf
//
// Runs on the existing 5-minute cron during game hours.
// ============================================================================

import fetch from 'node-fetch'
import { db } from '../firebase.js'
import { seasonForDate } from '../season.js'

// How far ahead to pull schedules. 14 days keeps the Schedule page populated
// through the next two weekends without hammering the API: 6 combinations
// (2 genders x 3 divisions) x 16 dates = 96 requests per run.
const SCHEDULE_LOOKAHEAD_DAYS = 14

// Upstream rate-limits around 5 requests/sec, so fetch in small waves.
const SCOREBOARD_CONCURRENCY = 4
const SCOREBOARD_THROTTLE_MS = 250

// ── fetch JSON with timeout + retry ───────────────────────────────────────────
async function fetchJson(url, retries = 2, timeoutMs = 12000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CreaseFeed/1.0; +https://creasefeed.com)',
          'Accept': 'application/json',
        }
      })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
      return await res.json()
    } catch (err) {
      clearTimeout(timeout)
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

// ── format date as YYYY/MM/DD for NCAA API URL ───────────────────────────────
function formatDatePath(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

// ── format date as YYYYMMDD for gameDate field ───────────────────────────────
function formatGameDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// ── map NCAA game state to our status ────────────────────────────────────────
function mapStatus(gameState) {
  if (!gameState) return 'upcoming'
  const s = gameState.toLowerCase()
  if (s === 'final' || s === 'completed') return 'final'
  if (s === 'live' || s === 'in_progress' || s === 'in progress') return 'live'
  if (s === 'pre' || s === 'pre_game' || s === 'scheduled') return 'upcoming'
  return 'upcoming'
}

// ── extract a clean start-time string ────────────────────────────────────────
// NCAA API sometimes returns "TBA", bogus early-AM times, or nothing.
// Returns a clean time like "3:00 PM" or "TBA" if unknown.
function extractStartTime(game) {
  const t = game.startTime
  if (t && t !== 'TBA' && t !== 'TBD') {
    // Check for bogus early-morning times (12:xx AM – 7:xx AM)
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      const hour = parseInt(match[1], 10)
      const ampm = match[3].toUpperCase()
      if (ampm === 'AM' && hour >= 1 && hour <= 7) return 'TBA' // placeholder
    }
    // Strip trailing " ET" for cleaner display
    return t.replace(/\s*ET$/i, '').trim()
  }
  // Fall back to epoch conversion
  if (game.startTimeEpoch) {
    const epoch = parseInt(game.startTimeEpoch, 10)
    if (epoch > 0) {
      const d = new Date(epoch * 1000)
      const etStr = d.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })
      // Validate it's a reasonable game hour (8 AM – 11:59 PM ET)
      const hourMatch = etStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (hourMatch) {
        const h = parseInt(hourMatch[1], 10)
        const ap = hourMatch[3].toUpperCase()
        const is24h = ap === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12)
        if (is24h >= 8 && is24h <= 23) return etStr
      }
    }
  }
  return 'TBA'
}

// ── map NCAA period text ─────────────────────────────────────────────────────
function mapPeriod(game) {
  const status = mapStatus(game.gameState)
  if (status === 'final') return 'FINAL'
  if (status === 'live') return game.currentPeriod || 'LIVE'
  // Upcoming — show start time from extractStartTime
  return extractStartTime(game) || 'TBA'
}

// ── extract conference from NCAA team data ───────────────────────────────────
function getConf(team) {
  if (!team?.conferences?.length) return ''
  // conferenceSeo is slug-like: "acc", "patriot-league", "big-ten"
  // conferenceName is display: "ACC", "Patriot League", "Big Ten"
  return team.conferences[0].conferenceName || team.conferences[0].conferenceSeo || ''
}

// ── fetch + write scores for one sport/gender/division/date ──────────────────
async function fetchAndWriteScores(sport, gender, div, date) {
  const datePath = formatDatePath(date)
  const gameDate = formatGameDate(date)
  const divPath = div === '1' ? 'd1' : div === '2' ? 'd2' : 'd3'
  const url = `https://ncaa-api.henrygd.me/scoreboard/${sport}/${divPath}/${datePath}/all-conf`

  let data
  try {
    data = await fetchJson(url)
  } catch (err) {
    console.error(`[ncaa-scores] Failed to fetch ${url}: ${err.message}`)
    return { fetched: 0, written: 0, errors: 0 }
  }

  // NCAA API returns { games: [...] } or just an array
  const games = Array.isArray(data?.games) ? data.games
    : Array.isArray(data) ? data
    : data?.games ? [data.games]  // single game edge case
    : []

  if (games.length === 0) {
    console.log(`[ncaa-scores] No ${gender} games for ${datePath}`)
    return { fetched: 0, written: 0, errors: 0 }
  }

  let written = 0
  let errors = 0

  // Batch write for efficiency
  const BATCH_SIZE = 400 // Firestore max is 500
  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = games.slice(i, i + BATCH_SIZE)

    for (const g of chunk) {
      try {
        const game = g.game || g // some responses nest under .game

        const gameId = game.gameID || game.id || game.gameId
        if (!gameId) continue

        const away = game.away || {}
        const home = game.home || {}

        const docId = `ncaa-${gameId}`
        const ref = db.collection('games').doc(docId)

        const status = mapStatus(game.gameState)

        const doc = {
          away: {
            name:  away.names?.short || away.names?.full || away.names?.seo || away.name || 'Away',
            score: parseInt(away.score, 10) || null,
            rank:  away.rank || null,
            rec:   away.record || away.description || '',
            conf:  getConf(away),
            teamSeo: away.names?.seo || '',
          },
          home: {
            name:  home.names?.short || home.names?.full || home.names?.seo || home.name || 'Home',
            score: parseInt(home.score, 10) || null,
            rank:  home.rank || null,
            rec:   home.record || home.description || '',
            conf:  getConf(home),
            teamSeo: home.names?.seo || '',
          },
          status,
          period:         mapPeriod(game),
          time:           extractStartTime(game),
          gameDate,
          startDate:      game.startDate || '',
          startTimeEpoch: game.startTimeEpoch || null,
          ncaaGameId:     String(gameId),
          conf:           getConf(home) || getConf(away) || '',
          gender,
          div,
          // Derived from the game's own date so a 2027 game is labelled 2027
          // the moment it appears -- no redeploy at the season rollover.
          season:         seasonForDate(date),
          _source:        'ncaa-api',
          updatedAt:      Date.now(),
        }

        batch.set(ref, doc, { merge: true })
        written++
      } catch (err) {
        errors++
        console.error(`[ncaa-scores] Error processing game:`, err.message)
      }
    }

    try {
      await batch.commit()
    } catch (err) {
      console.error(`[ncaa-scores] Batch commit failed:`, err.message)
      errors += chunk.length
      written -= chunk.length
    }
  }

  console.log(`[ncaa-scores] ${gender} D${div} ${datePath}: ${written} games written, ${errors} errors`)
  return { fetched: games.length, written, errors }
}

// ── main entry point — fetch scores for today + yesterday ────────────────────
export async function fetchNcaaScores() {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  console.log(`[ncaa-scores] Fetching NCAA D1/D2/D3 lacrosse scores...`)

  // Yesterday and today for results, plus a forward window so schedules load as
  // soon as the NCAA posts them rather than only on game day. Upcoming games
  // write with status 'upcoming' and no score, which the Schedule page already
  // renders; re-fetching a date just overwrites it, so a schedule change is
  // picked up on the next pass.
  const jobs = []
  const dates = [yesterday, now]
  for (let i = 1; i <= SCHEDULE_LOOKAHEAD_DAYS; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  for (const div of ['1', '2', '3']) {
    for (const [sport, gender] of [['lacrosse-men', 'M'], ['lacrosse-women', 'W']]) {
      // Push thunks, not promises: pushing a call would start all of them at
      // once, and with the lookahead window that is ~96 simultaneous requests
      // against an API that rate-limits around 5/sec.
      for (const d of dates) jobs.push(() => fetchAndWriteScores(sport, gender, div, d))
    }
  }

  const results = []
  for (let i = 0; i < jobs.length; i += SCOREBOARD_CONCURRENCY) {
    const slice = jobs.slice(i, i + SCOREBOARD_CONCURRENCY)
    results.push(...await Promise.allSettled(slice.map(fn => fn())))
    if (i + SCOREBOARD_CONCURRENCY < jobs.length) {
      await new Promise(r => setTimeout(r, SCOREBOARD_THROTTLE_MS))
    }
  }

  const totals = { fetched: 0, written: 0, errors: 0 }
  for (const r of results) {
    if (r.status === 'fulfilled') {
      totals.fetched += r.value.fetched
      totals.written += r.value.written
      totals.errors += r.value.errors
    } else {
      totals.errors++
      console.error(`[ncaa-scores] Promise rejected:`, r.reason?.message)
    }
  }

  console.log(`[ncaa-scores] ═══════════════════════════════════════`)
  console.log(`[ncaa-scores] ✓ Complete`)
  console.log(`[ncaa-scores]   Games fetched: ${totals.fetched}`)
  console.log(`[ncaa-scores]   Games written: ${totals.written}`)
  console.log(`[ncaa-scores]   Errors:        ${totals.errors}`)
  console.log(`[ncaa-scores] ═══════════════════════════════════════`)

  return totals
}

// ── one-time scoreboard backfill — loop every date × gender × division ───────
// The forward cron (fetchNcaaScores) only covers today + yesterday, so games
// from early in the season were never written to /games. This loops day-by-day
// from `start` to `end` and re-uses the existing fetchAndWriteScores helper to
// create skeleton game docs for every missing game.
//
// Idempotent: fetchAndWriteScores writes with `batch.set(ref, doc, { merge: true })`,
// so re-running this updates existing game docs in place rather than overwriting.
// Safe to re-run anytime data goes missing.
export async function backfillScoreboards({ start = '2026-02-01', end = null } = {}) {
  // Parse at noon local time to avoid timezone date-rollover edge cases.
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = end ? new Date(`${end}T12:00:00`) : new Date()
  endDate.setHours(12, 0, 0, 0)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error(`[scoreboard-backfill] Invalid date range: start=${start} end=${end}`)
  }
  if (startDate > endDate) {
    throw new Error(`[scoreboard-backfill] start (${start}) is after end`)
  }

  // sport / gender / division — the 6 combinations the NCAA API exposes
  const combos = [
    ['lacrosse-men',   'M', '1'],
    ['lacrosse-men',   'M', '2'],
    ['lacrosse-men',   'M', '3'],
    ['lacrosse-women', 'W', '1'],
    ['lacrosse-women', 'W', '2'],
    ['lacrosse-women', 'W', '3'],
  ]

  const THROTTLE_MS = 250 // delay between scoreboard fetches; bump to 500 if upstream 502s

  const totals = { datesProcessed: 0, fetched: 0, written: 0, errors: 0 }

  console.log(`[scoreboard-backfill] ═══════════════════════════════════════`)
  console.log(`[scoreboard-backfill] Backfilling ${formatDatePath(startDate)} → ${formatDatePath(endDate)}`)

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const datePath = formatDatePath(d)
    let dayWritten = 0
    let dayErrors = 0

    for (const [sport, gender, div] of combos) {
      try {
        const r = await fetchAndWriteScores(sport, gender, div, new Date(d))
        totals.fetched += r.fetched
        totals.written += r.written
        totals.errors  += r.errors
        dayWritten     += r.written
        dayErrors      += r.errors
      } catch (err) {
        totals.errors++
        dayErrors++
        console.error(`[scoreboard-backfill] ${gender} D${div} ${datePath} failed: ${err.message}`)
      }
      // Throttle to stay under the upstream API's rate limit.
      await new Promise(r => setTimeout(r, THROTTLE_MS))
    }

    totals.datesProcessed++
    console.log(`[scoreboard-backfill] ${datePath}: ${dayWritten} written, ${dayErrors} errors`)
  }

  console.log(`[scoreboard-backfill] ═══════════════════════════════════════`)
  console.log(`[scoreboard-backfill] ✓ Complete`)
  console.log(`[scoreboard-backfill]   Dates processed: ${totals.datesProcessed}`)
  console.log(`[scoreboard-backfill]   Games fetched:   ${totals.fetched}`)
  console.log(`[scoreboard-backfill]   Games written:   ${totals.written}`)
  console.log(`[scoreboard-backfill]   Errors:          ${totals.errors}`)
  console.log(`[scoreboard-backfill] ═══════════════════════════════════════`)

  return totals
}
