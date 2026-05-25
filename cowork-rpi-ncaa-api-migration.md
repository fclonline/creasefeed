# Cowork Task: Migrate NCAA RPI Scraper to NCAA API

## Context

The current `scrapeNCAARPI` function in `functions/src/scrapers/polls.js` uses cheerio to parse HTML from `ncaa.com/rankings/...` with a `[role="grid"]` primary strategy plus a `<table>` fallback. We're replacing it with a direct JSON fetch against the NCAA API wrapper (`ncaa-api.henrygd.me`) — the same wrapper already used by `ncaaScores.js`.

The new endpoint returns richer data than what we currently extract: in addition to rank/team/record/conf/prev, it includes road, neutral, home, and non-Division I records. We'll capture those new fields on the Firestore doc.

**Smoke test already passed.** The API returned 77 teams with full data for D1 men's RPI through April 24. Do not run additional probes — proceed with the implementation.

---

## File to edit

`functions/src/scrapers/polls.js`

## Step 1 — Add a JSON fetch helper

Near the top of the file, immediately after the existing `fetchHtml` function (currently around lines 33–49), add this helper:

```javascript
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
```

## Step 2 — Add the API URL map

Immediately above the existing `NCAA_RPI_URLS` constant (currently around lines 27–30), add a parallel map for the API endpoints. Keep the existing `NCAA_RPI_URLS` exactly as-is — it's still used by `scrapeAllNCAARPI` to write the human-readable URL into the Firestore doc.

```javascript
// ── NCAA RPI API URL map (henrygd JSON proxy) ────────────────────────────────
// Used for fetching ranking data. The NCAA_RPI_URLS map below is preserved
// for the human-readable URL written to Firestore.
const NCAA_RPI_API_URLS = {
  'W-1': 'https://ncaa-api.henrygd.me/rankings/lacrosse-women/d1/ncaa-womens-lacrosse-rpi',
  'M-1': 'https://ncaa-api.henrygd.me/rankings/lacrosse-men/d1/ncaa-mens-lacrosse-rpi',
}
```

## Step 3 — Replace `scrapeNCAARPI`

Delete the entire existing `scrapeNCAARPI` function (currently around lines 592–659) and replace it with the version below. The function signature and return shape stay the same — `scrapeAllNCAARPI` continues to work without modification.

```javascript
// ── NCAA RPI scraper (NCAA API JSON) ──────────────────────────────────────────
// Replaces the cheerio-based scraping of ncaa.com/rankings HTML.
// The NCAA API returns clean JSON with richer fields (road/neutral/home/
// non-Division I splits) than what we previously extracted.
async function scrapeNCAARPI(gender, division) {
  const key = `${gender}-${division}`
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
  } catch (err) {
    console.error(`[polls] NCAA RPI ${key} failed:`, err.message)
  }

  return entries
}
```

## Step 4 — Leave the rest of the file alone

Do **not** modify:

- `NCAA_RPI_URLS` (the human-readable URL map at the top of the file)
- `scrapeAllNCAARPI` — the existing function will work unchanged with the new return shape
- `scrapeAllPolls` — no changes needed
- Any other scraper functions (`scrapeInsideLacrosse`, `scrapeUSILA`, `scrapeIWLCA`, `scrapeUSALacrosseMagazine`)
- `savePoll`, `getWeekNumber`, `makeRankEntry`, `fetchHtml`
- Imports at the top of the file

The only changes are the additions in Steps 1–2 and the replacement in Step 3.

---

## Step 5 — Verify before deploying

From `~/Claude-CoWork/creasefeed/functions`, run this standalone smoke test (no Firebase deploy needed):

```bash
node --input-type=module -e '
const urls = {
  "M-1": "https://ncaa-api.henrygd.me/rankings/lacrosse-men/d1/ncaa-mens-lacrosse-rpi",
  "W-1": "https://ncaa-api.henrygd.me/rankings/lacrosse-women/d1/ncaa-womens-lacrosse-rpi",
};
for (const [key, url] of Object.entries(urls)) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }});
  const j = await r.json();
  const rows = Array.isArray(j?.data) ? j.data : [];
  console.log(`${key}: ${rows.length} teams — top 3: ${rows.slice(0,3).map(r => r.School).join(", ")}`);
  console.log(`  sample row keys: ${Object.keys(rows[0] || {}).join(", ")}`);
}
'
```

**Expected output:**
- `M-1: 77 teams — top 3: Notre Dame, North Carolina, Princeton`
- `W-1: ~100+ teams — top 3 with the current D1 women's leaders`
- `sample row keys: Rank, School, Record, Conf, Road, Neutral, Home, Non-Div I, Prev`

If either gender returns 0 rows or the row keys don't match the expected list, **stop and report back** before deploying.

---

## Step 6 — Deploy

If verification passes, deploy the function:

```bash
cd ~/Claude-CoWork/creasefeed
firebase deploy --only functions
```

Then trigger a manual run of the polls function (whatever the standard manual-trigger path is — HTTP endpoint or `gcloud functions call`) and tail the logs. Confirm the RPI lines now show:

```
[polls] Fetching NCAA RPI M-1 from API...
[polls] NCAA RPI M-1 — 77 teams
[polls] ✓ RPI M-1 saved — 77 teams
[polls] Fetching NCAA RPI W-1 from API...
[polls] NCAA RPI W-1 — XX teams
[polls] ✓ RPI W-1 saved — XX teams
```

Then verify in Firestore:
- `/rpi/rpi-m-d1` document exists with an `entries` array of 77 objects
- Each entry has the new fields: `road`, `neutral`, `home`, `nonDivI`
- `/rpi/rpi-w-d1` document exists with similar shape

---

## Stop conditions

Stop and report back to Deemer if any of the following happen:

- Smoke test returns 0 rows or wrong team names for either gender.
- The API returns row keys other than `Rank, School, Record, Conf, Road, Neutral, Home, Non-Div I, Prev` — schema may have changed and the parser needs adjustment.
- Firestore writes fail or write incomplete data.
- Any unrelated polls (Inside Lacrosse, USA Lacrosse Magazine, etc.) start failing after deploy — those should be untouched but verify in the logs.

Do not attempt fallback strategies, alternate URLs, or re-architecture — this is a focused single-purpose change. The cheerio-based parsing approach has been deliberately removed in favor of the API.

---

## Why this matters

This migration is the lowest-risk piece of a larger initiative to consolidate CreaseFeed's data pipelines onto the NCAA API. Once this lands, the API integration pattern is proven in production and we can apply the same approach to box scores and standings (separate Cowork tasks to follow). Do not introduce additional NCAA API calls in this task — keep the scope tight.
