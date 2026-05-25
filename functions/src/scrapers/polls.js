// ============================================================================
// functions/src/scrapers/polls.js  (v4 — corrected parsers)
//
// Sources:
//   USILA (Men's D1/D2/D3): usila.org news articles — Sidearm CMS
//                            Columns are (Team, Rank, Points), not (Rank, Team)
//   USA Lacrosse Magazine:  usalacrosse.com/magazine/rankings
//                            All 6 college sections (M/W × D1/D2/D3) in one page
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

async function savePoll(pollId, gender, source, entries, division = '1') {
  if (!entries?.length) { console.warn(`[polls] ${pollId} — 0 entries, skipping`); return }
  const now     = new Date()
  const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`
  const data    = { pollId, gender, division, source, entries, weekKey, publishedAt: now.toISOString(), fetchedAt: Date.now() }
  await db.collection('polls').doc(pollId).set(data)
  await db.collection('polls').doc(pollId).collection('history').doc(weekKey).set(data)
  console.log(`[polls] ✓ ${pollId} — ${entries.length} teams`)
}

// ── USILA: Sidearm CMS articles ──────────────────────────────────────────────
// Table column order (verified 2026 wk11): [Team(+logo+FPV), Rank, Points]
function parseUSILAArticleTable(html) {
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

  // Dedupe by rank (in case of multiple tables on the page) and sort
  const seen = new Map()
  for (const e of entries) if (!seen.has(e.rank)) seen.set(e.rank, e)
  return [...seen.values()].sort((a, b) => a.rank - b.rank)
}

async function findUSILAUrl(division) {
  const divSlug = division === '1' ? 'division-i' : division === '2' ? 'division-ii' : 'division-iii'

  // Mon/Tue dates this season, most recent first
  const dates = [
    '4/27','4/28','4/21','4/20','4/14','4/13','4/7','4/8',
    '3/31','4/1','3/23','3/24','3/16','3/17',
    '3/9','3/10','3/2','3/3','2/23','2/24',
    '2/17','2/18','2/9','2/10','2/2','2/3','1/27','1/28',
  ]

  for (let week = 14; week >= 0; week--) {
    const weekSlug = week === 0 ? 'preseason' : `week-${week}`
    for (const d of dates) {
      const [m, day] = d.split('/')
      const url = `https://usila.org/news/${SEASON}/${m}/${day}/mens-lacrosse-usila-${SEASON}-mens-coaches-${divSlug}-poll-${weekSlug}.aspx`
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        })
        if (res.ok) { console.log(`[polls] USILA D${division} → ${url}`); return url }
      } catch {}
    }
  }
  return null
}

async function scrapeUSILA(division) {
  console.log(`[polls] USILA Men's D${division}...`)
  try {
    const url = await findUSILAUrl(division)
    if (!url) { console.warn(`[polls] USILA D${division}: no article found`); return [] }
    const html    = await fetchHtml(url)
    const entries = parseUSILAArticleTable(html)
    console.log(`[polls] USILA D${division}: ${entries.length} teams`)
    return entries
  } catch (err) {
    console.error(`[polls] USILA D${division} error: ${err.message}`)
    return []
  }
}

// ── USA Lacrosse Magazine — section-aware card parser ────────────────────────
// DOM (verified):
//   .magazine-categorized-standings (heading <h2>College</h2>)
//     .magazine-categorized-section  (heading <h3>Division I/II/III</h3>)
//       .magazine-categorized-table
//         .magazine-categorized-table__header (heading <h4>Men/Women</h4>)
//         article.magazine-team--standings
//           .magazine-team__ranking--current  > div  (rank)
//           .magazine-team__ranking--previous > div  (prev rank)
//           .magazine-team__title                    (team name)
//           .magazine-team__record                   ("9 - 1")
async function scrapeUSALacrosse() {
  console.log('[polls] USA Lacrosse Magazine...')
  const results = {}

  try {
    const html = await fetchHtml('https://www.usalacrosse.com/magazine/rankings')
    const $    = cheerio.load(html)

    $('.magazine-categorized-standings').each((_, container) => {
      const $container = $(container)
      const topHeading = $container.find('.magazine-categorized-standings__heading').first().text().trim()
      // Only parse the College block (skip HS/Club/Pro if present)
      if (!/college/i.test(topHeading)) return

      $container.find('.magazine-categorized-section').each((_, section) => {
        const $section = $(section)
        const divText  = $section.children('h3').first().text().trim()
        const division = /\biii\b/i.test(divText) ? '3'
                       : /\bii\b/i.test(divText)  ? '2'
                       : /\bi\b/i.test(divText)   ? '1'
                       : null
        if (!division) return

        $section.find('.magazine-categorized-table').each((_, table) => {
          const $table = $(table)
          const genderText = $table.find('.magazine-categorized-table__header h4').first().text().trim()
            || $table.find('h4').first().text().trim()
          const gender = /women|girls/i.test(genderText) ? 'W'
                       : /men|boys/i.test(genderText)    ? 'M'
                       : null
          if (!gender) return

          const pollId  = `usal-${gender.toLowerCase()}-d${division}`
          const entries = []

          $table.find('article.magazine-team--standings').each((_, card) => {
            const $card   = $(card)
            const curStr  = $card.find('.magazine-team__ranking--current div').first().text().trim()
            const prevStr = $card.find('.magazine-team__ranking--previous div').first().text().trim()
            const team    = $card.find('.magazine-team__title').first().text().trim()
            const record  = $card.find('.magazine-team__record').first().text().replace(/\s+/g, ' ').trim()
            const rank    = parseInt(curStr, 10)

            if (!rank || rank < 1 || rank > 30) return
            if (!team) return

            entries.push(makeEntry(rank, team, record, '', prevStr))
          })

          if (entries.length > 0) {
            entries.sort((a, b) => a.rank - b.rank)
            results[pollId] = { entries, gender, div: division }
            console.log(`[polls] USAL ${pollId}: ${entries.length} teams`)
          }
        })
      })
    })
  } catch (err) {
    console.error('[polls] USA Lacrosse Magazine failed:', err.message)
  }

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
  console.log('[polls] Starting poll scrape (v4)...')
  const results = {}

  const [u1, u2, u3, usal, rm, rw] = await Promise.allSettled([
    scrapeUSILA('1'),
    scrapeUSILA('2'),
    scrapeUSILA('3'),
    scrapeUSALacrosse(),
    scrapeRPI('M'),
    scrapeRPI('W'),
  ])

  // IWLCA: iMIS site doesn't expose server-rendered rankings.
  // Women's college coverage comes from USA Lacrosse Magazine instead.
  console.log('[polls] IWLCA: skipped (iMIS site not server-renderable; using USAL for women)')

  if (u1.status === 'fulfilled' && u1.value?.length) {
    await savePoll('imlca',      'M', 'USILA Coaches Poll', u1.value, '1')
    results.usila_d1 = u1.value.length
  }
  if (u2.status === 'fulfilled' && u2.value?.length) {
    await savePoll('usila-m-d2', 'M', 'USILA Coaches Poll', u2.value, '2')
    results.usila_d2 = u2.value.length
  }
  if (u3.status === 'fulfilled' && u3.value?.length) {
    await savePoll('usila-m-d3', 'M', 'USILA Coaches Poll', u3.value, '3')
    results.usila_d3 = u3.value.length
  }
  if (usal.status === 'fulfilled') {
    for (const [pid, d] of Object.entries(usal.value || {})) {
      await savePoll(pid, d.gender, 'USA Lacrosse Magazine', d.entries, d.div)
      results[pid] = d.entries.length
    }
  }
  results.rpi_m = rm.status === 'fulfilled' ? rm.value?.length || 0 : 0
  results.rpi_w = rw.status === 'fulfilled' ? rw.value?.length || 0 : 0

  console.log('[polls] ✓ Complete:', JSON.stringify(results))
  return results
}
