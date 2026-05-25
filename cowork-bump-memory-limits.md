# Cowork Task: Bump Memory Limits on Backfill and Box Score Cron

## TL;DR

The `triggerBackfill` function is crashing with `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory` after loading all 5,138 final game docs into memory at once. Each game doc now contains a full `playerStats` array (~50 entries with ~40 fields each), which inflates total memory beyond the current 1GiB allocation.

Fix: bump `triggerBackfill` from 1GiB → 4GiB and `boxScoresJob` from 512MiB → 1GiB. Redeploy just those two functions. No logic changes needed.

This unblocks the season backfill which is partially complete (started at 3,009 games to process, currently down to ~690 remaining across multiple timeout-killed runs).

---

## File to edit

`functions/src/index.js`

## Step 1 — Bump `triggerBackfill` memory

In `functions/src/index.js`, locate the `triggerBackfill` export block. It currently looks like:

```javascript
export const triggerBackfill = onRequest({
  region: 'us-east1',
  memory: '1GiB',
  timeoutSeconds: 540,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  console.log('[triggerBackfill] Manual backfill triggered')
  const result = await backfillBoxScores()
  res.json({ ok: true, ...result })
})
```

Change **only** the `memory` line:

```javascript
  memory: '4GiB',
```

Leave `timeoutSeconds: 540` as-is — that's a separate (timeout) constraint we're not solving here, just memory.

## Step 2 — Bump `boxScoresJob` memory

In the same file, locate the `boxScoresJob` export block. It currently looks like:

```javascript
export const boxScoresJob = onSchedule({
  schedule:       'every 2 minutes',
  timeZone:       'America/New_York',
  region:         'us-east1',
  memory:         '512MiB',
  timeoutSeconds: 540,
}, async () => {
```

Change **only** the `memory` line:

```javascript
  memory:         '1GiB',
```

This is a preventive bump — the cron only processes the last 7 days so memory pressure is lighter, but it's growing as more games get processed and the playerStats arrays add up.

## Step 3 — Do not change anything else

- Do NOT modify `ncaaBoxScores.js`
- Do NOT modify the query logic
- Do NOT change `timeoutSeconds`, `concurrency`, or any other settings
- Do NOT touch any other functions (`ncaaProxy`, `stripeWebhook`, etc.)

Two lines total change across the entire codebase.

## Step 4 — Deploy ONLY the two changed functions

```bash
cd ~/Downloads/Claude-CoWork/creasefeed
firebase deploy --only functions:triggerBackfill,functions:boxScoresJob
```

This is critical — use the comma-separated function names to limit the deploy. A full `firebase deploy --only functions` would redeploy everything, which is unnecessary and adds risk.

Expected output: two `Successful update operation` lines, one for each function. Deploy should take 1-2 minutes.

If you see deploy errors, paste them and stop — do not retry.

## Step 5 — Verify the deploy worked

Check the Firebase console → Functions page. Both `triggerBackfill` and `boxScoresJob` should show recent updated timestamps.

Optionally, you can click into each function and verify the memory setting now shows 4GiB / 1GiB respectively in the "Configuration" or runtime details. This is informational only — the deploy output already confirms the change.

## Step 6 — Re-run the backfill

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/triggerBackfill"
```

Don't wait for curl to return — it may timeout locally after 9 minutes even if the function succeeds in the background. Instead, watch Firebase console → Functions → `triggerBackfill` → Logs.

What you want to see:

```
[triggerBackfill] Manual backfill triggered
[ncaa-boxscores] BACKFILL: scanning all final games...
[ncaa-boxscores] BACKFILL: 5138 final games found, X need processing
```

Followed by a long stream of worker processing logs, then the final summary block:

```
[ncaa-boxscores] ═══════════════════════════════════════
[ncaa-boxscores] ✓ Run complete
[ncaa-boxscores]   Total:    X
[ncaa-boxscores]   Success:  X
[ncaa-boxscores]   Skipped:  0
[ncaa-boxscores]   Errors:   0-something
[ncaa-boxscores] ═══════════════════════════════════════
```

Critically, you should NOT see this anymore:

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

If you see the heap error again with 4GiB allocated, stop and report — we have a different problem and need to switch to a streaming approach instead.

## Step 7 — Run a second time if needed

If the first run's summary shows `Errors: 0` but `Total < games-needing-processing`, it likely hit the 9-minute timeout before finishing. The function is idempotent — successfully-processed games are marked `statsProcessed: true` and skipped on the next run.

Just kick off another backfill:

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/triggerBackfill"
```

Repeat until you see `0 need processing` in the logs.

---

## Stop conditions

Stop and report to Deemer if:

- Step 4 deploy fails with any error
- Step 6 still throws `FATAL ERROR: Reached heap limit` even with 4GiB memory (means the underlying problem is unbounded array accumulation, not just allocation size — we'd need a different fix)
- Backfill processes successfully but error count exceeds ~5% of games processed
- The backfill never seems to converge (each run processes the same number of games, suggesting writes aren't sticking)

For any of these, paste the error output and the relevant log lines.

---

## Context (for understanding, not action)

The backfill is the final step in migrating from the legacy WMT/Sidearm pipeline to NCAA API box scores. So far:
- RPI migration: shipped
- Score migration: shipped (`ncaaScores.js` writing clean game docs)
- Box score pipeline: shipped (creates `playerStats` array on each game doc and aggregates to `/playerStats/{playerId}`)
- Forward cron processing recent games: working
- Backfill of historical 2026 season: in progress, partially complete, currently blocked by OOM

After this fix and a successful backfill, the migration is functionally complete and the next workstream is frontend updates to prefer `ncaa-*` doc reads over legacy `m-*`/`w-*` formats.
