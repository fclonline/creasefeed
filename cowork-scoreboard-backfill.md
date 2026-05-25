# Cowork Task: Add Scoreboard Backfill for Missing Early-Season Games

## TL;DR

Two random D1 men's games from 2/28/2026 (gameIds 6539506 and 6538794) return `game doc ncaa-NNNNNN not found` from `testBoxScore`. The `/games` collection is missing most of the early-season data because `ncaaScores.js` only runs forward — it scrapes today's scoreboard, not historical dates.

Result: most of the 2026 season's games aren't in Firestore. Box scores can't be fetched for games that don't exist. Mason Cook (Loyola D1 men's attacker) has stats from only 6 of his 16 games because the other 10 game docs were never written.

Fix: add a one-time scoreboard backfill function that loops through every date in the season and every gender/division combination, fetching scoreboards from `ncaa-api.henrygd.me` and writing game skeleton docs using the existing `fetchAndWriteScores` logic. After scoreboards are backfilled, re-run the existing `triggerBackfill` to add box scores to all the newly-created game docs.

This is purely additive — no logic changes to existing scoreboard or box score code, no destructive operations, no deletions.

---

## Files affected

**UPDATE**:
- `functions/src/scrapers/ncaaScores.js` — add a new exported function `backfillScoreboards` that loops over dates and calls the existing per-date fetch logic
- `functions/src/index.js` — add a new HTTP trigger `triggerScoreboardBackfill`

Do not modify `ncaaBoxScores.js`. Do not modify anything else.

---

## Step 1 — Inspect `ncaaScores.js` to understand the existing pattern

First, open `functions/src/scrapers/ncaaScores.js` and locate the existing `fetchNcaaScores` (or equivalent main entry-point) function. It currently fetches scoreboards for "today" — it likely:

1. Builds a date string for today in `YYYY/MM/DD` format
2. Loops through gender×division combinations (men/women × d1/d2/d3)
3. For each combo, hits `https://ncaa-api.henrygd.me/scoreboard/lacrosse-{gender}/{div}/{YYYY}/{MM}/{DD}`
4. Parses the JSON response
5. For each game in the response, writes a doc to `/games/ncaa-{gameID}` with team names, scores, conference, status, etc.

Identify the helper function (or inline block) that handles "fetch one date's scoreboard for one gender/division and write the game docs." We'll reuse it.

**If there isn't already a reusable per-date function**, that's fine — we'll extract one in the next step. If there IS one (commonly named something like `fetchAndWriteScoresForDate` or similar), even better — we just call it in a loop.

Report back what you found before proceeding. Specifically tell Deemer:
- Name of the main entry-point function
- Whether the per-date fetch logic is already factored out into its own function (and if so, its name and signature)
- The exact URL pattern used (the gender code, division code, date format)

## Step 2 — Add the `backfillScoreboards` function

At the bottom of `functions/src/scrapers/ncaaScores.js`, add a new exported function. The function should:

1. Accept an optional date range. Default to `start: '2026-02-01'`, `end: today`.
2. Loop day-by-day from start to end.
3. For each date, loop over the 6 gender/division combinations:
   - `lacrosse-men/d1`
   - `lacrosse-men/d2`
   - `lacrosse-men/d3`
   - `lacrosse-women/d1`
   - `lacrosse-women/d2`
   - `lacrosse-women/d3`
4. For each combo, call the existing per-date scoreboard logic.
5. Throttle: 250ms between requests to stay under the upstream API's rate limit.
6. Track results: total dates processed, total game docs written, total errors.
7. Log a summary at the end like the box score backfill does.

The function should be idempotent. If a game doc already exists with `ncaa-{gameID}`, the existing fetch logic should `set` with `{ merge: true }` so it just updates fields rather than overwriting. Verify that the existing code uses `merge: true` before proceeding — if it doesn't, that's a problem to flag back to Deemer rather than fix unilaterally.

If you find that the existing per-date logic isn't extracted into its own function, refactor it minimally:
1. Pull the per-date fetch+write code into a new helper like `fetchAndWriteScoresForDate(dateStr, gender, div)`.
2. Have the existing main entry-point call that helper for "today".
3. Have the new `backfillScoreboards` call that same helper in a loop over dates.

This refactor must not change behavior for the today-only path. If you're not confident in doing it cleanly, stop and report back.

**Throttling and timeout discipline:**
- 250ms delay between scoreboard fetches
- Total expected requests: ~110 days × 6 combos = ~660 requests
- At 250ms each = ~165 seconds, well within the 540s function timeout
- One run should be enough to cover the entire season

## Step 3 — Add the `triggerScoreboardBackfill` HTTP trigger

In `functions/src/index.js`, after the existing `triggerBackfill` block, add a new HTTP trigger:

```javascript
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
```

And update the import at the top of `index.js`:

**Find:**
```javascript
import { fetchNcaaScores } from './scrapers/ncaaScores.js'
```

(The exact name may differ — whatever the current `ncaaScores.js` exports.)

**Replace with:**
```javascript
import { fetchNcaaScores, backfillScoreboards } from './scrapers/ncaaScores.js'
```

Don't touch any other imports or functions. Don't change any existing behavior.

## Step 4 — Smoke test (single date, before deploy)

From `~/Claude-CoWork/creasefeed/functions`, run a quick test to verify the per-date URL pattern works against the NCAA API:

```bash
node --input-type=module -e '
const r = await fetch("https://ncaa-api.henrygd.me/scoreboard/lacrosse-men/d1/2026/02/28", {
  headers: { "user-agent": "Mozilla/5.0" }
})
const j = await r.json()
console.log("date 2/28 D1 men: " + (j.games?.length || 0) + " games")
console.log("first 3 gameIDs:", (j.games || []).slice(0,3).map(g => g.game?.gameID).join(", "))
'
```

**Expected:** Around 30 games, first three gameIDs including 6538794 (Cleveland St. game from our diagnostic). If this fails or returns 0 games, the upstream changed something and we need to investigate before deploying.

## Step 5 — Deploy

```bash
cd ~/Claude-CoWork/creasefeed
firebase deploy --only functions:triggerScoreboardBackfill
```

Watch for `Successful create operation` on the new function. If there are any deploy errors related to imports, the `ncaaScores.js` export of `backfillScoreboards` is missing or misspelled — fix and redeploy.

## Step 6 — Run the scoreboard backfill

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/triggerScoreboardBackfill"
```

Watch the function logs in Firebase console. Expected behavior:
- Date-by-date progression visible in logs
- ~660 total scoreboard fetches
- Hundreds of new game docs written to `/games`
- Summary block at the end showing total games written and any errors

A clean run should write somewhere between 3,000–5,000 new game docs (we're currently at 5,138 in the collection but most are forward-cron writes from late season; backfill catches the early-season gap).

If you see lots of 502 errors from `ncaa-api.henrygd.me` (more than ~10%), the upstream is being rate-limited — bump the throttle from 250ms to 500ms and retry.

## Step 7 — Verify a previously-missing game now exists

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/testBoxScore?ncaaGameId=6539506"
```

This is the Loyola-Colgate 2/28 game. Before this fix, it returned `"reason":"game doc ncaa-6539506 not found"`. After scoreboard backfill, it should now return `{"ok":true,"success":true,"playerCount":NN,...}` because the game doc exists AND the testBoxScore endpoint will also fetch box scores for it as a side effect.

If you still see "not found", scoreboard backfill didn't catch 2/28 — check the logs for that date.

## Step 8 — Re-run the box score backfill

Now that the games are in place, fill in box scores for all of them:

```bash
curl "https://us-east1-creasefeed.cloudfunctions.net/triggerBackfill"
```

Expected: thousands of new "need processing" games (whatever scoreboard backfill added). Run will likely take 2-3 invocations (each ~9 minutes) to clear.

After the box score backfill completes:

```bash
# Check Mason Cook — should now be at gp: 16, goals: 59, assists: 12, points: 71
# Open Firestore → playerStats → ncaa-43717-mason-cook
```

If Mason Cook hits 16 games and 59 goals, the entire data pipeline is now end-to-end complete for the 2026 season.

---

## Stop conditions

Stop and report to Deemer if:

- Step 1 finds that `ncaaScores.js` doesn't have a clean way to extract a per-date helper, or the existing code uses `set` without `{ merge: true }` (would risk overwriting existing data)
- Step 4 smoke test returns 0 games or unexpected response shape
- Step 5 deploy fails
- Step 6 shows >10% error rate across scoreboard fetches
- Step 7 still returns "not found" for a date that scoreboard backfill should have caught
- Step 8 box score backfill error rate suddenly spikes above the previous ~32 baseline of persistent 502s

For any of these, paste the relevant log lines or error output.

---

## What success looks like

When this task is complete:

- `/games` collection has game docs for every date from 2026-02-01 to today, across all 6 gender×division combinations
- `triggerScoreboardBackfill` is deployed as a permanent HTTP endpoint (idempotent — safe to re-run anytime if data goes missing)
- Box score backfill has processed all the newly-found games
- `/playerStats` now reflects full-season totals for every player who appeared in any 2026 game
- Mason Cook spot-check: `gp: 16`, `goals: 59`, `assists: 12`, `points: 71`
- Future games continue to populate automatically via the existing 2-minute cron

The old `m-*` and `w-*` Sidearm docs remain orphaned in both `/games` and `/playerStats` per the existing "let stale docs age out" policy. Cleanup of those is a separate task.
