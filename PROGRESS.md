# CreaseFeed — Progress Log

A running log of work on **CreaseFeed** (creasefeed.com). Newest entries on top.
Share this doc with Claude Code or Claude Cowork to bring them up to speed quickly.

**Stack:** React + Vite · Firebase (Auth / Firestore / Hosting) · Cloud Functions (NCAA data pipeline).
**Deploys:** run directly via `firebase deploy` (hosting, and `--only functions`/`firestore:rules` when those change). Batch changes, deploy when reviewed.

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
