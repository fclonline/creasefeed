# CreaseFeed — Progress Log

A running log of work on **CreaseFeed** (creasefeed.com). Newest entries on top.
Share this doc with Claude Code or Claude Cowork to bring them up to speed quickly.

**Stack:** React + Vite · Firebase (Auth / Firestore / Hosting) · Cloud Functions (NCAA data pipeline).
**Deploys:** run directly via `firebase deploy` (hosting, and `--only functions`/`firestore:rules` when those change). Batch changes, deploy when reviewed.

---

## 2026-05-28

### Shipped to production
- **Fixed free-account login (email/password).** It was entirely non-functional: `useAuth` only had Google sign-in, and the modal's password field had no state + the "Continue with Email" button had no handler. Added `signUpEmail`/`signInEmail` (create + sign-in, optional display name) to `useAuth`, and rebuilt the modal email form: controlled inputs, working submit, **Create account ↔ Sign in toggle**, loading state, and plain-language Firebase error messages (incl. Google popup/unauthorized-domain). Free profile (`pro: false`) is created via the existing `onAuthStateChanged` path — separate from Pro. Tested live; Email/Password provider confirmed enabled.
- **Fixed "edit teams" wiping past follows.** The editor (`Onboarding`) opened with an empty selection and saving *replaced* the whole followed list — so adding one team erased the rest. It now seeds the selection from your current follows (handles async load), so you start from your set and actively unselect to remove. Verified: add → remove → save retains the untouched teams.
- **My Feed gender toggle + per-game gender labels.** Added a Show: All / Men's / Women's toggle (only when the feed has both genders). In the "All" view each game is tagged MEN'S (green) / WOMEN'S (purple) via an optional `showGender` prop on `GameCard`. Hardened feed game-matching against missing team names.

### Notes
- Throwaway test user `cf-test-20260528@example.com` created during auth testing — safe to delete in Firebase Console → Authentication.

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
