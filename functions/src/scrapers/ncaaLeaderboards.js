// ============================================================================
// functions/src/scrapers/ncaaLeaderboards.js
//
// Official NCAA individual leaderboards -- goalkeepers (both genders) and
// men's face-offs, D1/D2/D3.
//
// Source: ncaa-api.henrygd.me/stats/{sport}/{div}/current/individual/{id}, the
// same wrapper the box-score pipeline uses, serving ncaa.com's stat pages as
// JSON. These come from the NCAA's official season database, NOT the box-score
// endpoint, which matters for both boards:
//   - Goalies: the box-score API zero-fills per-player goalie lines (0% of
//     women's games, ~10-30% of men's), so a saves board built from box scores
//     ranks "goalies whose teams happened to report". The official list has
//     real saves/GA/minutes for every qualifier.
//   - Face-offs: the box-score API has no face-off keys at all.
//
// Each list holds only players who meet the NCAA's minimum (e.g. share of team
// minutes), 50 per page -- every regular starter, but not full rosters. The
// source stops at 4 pages, so D3 boards are the top 200; that cap is also why a
// few D3 goalies have no GAA (the GAA list's top 200 is a different set).
//
// Season: never pass our season label to the API. Its year means the FALL year
// (2025 = spring 2026), and 2026 ALSO returns spring 2026. We always ask for
// `current` and derive the season from the "Through games <date>" stamp.
//
// Units: "Min. Played" here is real minutes. Do not mix with playerStats
// `goalieMinutes`, which holds SECONDS.
//
// Writes: /leaderboards/{season}-{M|W}-d{div}-{saves|faceoffs}
// An empty or malformed fetch never overwrites a good doc -- early in a season
// the official lists are empty, and last season's final board should stand.
// ============================================================================

import fetch from 'node-fetch'
import { seasonForDate } from '../season.js'

const API = 'https://ncaa-api.henrygd.me/stats'

// Stat ids from ncaa.com's own category <select>, identical across divisions.
const SPORT = { M: 'lacrosse-men', W: 'lacrosse-women' }
const SAVE_PCT = { M: 224, W: 242 }
const GAA      = { M: 225, W: 243 }
const FACEOFF_PCT = 410   // men only

const DIVS = ['1', '2', '3']
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreaseFeed/1.0; +https://creasefeed.com)',
        'Accept':     'application/json',
      },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

// Every page of one category. Returns { title, updated, rows } or null when the
// category has no data (preseason, or a division that doesn't publish it).
async function fetchCategory(gender, div, id) {
  const base = `${API}/${SPORT[gender]}/d${div}/current/individual/${id}`
  const first = await fetchJson(base)
  if (!first?.data?.length) return null
  const rows = [...first.data]
  for (let page = 2; page <= (first.pages || 1); page++) {
    await sleep(250)
    const next = await fetchJson(`${base}?page=${page}`)
    if (next?.data?.length) rows.push(...next.data)
  }
  return { title: first.title, updated: first.updated || '', rows }
}

// "Wednesday, June 10, 2026 9:06 am - Through games Monday, May 25, 2026"
//   -> "2026-05-25"
export function parseThroughDate(updated) {
  const m = String(updated || '').match(/Through games\s+\w+,\s+(\w+ \d{1,2}, \d{4})/)
  if (!m) return null
  const d = new Date(`${m[1]} 12:00:00 UTC`)
  return isNaN(d) ? null : d.toISOString().slice(0, 10)
}

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const joinKey = (name, team) =>
  `${String(name || '').toLowerCase().replace(/[^a-z]/g, '')}|${String(team || '').toLowerCase().replace(/[^a-z]/g, '')}`

// A column rename on ncaa.com must fail loudly, not write a board of nulls.
function requireColumns(rows, cols, label) {
  const missing = cols.filter(c => !(c in rows[0]))
  if (missing.length) throw new Error(`${label}: missing columns ${missing.join(', ')}`)
}

// ncaa.com writes a tie as Rank "-" ("same as the row above"); carry it down.
function fillTiedRanks(rows) {
  let last = null
  for (const r of rows) {
    if (r.rank == null) r.rank = last
    else last = r.rank
  }
  return rows
}

function baseRow(r) {
  return {
    rank: num(r.Rank),
    name: String(r.Name || '').trim(),
    team: String(r.Team || '').trim(),
    cl:   String(r.Cl || '').trim(),
    pos:  String(r.Position || '').trim(),
    gp:   num(r.Games),
  }
}

export async function buildSaves(gender, div) {
  const label = `${gender} D${div} saves`
  const sv = await fetchCategory(gender, div, SAVE_PCT[gender])
  if (!sv) return null
  // Men's pages say "Team Minutes", women's "Team Min".
  requireColumns(sv.rows, ['Name', 'Team', 'Games', 'Min. Played', 'Goals Allowed', 'Saves', 'Pct.'], label)

  // GAA is a separate list with the same qualifiers. Joined by name + team;
  // a miss leaves the cell blank rather than dropping the goalie.
  await sleep(250)
  const gaa = await fetchCategory(gender, div, GAA[gender]).catch(() => null)
  const gaaBy = new Map((gaa?.rows || []).map(r => [joinKey(r.Name, r.Team), num(r.GAA)]))

  const rows = sv.rows.map(r => ({
    ...baseRow(r),
    min:     num(r['Min. Played']),
    teamMin: num(r['Team Minutes'] ?? r['Team Min']),
    ga:      num(r['Goals Allowed']),
    sv:      num(r.Saves),
    svpct:   num(r['Pct.']),
    gaa:     gaaBy.get(joinKey(r.Name, r.Team)) ?? null,
  }))
  fillTiedRanks(rows)
  return { stat: 'saves', title: sv.title, updated: sv.updated, rows, gaaJoined: rows.filter(r => r.gaa != null).length }
}

export async function buildFaceoffs(div) {
  const fo = await fetchCategory('M', div, FACEOFF_PCT)
  if (!fo) return null
  requireColumns(fo.rows, ['Name', 'Team', 'Games', 'FOs Won', 'FOs Lost', 'FOs Taken', 'Pct.'], `M D${div} faceoffs`)
  const rows = fo.rows.map(r => ({
    ...baseRow(r),
    fow:     num(r['FOs Won']),
    fol:     num(r['FOs Lost']),
    fot:     num(r['FOs Taken']),
    teamFot: num(r['TM FOT']),
    fopct:   num(r['Pct.']),
  }))
  fillTiedRanks(rows)
  return { stat: 'faceoffs', title: fo.title, updated: fo.updated, rows }
}

// The official lists name teams but carry no seo. They use the same short names
// as the NCAA scoreboard, so our own /games docs give a deterministic
// name -> seo map, which is what the frontend links team pages by. Without it,
// name matching alone misses D1 schools like "Eastern Mich." and "UAlbany".
// Keyed `${gender}|${div}|${short name}`. One select() read per season.
async function loadSeoMap(db, season) {
  const snap = await db.collection('games').where('season', '==', season)
    .select('gender', 'div', 'away.name', 'away.teamSeo', 'home.name', 'home.teamSeo').get()
  const map = new Map()
  for (const d of snap.docs) {
    const g = d.data()
    for (const side of [g.away, g.home]) {
      if (side?.name && side?.teamSeo) map.set(`${g.gender}|${g.div}|${side.name}`, side.teamSeo)
    }
  }
  return map
}

// Fetch every board. With dryRun, reports what it would write and touches no
// Firestore -- safe to run locally.
export async function scrapeOfficialLeaderboards({ dryRun = false } = {}) {
  const jobs = []
  for (const div of DIVS) {
    jobs.push(['M', div, () => buildSaves('M', div)])
    jobs.push(['W', div, () => buildSaves('W', div)])
    jobs.push(['M', div, () => buildFaceoffs(div)])
  }

  const db = dryRun ? null : (await import('../firebase.js')).db
  const results = {}
  const seoMaps = {}
  for (const [gender, div, build] of jobs) {
    let board = null
    try {
      board = await build()
    } catch (err) {
      console.error(`[leaderboards] ${gender} D${div} failed: ${err.message}`)
      results[`${gender}-d${div}-?`] = `error: ${err.message}`
      continue
    }
    if (!board) {
      results[`${gender}-d${div}`] = (results[`${gender}-d${div}`] || '') + ' empty(kept existing)'
      continue
    }
    const throughDate = parseThroughDate(board.updated)
    if (!throughDate) {
      results[`${gender}-d${div}-${board.stat}`] = `error: unparseable date "${board.updated}"`
      continue
    }
    const season = seasonForDate(new Date(`${throughDate}T12:00:00Z`))
    const id = `${season}-${gender}-d${div}-${board.stat}`
    if (db) {
      seoMaps[season] ||= await loadSeoMap(db, season)
      for (const r of board.rows) r.teamSeo = seoMaps[season].get(`${gender}|${div}|${r.team}`) || ''
    }
    const docData = {
      season, gender, div, stat: board.stat,
      title: board.title, updated: board.updated, throughDate,
      rows: board.rows,
      source: 'ncaa-official',
      fetchedAt: new Date().toISOString(),
    }
    if (!dryRun) await db.collection('leaderboards').doc(id).set(docData)
    results[id] = board.stat === 'saves'
      ? `${board.rows.length} rows (gaa ${board.gaaJoined}/${board.rows.length}) through ${throughDate}`
      : `${board.rows.length} rows through ${throughDate}`
    await sleep(250)
  }

  console.log(`[leaderboards] ${dryRun ? 'DRY RUN ' : ''}✓`, JSON.stringify(results))
  return { ok: true, dryRun, results }
}
