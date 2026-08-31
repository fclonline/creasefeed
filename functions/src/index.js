// ============================================================================
// functions/src/index.js
//
// Firebase Cloud Functions — CreaseFeed data pipeline
//
// Scheduled functions:
//   pollLiveGames     — every 60s during game hours (live goal-by-goal updates)
//   scrapeBoxScores   — every 5 min during game hours (post-game box scores)
//   scrapePolls       — every Tuesday 10am ET (weekly coaches/media polls)
//   scrapeNightly     — every night at midnight (full season stats refresh)
//
// HTTP functions (for manual triggers / testing):
//   triggerBoxScores  — manually kick off a full scrape
//   triggerPolls      — manually kick off poll scrape
// ============================================================================

import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest  } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { fetchAllBoxScores, backfillBoxScores, processOneBoxScore } from './scrapers/ncaaBoxScores.js'
import { scrapeAllPolls } from './scrapers/polls.js'
import { fetchNcaaScores, backfillScoreboards } from './scrapers/ncaaScores.js'
import { aggregateRecords } from './scrapers/aggregateRecords.js'
import { runStatsInflationDiagnostic } from './diagnostics/statsInflation.js'
import { rebuildPlayerStats, purgeGhostPlayerStats } from './diagnostics/rebuildPlayerStats.js'

// Shared-secret token for the read-only diagnostic endpoint. Set with:
//   firebase functions:secrets:set DIAGNOSTIC_TOKEN
const diagnosticToken = defineSecret('DIAGNOSTIC_TOKEN')

// ── Stripe subscription functions ─────────────────────────────────────────────
export { createCheckoutSession, stripeWebhook, createPortalSession } from './stripe.js'

// ── Box score fetcher — every 2 minutes during game hours ────────────────────
// Pulls scores from NCAA scoreboard, then fetches box scores for live games
// and any recently-final games not yet aggregated.
export const boxScoresJob = onSchedule({
  schedule:       'every 2 minutes',
  timeZone:       'America/New_York',
  region:         'us-east1',
  memory:         '1GiB',
  timeoutSeconds: 540,
}, async () => {
  const now   = new Date()
  const hour  = now.getHours()
  const month = now.getMonth()

  // Jan–June. Widened from Feb–May so preseason and late championship games are
  // covered; running a 2-minute job year-round would just burn invocations.
  if (month < 0 || month > 5) return
  if (hour  < 9 || hour  > 23) return // 9am–11pm ET

  await fetchNcaaScores()
  await fetchAllBoxScores()
  await aggregateRecords()
})

// ── Weekly polls — every Tuesday at 10am ET ───────────────────────────────────
export const scrapePollsJob = onSchedule({
  schedule:  '0 10 * * 2',   // Tuesday 10am
  timeZone:  'America/New_York',
  region:    'us-east1',
  memory:    '512MiB',
}, async () => {
  await scrapeAllPolls()
})

// ── Nightly full refresh — midnight ET ───────────────────────────────────────
export const scrapeNightly = onSchedule({
  schedule:  '0 0 * * *',    // midnight every day
  timeZone:  'America/New_York',
  region:    'us-east1',
  memory:    '1GiB',
  timeoutSeconds: 540,
}, async () => {
  // Year-round. The old Feb–June guard meant schedules posted in Dec/Jan were
  // never picked up, and with the forward lookahead window this job is how a new
  // season's schedule first lands. Once a day is cheap enough to always run.
  console.log('[nightly] Starting full nightly refresh...')
  await fetchNcaaScores()
  await fetchAllBoxScores()
  await scrapeAllPolls()
  await aggregateRecords()
  console.log('[nightly] ✓ Complete')
})

// ── HTTP trigger — manual records aggregation (run once to populate now) ──────
export const triggerAggregateRecords = onRequest({
  region: 'us-east1',
  memory: '2GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerAggregateRecords] Manual records aggregation triggered')
  const result = await aggregateRecords()
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — manual NCAA scores fetch (for testing) ────────────────────
export const triggerNcaaScores = onRequest({
  region: 'us-east1',
  memory: '512MiB',
  timeoutSeconds: 120,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerNcaaScores] Manual NCAA scores fetch triggered')
  const result = await fetchNcaaScores()
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — manual box score scrape (for testing) ─────────────────────
export const triggerBoxScores = onRequest({
  region: 'us-east1',
  memory: '1GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerBoxScores] Manual box score fetch triggered')
  const result = await fetchAllBoxScores()
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — manual backfill (one-time use) ────────────────────────────
// Processes ALL final games in /games regardless of statsProcessed flag.
// Idempotent: skips games already marked statsProcessed=true.
export const triggerBackfill = onRequest({
  region: 'us-east1',
  memory: '4GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerBackfill] Manual backfill triggered')
  const result = await backfillBoxScores()
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — one-time scoreboard backfill ──────────────────────────────
// Fetches scoreboards for every date from start of season to today,
// creating game skeleton docs in /games for any missing games.
// Run this BEFORE the box score backfill if early-season games are missing.
export const triggerScoreboardBackfill = onRequest({
  region: 'us-east1',
  memory: '1GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerScoreboardBackfill] Scoreboard backfill triggered')
  const start = String(req.query.start || '2026-02-01').trim()
  const end   = String(req.query.end   || '').trim() || null
  const result = await backfillScoreboards({ start, end })
  res.json({ ok: true, ...result })
})

// ── HTTP trigger — fetch one game's box score (debug) ────────────────────────
// Usage: GET /testBoxScore?ncaaGameId=6539341
export const testBoxScore = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 60,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  const id = String(req.query.ncaaGameId || '').trim()
  if (!id) {
    res.status(400).json({ error: 'missing ncaaGameId query param' })
    return
  }
  const result = await processOneBoxScore(id)
  res.json({ ok: !result.error, ...result })
})

// ── HTTP trigger — manual poll scrape (for testing) ───────────────────────────
export const triggerPolls = onRequest({
  region: 'us-east1',
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerPolls] Manual poll scrape triggered')
  const result = await scrapeAllPolls()
  res.json({ ok: true, result })
})

// ── HTTP trigger — READ-ONLY stats-inflation diagnostic ──────────────────────
// Reports duplicate /games clusters and flags top-25 leaderboard players whose
// stored aggregate gp exceeds their distinct game appearances. Writes exactly
// one summary doc at /diagnostics/{timestamp}. Never mutates games/playerStats.
//
// Gated by a shared-secret token. Caller must pass DIAGNOSTIC_TOKEN as either
// an `X-Diagnostic-Token` header or a `?token=` query param. Without the
// secret, every request returns 403 — the function does no Firestore work.
// Set the secret once with: `firebase functions:secrets:set DIAGNOSTIC_TOKEN`
export const triggerStatsInflationDiagnostic = onRequest({
  region: 'us-east1',
  memory: '2GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
  secrets: [diagnosticToken],
}, async (req, res) => {
  const expected = diagnosticToken.value()
  const provided = req.get('X-Diagnostic-Token') || req.query.token || ''
  if (!expected || provided !== expected) {
    res.status(403).json({ ok: false, error: 'forbidden' })
    return
  }
  // `task` selects the job. Routed through this one endpoint rather than new
  // functions because setting the public invoker policy on a newly created
  // function needs roles/functions.admin, which this account does not have.
  //   (default)      read-only inflation diagnostic
  //   rebuild-dry    rebuild dry run  -- reports, writes nothing
  //   rebuild-apply  rebuild for real -- REQUIRES &confirm=REBUILD
  const task = String(req.query.task || 'inflation')
  console.log(`[triggerStatsInflationDiagnostic] task=${task}`)
  try {
    if (task === 'rebuild-dry') {
      res.json(await rebuildPlayerStats({ dryRun: true }))
      return
    }
    if (task === 'purge-ghosts-dry') {
      res.json(await purgeGhostPlayerStats({ dryRun: true }))
      return
    }
    if (task === 'purge-ghosts-apply') {
      if (req.query.confirm !== 'PURGE') {
        res.status(400).json({ ok: false, error: 'refusing to delete: pass &confirm=PURGE' })
        return
      }
      res.json(await purgeGhostPlayerStats({ dryRun: false }))
      return
    }
    if (task === 'rebuild-apply') {
      if (req.query.confirm !== 'REBUILD') {
        res.status(400).json({ ok: false, error: 'refusing to write: pass &confirm=REBUILD' })
        return
      }
      res.json(await rebuildPlayerStats({ dryRun: false }))
      return
    }
    const full = req.query.full === '1' || req.query.full === 'true'
    const result = await runStatsInflationDiagnostic({ full })
    res.json(result)
  } catch (err) {
    console.error('[triggerStatsInflationDiagnostic] failed:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// -- NCAA API Proxy -- fixes CORS for sdataprod.ncaa.com ------------------
// The NCAA GraphQL API blocks cross-origin requests from creasefeed.web.app.
// This function proxies requests server-side so the browser can access NCAA data.
//
// Usage: GET https://us-east1-creasefeed.cloudfunctions.net/ncaaProxy?meta=...&extensions=...&queryName=...&variables=...
export const ncaaProxy = onRequest({
  region: 'us-east1',
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  const nodeFetch = (await import('node-fetch')).default

  // Forward all query params to NCAA API
  const params = new URLSearchParams(req.query)
  const ncaaUrl = `https://sdataprod.ncaa.com/?${params}`

  try {
    const ncaaRes = await nodeFetch(ncaaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreaseFeed/1.0)',
        'Accept': 'application/json',
      },
      timeout: 15000,
    })

    if (!ncaaRes.ok) {
      res.status(ncaaRes.status).json({ error: `NCAA API returned ${ncaaRes.status}` })
      return
    }

    const data = await ncaaRes.json()
    res.set('Cache-Control', 'public, max-age=60')
    res.json(data)
  } catch (err) {
    console.error('[ncaaProxy] Error:', err.message)
    res.status(502).json({ error: 'NCAA API request failed', detail: err.message })
  }
})
