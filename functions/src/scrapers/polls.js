// ============================================================================
// functions/src/scrapers/polls.js  (v5 — feed-driven USILA, per-poll USAL pages)
//
// Sources:
//   USILA (Men's D1/D2/D3): usila.org news articles — Sidearm CMS
//                            Columns are (Team, Rank, Points), not (Rank, Team)
//                            Located via the Sidearm stories JSON feed
//   USA Lacrosse Magazine:  usalacrosse.com/magazine/rankings/<poll>-top-20
//                            One page per college poll (M/W × D1/D2/D3)
//   IWLCA:                  Their iMIS site is not server-renderable.
//                            Women's college coverage comes via USA Lacrosse.
//   NCAA RPI:               ncaa.com/rankings (server-side)
//
// Writes to Firestore:
//   /polls/{pollId}              → latest rankings
//   /polls/{pollId}/history/{wk} → weekly snapshots
//   /rpi/{gender}-d{div}         → NCAA RPI
// ============================================================================

import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import { db } from '../firebase.js'

const SEASON = '2026'

async function fetchHtml(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept':     'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

// ── fetch JSON with timeout ───────────────────────────────────────────────────
async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreaseFeed/1.0; +https://creasefeed.com)',
        'Accept':     'application/json',
      }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

// ── NCAA RPI API URL map (henrygd JSON proxy) ────────────────────────────────
const NCAA_RPI_API_URLS = {
  'M-1': 'https://ncaa-api.henrygd.me/rankings/lacrosse-men/d1/ncaa-mens-lacrosse-rpi',
  'W-1': 'https://ncaa-api.henrygd.me/rankings/lacrosse-women/d1/ncaa-womens-lacrosse-rpi',
}

function makeEntry(rank, team, record = '', points = '', prevRank = '', firstPlaceVotes = null) {
  const r = parseInt(rank, 10) || rank
  const p = prevRank ? parseInt(String(prevRank).replace(/[^0-9]/g, ''), 10) : null
  return {
    rank:     r,
    team:     team?.replace(/\s+/g, ' ').trim() || '',
    record:   record?.replace(/\s+/g, ' ').trim() || '',
    points:   points?.toString().trim() || '',
    prevRank: p,
    movement: p ? (p - r) : 0,
    firstPlaceVotes,
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// `meta` carries what the source itself says about the poll: weekLabel ("Week 13",
// "Final"), pollDate (its release date) and sourceUrl. History is keyed by the
// week label when there is one, so the nightly re-scrape of an unchanged poll
// overwrites one snapshot instead of minting a new one every calendar week.
async function savePoll(pollId, gender, source, entries, division = '1', meta = {}) {
  if (!entries?.length) { console.warn(`[polls] ${pollId} — 0 entries, skipping`); return }
  const now     = new Date()
  const { weekLabel = null, pollDate = null, sourceUrl = null } = meta
  const weekKey = weekLabel
    ? `${SEASON}-${weekLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    : `${now.getFullYear()}-W${getWeekNumber(now)}`
  const data    = {
    pollId, gender, division, source, entries, weekKey, weekLabel, pollDate, sourceUrl,
    publishedAt: now.toISOString(), fetchedAt: Date.now(),
  }
  await db.collection('polls').doc(pollId).set(data)
  await db.collection('polls').doc(pollId).collection('history').doc(weekKey).set(data)
  console.log(`[polls] ✓ ${pollId} — ${entries.length} teams (${weekLabel || weekKey})`)
}

// ── USILA: Sidearm CMS articles ──────────────────────────────────────────────
// Table column order (verified 2026 wk11 + Final): [Team(+logo+FPV), Rank, Points]
export function parseUSILAArticleTable(html) {
  const $       = cheerio.load(html)
  const entries = []

  $('div.standings-table table tbody tr, table.sidearm-table tbody tr').each((_, row) => {
    const tds = $(row).find('td')
    if (tds.length < 3) return

    const $team = tds.eq(0).clone()
    $team.find('img').remove()
    let teamText = $team.text().replace(/\s+/g, ' ').trim()

    // Strip trailing "(N)" first-place votes and capture them
    let firstPlaceVotes = null
    const fpvMatch = teamText.match(/\((\d+)\)\s*$/)
    if (fpvMatch) {
      firstPlaceVotes = parseInt(fpvMatch[1], 10)
      teamText = teamText.replace(/\(\d+\)\s*$/, '').trim()
    }

    const rankText = tds.eq(1).text().trim()
    const points   = tds.eq(2).text().trim()
    const rank     = parseInt(rankText, 10)

    if (!rank || rank < 1 || rank > 30) return
    if (!teamText || teamText.length < 2) return

    entries.push(makeEntry(rank, teamText, '', points, '', firstPlaceVotes))
  })

  // Dedupe (in case of multiple tables on the page) and sort. Key on team as well
  // as rank: tied teams share a rank, and a rank-only key dropped them.
  const seen = new Map()
  for (const e of entries) {
    const key = `${e.rank}|${e.team}`
    if (!seen.has(key)) seen.set(key, e)
  }
  return [...seen.values()].sort((a, b) => a.rank - b.rank)
}

// The Sidearm stories feed lists articles newest first, so the first headline
// matching a division is its latest poll. This replaced guessing article URLs
// from a hardcoded list of dates, which ended in late April and so never found
// Week 13 or the Final.
const USILA_STORIES_URL = 'https://usila.org/services/adaptive_components.ashx?type=stories&count=200&start=0&sport_id=0'
const ROMAN = { '1': 'I', '2': 'II', '3': 'III' }

export function findUSILAStory(stories, division) {
  const re = new RegExp(`Men.s Coaches Division ${ROMAN[division]} Poll\\s*-\\s*(.+?)\\s*$`, 'i')
  for (const s of stories) {
    const m = (s.headline || '').match(re)
    if (m && s.story_path) return { path: s.story_path, weekLabel: m[1].trim(), date: s.date }
  }
  return null
}

async function scrapeUSILA(division, stories) {
  console.log(`[polls] USILA Men's D${division}...`)
  try {
    const story = findUSILAStory(stories, division)
    if (!story) { console.warn(`[polls] USILA D${division}: no poll story in feed`); return null }
    const url     = `https://usila.org${story.path}`
    const html    = await fetchHtml(url)
    const entries = parseUSILAArticleTable(html)
    console.log(`[polls] USILA D${division} (${story.weekLabel}) → ${url}: ${entries.length} teams`)
    return { entries, weekLabel: story.weekLabel, pollDate: story.date?.slice(0, 10) || null, sourceUrl: url }
  } catch (err) {
    console.error(`[polls] USILA D${division} error: ${err.message}`)
    return null
  }
}

// ── USA Lacrosse Magazine — one page per poll ─────────────────────────────────
// The /magazine/rankings landing page was redesigned (Sept 2026) and only ever
// previewed each poll's top 3. Each poll's full list lives on its own page:
//   <p><strong>Date:</strong> May 27, 2026 <strong>Week:</strong> Final</p>
//   <table class="table"> header row (# | TEAM | W-L | PR), then one row per team,
//   then an "Also considered" row followed by unranked teams (rank "—").
const USAL_POLLS = [
  { gender: 'M', div: '1', slug: 'division-i-men-top-20' },
  { gender: 'M', div: '2', slug: 'division-ii-men-top-20' },
  { gender: 'M', div: '3', slug: 'division-iii-men-top-20' },
  { gender: 'W', div: '1', slug: 'division-i-women-top-20' },
  { gender: 'W', div: '2', slug: 'division-ii-women-top-20' },
  { gender: 'W', div: '3', slug: 'division-iii-women-top-20' },
]

export function parseUSALPollPage(html) {
  const $       = cheerio.load(html)
  const $table  = $('table.table').first()
  const entries = []

  $table.find('tr').each((_, row) => {
    const tds = $(row).find('td')
    if (tds.length < 4) return
    const rank = parseInt(tds.eq(0).text().replace(/ /g, ' ').trim(), 10)
    if (!rank || rank < 1 || rank > 30) return
    const team = tds.eq(1).text().trim()
    if (!team) return
    entries.push(makeEntry(rank, team, tds.eq(2).text().trim(), '', tds.eq(3).text().trim()))
  })

  const meta     = $table.prevAll('p').first().text().replace(/ /g, ' ')
  const dateStr  = meta.match(/Date:\s*([A-Za-z]+\.? \d{1,2},? \d{4})/)?.[1]
  const parsed   = dateStr ? new Date(dateStr) : null
  const pollDate = parsed && !isNaN(parsed) ? parsed.toISOString().slice(0, 10) : null
  const weekLabel = meta.match(/Week:\s*(.+?)\s*$/m)?.[1]?.trim() || null

  return { entries: entries.sort((a, b) => a.rank - b.rank), pollDate, weekLabel }
}

async function scrapeUSALacrosse() {
  console.log('[polls] USA Lacrosse Magazine...')
  const results = {}

  await Promise.all(USAL_POLLS.map(async ({ gender, div, slug }) => {
    const pollId = `usal-${gender.toLowerCase()}-d${div}`
    const url    = `https://www.usalacrosse.com/magazine/rankings/${slug}`
    try {
      const parsed = parseUSALPollPage(await fetchHtml(url))
      if (parsed.entries.length === 0) { console.warn(`[polls] USAL ${pollId}: 0 teams parsed`); return }
      results[pollId] = { ...parsed, gender, div, sourceUrl: url }
      console.log(`[polls] USAL ${pollId} (${parsed.weekLabel}, ${parsed.pollDate}): ${parsed.entries.length} teams`)
    } catch (err) {
      console.error(`[polls] USAL ${pollId} failed: ${err.message}`)
    }
  }))

  return results
}

// ── NCAA RPI scraper (NCAA API JSON) ──────────────────────────────────────────
// Replaces the cheerio-based scraping of ncaa.com/rankings HTML.
// The NCAA API returns clean JSON with richer fields (road/neutral/home/
// non-Division I splits) than what we previously extracted.
async function scrapeRPI(gender) {
  const key = `${gender}-1`
  const url = NCAA_RPI_API_URLS[key]
  if (!url) return []

  console.log(`[polls] Fetching NCAA RPI ${key} from API...`)
  const entries = []

  try {
    const json = await fetchJson(url)
    const rows = Array.isArray(json?.data) ? json.data : []

    for (const row of rows) {
      const rank = parseInt(row.Rank, 10)
      if (!rank) continue

      const prevRank = parseInt(row.Prev, 10) || null

      entries.push({
        rank,
        team:     row.School?.trim()         || '',
        conf:     row.Conf?.trim()           || '',
        record:   row.Record?.trim()         || '',
        road:     row.Road?.trim()           || '',
        neutral:  row.Neutral?.trim()        || '',
        home:     row.Home?.trim()           || '',
        nonDivI:  row['Non-Div I']?.trim()   || '',
        rpi:      null,
        points:   '',
        prevRank,
        movement: prevRank ? (prevRank - rank) : 0,
      })
    }

    console.log(`[polls] NCAA RPI ${key} — ${entries.length} teams`)

    if (entries.length > 0) {
      const now     = new Date()
      const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`
      const pollId  = `rpi-${gender.toLowerCase()}-d1`
      const data    = { pollId, gender, division: '1', source: 'NCAA RPI', entries, weekKey, publishedAt: now.toISOString(), fetchedAt: Date.now() }
      await db.collection('rpi').doc(pollId).set(data)
      await db.collection('rpi').doc(pollId).collection('history').doc(weekKey).set(data)
      console.log(`[polls] ✓ RPI ${gender}: ${entries.length} teams`)
    }
  } catch (err) {
    console.error(`[polls] NCAA RPI ${key} failed:`, err.message)
  }

  return entries
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function scrapeAllPolls() {
  console.log('[polls] Starting poll scrape (v5)...')
  const results = {}

  let stories = []
  try {
    stories = (await fetchJson(USILA_STORIES_URL))?.data || []
  } catch (err) {
    console.error(`[polls] USILA stories feed failed: ${err.message}`)
  }

  const [u1, u2, u3, usal, rm, rw] = await Promise.allSettled([
    scrapeUSILA('1', stories),
    scrapeUSILA('2', stories),
    scrapeUSILA('3', stories),
    scrapeUSALacrosse(),
    scrapeRPI('M'),
    scrapeRPI('W'),
  ])

  // IWLCA: iMIS site doesn't expose server-rendered rankings.
  // Women's college coverage comes from USA Lacrosse Magazine instead.
  console.log('[polls] IWLCA: skipped (iMIS site not server-renderable; using USAL for women)')

  const usila = [['imlca', '1', u1], ['usila-m-d2', '2', u2], ['usila-m-d3', '3', u3]]
  for (const [pollId, div, r] of usila) {
    if (r.status === 'fulfilled' && r.value?.entries?.length) {
      await savePoll(pollId, 'M', 'USILA Coaches Poll', r.value.entries, div, r.value)
      results[`usila_d${div}`] = r.value.entries.length
    }
  }
  if (usal.status === 'fulfilled') {
    for (const [pid, d] of Object.entries(usal.value || {})) {
      await savePoll(pid, d.gender, 'USA Lacrosse Magazine', d.entries, d.div, d)
      results[pid] = d.entries.length
    }
  }
  results.rpi_m = rm.status === 'fulfilled' ? rm.value?.length || 0 : 0
  results.rpi_w = rw.status === 'fulfilled' ? rw.value?.length || 0 : 0

  console.log('[polls] ✓ Complete:', JSON.stringify(results))
  return results
}
