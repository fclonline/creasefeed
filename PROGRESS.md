# CreaseFeed — Progress Log

A running log of work on **CreaseFeed** (creasefeed.com). Newest entries on top.
Share this doc with Claude Code or Claude Cowork to bring them up to speed quickly.

**Stack:** React + Vite · Firebase (Auth / Firestore / Hosting) · Cloud Functions (NCAA data pipeline).
**Deploys:** run directly via `firebase deploy` (hosting, and `--only functions`/`firestore:rules` when those change). Batch changes, deploy when reviewed.

---

## 2026-09-01

### Shipped to production

**Draw-controls leaderboard (women's) — validated against ncaa.com**
- New women's-only board on the Stats page. TABS entries carry a `genders` field so a board only renders where the data exists: men's play face-offs, which the NCAA box score does not carry at all, so every men's doc is 0 there.
- The index deploy was made purely additive first. `firestore.indexes.json` was missing two indexes that exist in prod, so a normal deploy would have silently deleted them. Added those, then deployed — exactly 1 index deleted, the stale `playerStats (gender,season,div,sv)`.

**Two silent data-loss bugs, catchable only against an external reference**
- **`contributed()` accepted only 10 of the 31 fields it accumulated**, and `drawControls` was not one. A draw specialist who won 19 draws but took no shot, scooped no ground ball and committed no turnover was indistinguishable from a bench player who never dressed, and her entire line was discarded on write. Ayla Galloway appeared in **all 20** Mercer box scores and was credited with **1 game / 11 draws**.
- **Blank starters weren't counted.** A player who starts and records nothing still played. `participated` cannot detect this — it is set on **100% of blank lines** (118 of 118 sampled), so counting it would add ~15 phantom games per game. `starter` is the real signal (~4.5 blank starters/game vs ~10.5 blank non-starters, who may never have entered).
- Fixed in `functions/src/statFields.js`, which now owns the counter list **and derives the gate from it** — a field can never again be accumulated without also counting as evidence the player took the field. Both the live aggregator and the rebuild import it, so they cannot drift.
- Rebuild applied: **27,244 written, 6,906 players gaining games, 0 losing any, 407 newly created** (their every game had failed the gate, so no doc ever existed). Contrast the inflation rebuild: 20,227 down, 0 up.

**Result vs ncaa.com:** 4 of 5 reference players match exactly, to two decimals on per-game (Galloway 20g / 187dc / **9.35**). The 5th, Racheli Levy-Smith, is a genuine source omission — she is absent from the Holy Cross/UMass 2026-02-06 box score entirely, so her 11 draws that day do not exist in the feed.

**Frontend no longer reads retired Sidearm docs.** 280 legacy docs carried a `gameDate` and so matched the date-filtered queries; 169 had placeholder team names — the "AWAY · LEHIGH" artifacts (Lehigh 19x, Penn State 37x, Princeton 32x). Only 6 duplicated a real game; 274 were pure phantoms. This was the stated precondition for purging the legacy `/games` docs.

**Ghost purge applied** — 2,821 orphan `playerStats` docs deleted (legacy ids, zero canonical appearances). `zeroGameCandidates` is now 0.

**Season-aware pipeline (2027-ready).** `SEASON` was hardcoded in six backend files plus the frontend. `functions/src/season.js` is now the single definition; `aggregateRecords` resolves the season **from the data** (newest season with a final game) and publishes it to `/config/site`, which the frontend reads — so the rollover needs no redeploy. Deliberately not `currentSeason()`, which is already '2027' in the offseason and would have emptied `/records` and blanked every W-L. Schedules now load on a 14-day forward window (was today+yesterday only), throttled in waves of 4; `scrapeNightly` runs year-round (was Feb–June, which would never have seen a schedule posted in Dec/Jan).

### Parked / follow-ups
- **Fall ball is not in the NCAA API** — verified: every fall date returns 0 games while spring dates return games. Needs a different source. The season model already handles it — an Oct 2026 game resolves to the 2027 season.
- **Goalkeeper board still withheld.** The 7-field goalie schema gap was real and is now captured, but that doesn't create values the source doesn't send: per-player goalie values are zero-filled for women's and ~33% present for men's.
- **Men's leaderboards have NOT been externally validated.** The same gate bug affected `freePositionShots` and penalty-only lines for men too. Compare points / ground balls against ncaa.com before the 2027 season.
- Team-defense stat; D2/D3 no-record split (held pending the variant-vs-no-data split); IAM `roles/functions.admin` (Deemer's side).

---

## 2026-08-27

### Shipped to production
- **Killed the fabricated goalkeeper leaderboard.** The Goalkeepers tab was serving 100% invented players (Tyler Coon/Army, Liam Entenmann/Duke...) from `mockData.js`. Cause: the query ordered by `sv`, a field that does not exist on `playerStats` (real field is `saves`), so it returned zero rows and silently fell back to mock. Mock fallback is now gated to `import.meta.env.DEV`; production shows an honest empty state instead of fake rows.
- **Fixed blank Team / Position columns.** Aggregator writes `teamName`/`position`; frontend was reading `team`/`pos`. Also added a `normPos()` map so raw NCAA codes (`a`, `A`, `gk`, `g`, `Goalkeeper`, `*`, ``) render as ATT/MID/DEF/GK or a dash, not junk.
- **Fixed GAA — was wrong by 60x.** `goalieMinutes` is a misnomer: the NCAA box score reports goalie time in **seconds** and the aggregator stores it verbatim. GAA was computed as `ga * 60 / secs`, printing 0.19 instead of ~11.7. Now `ga * 3600 / secs`. Verified live: GAA reads 9–17.
- **D1/D2/D3 toggle now filters stats.** The deployed query had no `div` clause, so all three divisions showed the same national list. Required indexes were already deployed back in May.
- **Honest source labelling.** The indicator read "Loading..." over fully-loaded real data (the hook's new `ncaa` source had no label case). Now reads "NCAA box scores — season totals unverified", with cases for `empty`/`error`.

### Data accuracy — root cause FOUND, cleanup still gated
Deployed the v3 read-only diagnostic (`triggerStatsInflationDiagnostic`, `?full=1` returns per-player rows) and ran it against all 9,803 season game docs.

**The duplicate-games theory is refuted.** Only 48 duplicate clusters / 51 extra docs exist, and legacy `{school}-*` docs were almost never aggregated (`processedByPrefix`: ncaa 7531, legacy-m 14, legacy-w 91). Not the cause.

**Actual cause: the same game doc is aggregated more than once.** In the diagnostic output `distinctGames_canonical == distinctGames_raw` for essentially every flagged player — so no duplicate docs are contributing — yet `storedGp` far exceeds both:

| Player | Team | stored gp | distinct games | ratio |
|---|---|---|---|---|
| Paige Murphy | Maryville (MO) | 37 | 22 | 1.68 |
| Mason Bellinger | Chris. Newport | 35 | 21 | 1.67 |
| Chloe Humphrey | North Carolina | 31 | 21 | 1.48 |
| Matthew Tully | Cornell | 18 | 16 | 1.13 |

25/25 top-goals and 23/25 top-saves rows are flagged. `aggregateSeasonStats` is guarded by a non-transactional read-modify-write on the game doc's `statsProcessed` flag ([ncaaBoxScores.js:225](functions/src/scrapers/ncaaBoxScores.js:225)) while `boxScoresJob` fires **every 2 minutes** — overlapping invocations both read `statsProcessed: false` and both increment. The partial, uneven ratios (1.1x for D1 men, ~1.7x for D2/D3 women) are the signature of a race, not of duplication.

### Parked / follow-ups
- **Cleanup remains gated on Deemer** per the standing rule: zero out affected aggregates and re-accumulate from canonical survivors (NOT decrement, NOT delete-only). Now unblocked to design, since the cause is known.
- **Fix must precede any rebuild:** make `statsProcessed` a real transaction (or key idempotency per gameId+playerId), or the rebuild re-inflates in Feb 2027.
- **1,828 game docs (18.6%) have no `gameDate`** — excluded from cluster analysis entirely, and a blind spot in any date-keyed dedupe. Separate issue worth its own pass.
- **Season totals are still inflated on the live site.** They're now labelled unverified rather than hidden — Deemer's call whether to hide the GP-derived columns until the rebuild.
- Women's team records still gated to `—` on Teams (see `creasefeed-team-records`).
- Public HTTP triggers still `invoker:'public'` with no auth (`triggerBackfill`, `triggerScoreboardBackfill`, ...). Separate session.

### Notes
- Scrapers have been idle since ~end of May (`boxScoresJob` is gated to Feb–May), so nothing is actively getting worse — this is the clean window to rebuild aggregates.

---

## 2026-08-31

### Shipped to production

**Team records — now accurate for both genders**
- **Excluded the abandoned Sidearm scraper's docs from `aggregateRecords`.** `/games` holds 9,803 docs from two sources: ncaa-api (7,695) and `sidearm-boxscore-header` (2,108). The Sidearm docs are junk — **1,828 have no `gameDate` at all** (100% of every missing-date doc in the collection; ncaa-api has zero), **none have a `teamSeo`**, and **814 name the home team literally `"Home"`**. All were marked `final`, so they counted toward records. Because they carry no date, their dedupe key never collided with the real dated key and they were double-counted. Excluding them: women **749→542 teams, max 102→23 games, 0 teams over 24**; men **534→400, max 67→24**. Stanford W went 41 games → 22.
- **Un-gated women's records** on the Teams page. They'd been forced to `—` since May pending exactly this cleanup.
- **Fixed split team buckets.** `aggregateRecords` keyed teams on `seo || name`, but `teamSeo` is present on some game docs and missing on others for the same team — splitting **20 teams** into two records each. Penn State W existed as both 12-7 (seo `penn-st`) and 0-1 (bare name), and the frontend's index let the stray 0-1 win. Now keyed on the normalized name with seo as metadata. 20 splits → 0. Penn State W correctly reads 12-8.

**Teams page**
- **Never show men's and women's together.** The page's own gender filter defaulted to `All` and ignored the global toggle, so every school appeared twice with no gender column to distinguish them — Georgetown as 11-5 *and* 12-6, Denver as 5-8 *and* 16-4. Read as duplicate rows. The `All` option is gone and the filter now follows the global toggle.
- **Fixed record matching — 149 of 709 programs (21%) were showing no record.** The NCAA API abbreviates "State" to "St." (Penn St., Kennesaw St., Florida St.) and suffixes some seos with a state code (`albany-ny` for UAlbany, which is why Albany was blank). Two deterministic folds in `programs.js` — trailing `st`→`state`, and stripping a trailing state code off the seo — take **D1 to 0 unmatched men's / 1 unmatched women's**, plus a two-entry alias map for Central Connecticut and Southern New Hampshire. Fuzzy matching was tested and rejected: it mismatched Stonehill→Seton Hill, NYIT→NJIT, Daemen→Dean, Fort Lewis→Lewis. Wrong records are worse than blank ones.

### Diagnostics
- **Ran the stats-inflation diagnostic** (deployed but never once invoked since May). It **refuted** the standing theory: legacy docs contributed only 105 aggregated docs, and there are just 48 duplicate clusters — nowhere near enough. Four spot-checked players had **zero** duplicate game docs on their teams yet were all inflated, at **varying ratios (1.12x–1.72x)**, so totals must be rebuilt from game docs, not scaled. Mechanism is the double-aggregation race in `ncaaBoxScores.js`: `statsProcessed` is written *after* aggregation, and `boxScoresJob` ran every 2 minutes.

### Parked / follow-ups
- **~100 programs still show no record, all D2/D3.** Two causes, not yet separated: real name variants needing alias entries ("Southern N.H."), and schools with no games in the data at all (College of Saint Rose, Adams State, King return nothing under any name).
- **The 2,108 Sidearm docs are still in Firestore**, now inert since they're filtered at aggregation. Purging them is optional cleanup, not a fix.
- ⚠️ **Firestore REST encodes integers as `{"integerValue": "7"}` — a JSON string.** Any local analysis script must handle that branch or every score silently becomes a string and comparisons go lexicographic. This produced a false "inverted records" alarm this session. The app uses the Admin/Web SDK and gets real numbers; there is no such bug in the product.

**Stats leaderboards — inflation fixed at the source, then rebuilt**
- **Made aggregation idempotent.** `processOneBoxScore` read `statsProcessed`, aggregated, then set the flag — three separate steps. `boxScoresJob` fires every 2 min and slow runs outlive their interval, so runs overlapped: both read `false`, both aggregated, every `FieldValue.increment` applied twice. That is the whole inflation. The claim is now a transaction. Also **stopped swallowing the aggregation batch failure** — it was caught and logged, the caller marked the game processed anyway, and that game's stats were lost for the season with nothing to indicate it.
- **Rebuilt all season totals** from 7,527 canonical `ncaa-*` games (dry run first). **26,531 players written; 20,227 corrected, 0 under-counted, 0 invented.** Every correction downward — the exact fingerprint of a double-count. Verified against four hand-computed players: Spallina 19/35/52, Humphrey 21/109/49, Tully 16GP/155sv, Murphy 22/113/21 — all exact. Worst cases were whole D2 women's teams at ~2.3x (Tampa: 43 GP → 19).

**Goalkeeper leaderboard withheld — the source data isn't there**
- Investigated whether women's goalie stats were a parsing bug. **They are not.** The NCAA API returns a **zero-filled per-player goalie block** for women's games. Sampled random D1 finals: player-level goalie saves present in **0 of 18 women's** and **4 of 12 men's (33%)**; team-level present in **100% of both**. `/individual-stats` is a 422 — there is no per-player goalie source in this API.
- Consequence: only **12 women's D1 goalies league-wide** have any saves, and **35 of 75 men's** are under 4 saves/game. Ranking by season totals would rank "goalies whose teams happened to report". The tab now shows an honest hold message instead.

### Parked / follow-ups (added)
- **2,822 ghost `playerStats` docs** (legacy `m-*`/`w-*` ids, null teamName) still need purging — they hold 20 of the top 25 slots on the women's D1 saves board. Dry-run-first `task=purge-ghosts` is the plan.
- **Team-defense stat** from `teamStats.goalie` (100% coverage, already stored) is the agreed replacement for the goalkeeper board.
- **IAM gap:** `triggerBoxScores` / `triggerBackfill` / `testBoxScore` can't deploy — the account lacks `roles/functions.admin` to set the public invoker policy. Scheduled jobs are unaffected.

**Goalie / possession data — settled what the NCAA API can and cannot give**
- **Schema gap closed.** `parsePlayer` kept 5 of the goalie block's 12 fields; the other 7 (gamesPlayed, losses, combinedShutouts, PP/SH/EN/shootout goals-allowed) are now captured, plus 5 extra team-level goalie fields. Also fixed `isGoalie`, which was always false for men's (it tested `position === 'gk'`, but men's use `'g'`).
- **Coverage is a values gap, not a schema gap.** Re-measured over 60 games across all six combos: non-zero player-level goalie saves in M D1 30%, M D2 20%, M D3 10%, **0% women's at every division** — 6/60 overall, team-level 60/60. The fields are always present and correctly parsed; they are valued `"0"`. Reading more fields cannot create data, so the goalkeeper board stays withheld.
- **Face-offs and clearing are absent from the API entirely** — exhaustive key scan over 12 games, both genders, found no face/faceoff/clear/ride key anywhere in the 37-key player or 46-key team universe. The one possession-family key is `drawControls`, which is captured AND populated (30/40 top women's D1 scorers; Ella Rishko 99 draws in 18 GP). **WMT is therefore needed only for men's face-offs and clearing. A women's draw-controls leaderboard is shippable today with no new source.**

**Cleanup completed**
- **Ghost purge applied** — 2,821 legacy `m-*`/`w-*` playerStats docs deleted. Verified: 26,532 docs remain, **0 legacy ids left**. The one doc above the 26,531 with canonical appearances is an `ncaa-`-id doc the guard deliberately spared.
- **Season rollover verified live** — `aggregateRecords` resolved `"season":"2026"` (not the calendar-derived 2027) and wrote `/config/site`, which the frontend now reads.

### ⭐ Next session — Deemer's priority
> "we need to find out how to get more of these player stats across levels more streamlined and efficient"

The NCAA API is the only player-stats source today and it's structurally insufficient (see the goalie gap above; ~100 D2/D3 programs also have no games at all). Settle the source question — NCAA stat pages, school/Sidearm sites, conference feeds, or paid — before building more stats features. It has to cover D1/D2/D3 x men's/women's as one pipeline. The coverage gaps are worst exactly where competitors are weakest.

## 2026-05-28

### Shipped to production
- **Fixed free-account login (email/password).** It was entirely non-functional: `useAuth` only had Google sign-in, and the modal's password field had no state + the "Continue with Email" button had no handler. Added `signUpEmail`/`signInEmail` (create + sign-in, optional display name) to `useAuth`, and rebuilt the modal email form: controlled inputs, working submit, **Create account ↔ Sign in toggle**, loading state, and plain-language Firebase error messages (incl. Google popup/unauthorized-domain). Free profile (`pro: false`) is created via the existing `onAuthStateChanged` path — separate from Pro. Tested live; Email/Password provider confirmed enabled.
- **Fixed "edit teams" wiping past follows.** The editor (`Onboarding`) opened with an empty selection and saving *replaced* the whole followed list — so adding one team erased the rest. It now seeds the selection from your current follows (handles async load), so you start from your set and actively unselect to remove. Verified: add → remove → save retains the untouched teams.
- **My Feed gender toggle + per-game gender labels.** Added a Show: All / Men's / Women's toggle (only when the feed has both genders). In the "All" view each game is tagged MEN'S (green) / WOMEN'S (purple) via an optional `showGender` prop on `GameCard`. Hardened feed game-matching against missing team names.

### Notes
- Throwaway test user `cf-test-20260528@example.com` created during auth testing — safe to delete in Firebase Console → Authentication.

### ⏭️ Next session (Deemer's pick-up point)
- **Scraping & data accuracy** for scores AND **stats**. Make the data pipeline bulletproof and double-check displayed data is correct: audit the scrapers (`functions/src/scrapers/`), the `playerStats` aggregation behind the Stats leaderboards, and the known women's `games` duplicate/fragmentation issue (women's team records gated to `—` until cleaned up).

### Queued todos
- **Show game dates in My Feed** — feed groups by Live/Final/Upcoming but doesn't show each game's date; add it (games carry `g.date`).

### Repo / setup
- Connected the working folder `~/Downloads/Claude-Code/creasefeed` directly to git/GitHub (it wasn't under version control); this is now the single working copy. Disabled auto-deploy-on-push (workflow is manual-only).

---

## 2026-05-24

### Shipped to production

**Mobile & navigation**
- Added a **bottom tab bar** so phones can navigate between pages (previously the nav links were hidden on mobile with no replacement — users were stuck on one page).
- Fixed the **context bar overflow** on mobile (gender/division/season was spilling off-screen).

**Filters**
- Built a reusable **collapsible filter**: the long conference chip grid and the top Men's/Women's + Division toggles now collapse to a single pill that expands on tap.
- **Schedule gender redundancy fix** — the global top gender toggle did nothing on the Schedule page (it has its own filter). Hid the redundant top toggle there, defaulted the in-page filter to the user's global choice, and added a "showing men's & women's" cue when "Both" is selected.

**Theming**
- Switched to a **light theme as the default** (dark was hard to read) and added a **dark-mode toggle** in the navbar — choice persists per browser, with a no-flash script on load. Whole app was already tokenized with CSS variables, so this was clean.

**Scores & Schedule**
- Added **Home / Away labels** consistently on Scores cards, Schedule cards, and the game modal.
- Reworked **Schedule cards** so each team's score sits on the same row as the team.
- Slowed the **top ticker** to a calm, constant pace (was whipping by — duration now scales with the number of games).
- Fixed a **date/division bug**: Saturday's games were showing on Sunday because the `useScores` hook never passed the selected date or division to the Firestore query. Fixing it also repaired the D1/D2/D3 toggle, which had been inert.

**Teams page**
- Added a **collapsible conference accordion** (collapsed by default; auto-expands when searching or filtering to one conference).
- Added **men's team records** (W-L). Confirmed live that the NCAA API has **no lacrosse standings endpoint** and the scoreboard carries no record field, so records are computed by counting finalized games. A new Cloud Function `aggregateRecords` tallies them into `/records/{M,W}` and runs after the scores cron + nightly; the Teams page does one read.

**Version control & CI**
- Restored the project to **git/GitHub** after discovering the local working folder wasn't under version control — GitHub was ~2 months stale (last commit 2026-03-22) and missing the entire `functions/` backend. Captured all accumulated work (source + backend + firestore config + planning docs) in commit `f290896` on `main`. Added `*.xlsx`/`*.numbers` and local tooling to `.gitignore`; kept the markdown planning docs versioned.
- **Disabled auto-deploy on push** — `.github/workflows/deploy.yml` is now `workflow_dispatch:` only (manual trigger from the Actions UI), so pushes no longer fire a Firebase deploy. Manual `firebase deploy` remains the primary path. (The Action also needs repo secrets configured before a manual run can succeed.)

### Parked / follow-ups
- **Women's team records** are intentionally shown as `—` for now. Men's game data is clean; the women's `games` collection is duplicated/fragmented (mixed sources, backfill dupes) and produced wrong totals. Needs a women's data-pipeline cleanup before re-enabling. (Details in the `creasefeed-team-records` memory note.)

### Notes for next session
- Teams page still shows the duplicate top gender/division toggles (it has its own filters) — same "discovery view" pattern as Schedule; could hide the top bar there for consistency.
- Bundle size warning on build (single >500 kB JS chunk) — fine for now, could code-split later.

---

<!-- Template for new days — copy this block to the top under a new date heading:

## YYYY-MM-DD

### Shipped to production
-

### Parked / follow-ups
-

### Notes for next session
-

-->
