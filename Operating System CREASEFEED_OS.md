# CREASEFEED_OS.md
### The Operating System for Building CreaseFeed

*This is the living document that governs how CreaseFeed gets built. Every decision, feature, and sprint flows through this. Claude and Cowork run on this document. Update it when the business changes.*

---

## 1. WHAT CREASEFEED IS

**One sentence:** The only place to follow college lacrosse — scores, stats, standings, and rankings — across all divisions and genders, in one personalized feed.

**The product insight:** No existing platform lets you follow specific teams across D1/D2/D3, men's and women's, in one place with real-time alerts. CreaseFeed fills that gap.

**What CreaseFeed is NOT:**
- Not a recruiting platform (no high school rankings, ever — unless explicitly decided)
- Not a media outlet or editorial site (light on written content until the flywheel is built)
- Not a general sports platform (lacrosse only)
- Not a high school coverage product

**Scope boundary:** If a feature request falls outside college lacrosse media and coverage, the answer is no.

---

## 2. THE USER

**Primary user:** College lacrosse fans — which includes parents, former players, coaches, and anyone who follows programs across divisions. They are 30+ years old, not necessarily tech-forward, and expect simplicity.

**Design rule:** If a 35-year-old lacrosse dad can't figure it out in 10 seconds, it's too complex.

**Who pays for Pro:** The same fan base — people who follow multiple teams, want live alerts, and care enough about lacrosse to pay $9.99/month or $79.99/year for a better experience.

**Free vs. Pro split:**
- Free: scores, standings, basic stats
- Pro: live play-by-play, unlimited team follows, push alerts, advanced stats

---

## 3. THE DECISION FRAMEWORK

When two build paths exist, evaluate in this order:

1. **Pro conversion impact** — Does this move someone from free to paid? If yes, it's high priority.
2. **Data accuracy** — Does this show correct, trustworthy data? If not, don't ship it. Misleading data is worse than no data.
3. **Speed to ship** — Given 2-3 hours/week of available build time, can this be done in one focused session?
4. **Scope fit** — Does it belong in a college lacrosse coverage product?

**Tiebreaker:** If two features score equally, ship the one that serves paying users first.

**When to drop a feature entirely:** If the data source is unreliable and can't be fixed cleanly, drop it rather than show misleading data. (Precedent: Inside Lacrosse poll was dropped rather than substituted with a mislabeled source.)

---

## 4. THE BUILD WORKFLOW

CreaseFeed is built by one person (Deemer) using AI as the operating system. The workflow is:

```
PLAN with Claude → SPEC the task → EXECUTE with Cowork → VERIFY → SHIP
```

**Claude's role:** Strategy, diagnosis, architecture decisions, writing specs and instructions.

**Cowork's role:** File edits, deployments, running commands. Cowork gets a single consolidated instruction document — never managed conversationally.

**Deemer's role:** Domain expertise, product decisions, verification before deploy, anything requiring account credentials.

**Rule:** Never write code or deploy without a spec. Never hand Cowork a vague task. Every Cowork session starts with a clear document that includes: what to build, what files to touch, what success looks like.

---

## 5. THE "DONE" CHECKLIST

A feature is not done until it passes all of these:

- [ ] Live on creasefeed.com (not just local or staging)
- [ ] Works on mobile (iOS Safari + Chrome minimum)
- [ ] Works on desktop
- [ ] Simple enough for a 30+ non-technical user
- [ ] Ships for men's **and** women's D1 first
- [ ] D2/D3 version follows if applicable — never ships broken or empty
- [ ] Does not break existing features (scores, standings, team follows)
- [ ] Data is accurate — no placeholder names, no stale data displaying as live

---

## 6. SHIPPING PRIORITY ORDER

When building new features, follow this sequence unless there's a strong reason not to:

1. Men's D1 + Women's D1 (simultaneous)
2. Men's D2 + Women's D2
3. Men's D3 + Women's D3

Do not ship D2/D3 if the D1 version is broken or incomplete.

---

## 7. PRODUCT ROADMAP PRINCIPLES

**Current phase focus:** Data completeness + core features. The product must be accurate and reliable before growth.

**Next major feature:** Team records and standings (NCAA standings endpoint queued for testing).

**SEO is a queued workstream.** The site is a client-rendered Vite SPA — Google sees empty HTML. This must be solved before organic search can become an acquisition channel. The fix involves: indexability audit → SSR/prerender decision → URL structure + structured data → content/keyword strategy.

**Growth channels (priority order):**
1. Organic search (long-term, requires SEO fix)
2. FCL community collaboration (Deemer's existing audience — used carefully, brand separation maintained)
3. Social media (CreaseFeed brand account, independent of Deemer personally — for now)

**Brand rule:** CreaseFeed is its own brand. Deemer's personal connection to it is not public-facing at this stage.

---

## 8. TECHNICAL PRINCIPLES

- **NCAA API is source of truth** for scores and game metadata (`ncaa-api.henrygd.me`) — one call per date, clean structured data
- **Sidearm pipeline** is retained only for WMT player stats enrichment — not for scores
- **Firestore** is the data store; `div` field (`"1"`, `"2"`, `"3"`) drives all division filtering
- **Adapter pattern** is established for data providers — one import swap to change sources
- **Firebase Functions** run the data pipeline (Node 20); React/Vite on Firebase Hosting is the frontend
- **Real-time via `onSnapshot()`** — no polling
- **Stripe** is integrated for Pro subscription checkout and portal

**Code hygiene rules:**
- Don't add complexity that requires manual coordination to maintain
- Drop a broken data source rather than display misleading data
- Let stale docs age out naturally rather than over-engineer cleanup
- Every new Firestore query that filters on multiple fields needs a composite index

---

## 9. THE TOKEN-MAX MINDSET

The Cowork + Claude spend is the engineering team budget. Think of it this way:

- A feature that would take a hired developer two weeks costs ~$0 to spec and ship via this workflow
- An uncomfortably high AI bill is still far cheaper than headcount
- The goal is maximum output per hour of Deemer's time, not maximum hours spent building

**Constraint:** 2-3 hours/week. Every session should ship something visible.

---

## 10. WHAT THIS OS GETS UPDATED

Update this document when:
- A new data source is added or deprecated
- The monetization model changes
- A new growth channel is activated
- A scope decision is made (something permanently in or out of product)
- The target user definition shifts
- Available build time changes significantly

## 11. Github
Every working directory must be a git repo connected to GitHub. If git status returns "not a git repository," stop and fix that before any other work.
Every session ends with git push. Production-deployed code that isn't on GitHub is one laptop incident away from being lost.

*Last updated: May 2026*
