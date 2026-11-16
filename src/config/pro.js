// ============================================================================
// src/config/pro.js — the single list of Pro features shown anywhere on the site.
// Only items with live:true are rendered (Go Pro modal, Scores sidebar, Free vs
// Pro cards). Checkout/portal code lives elsewhere and is not touched by this.
// ============================================================================

// Deemer flips live:true only after the feature is verified on creasefeed.com
export const PRO_FEATURES = [
  { label: 'Follow unlimited teams',     live: true  },
  { label: 'Ad-free on every device',    live: true  },
  { label: 'Push alerts for your teams', live: false }, // until push ships
  { label: 'Full player stats',          live: false }, // until box scores are active
]

export const LIVE_PRO_FEATURES = PRO_FEATURES.filter(f => f.live)

export const FREE_FOLLOW_LIMIT = 2

export const PRO_PRICE_MONTHLY = '$9.99'
export const PRO_PRICE_ANNUAL  = '$79.99'

// Shown at the top of the Go Pro modal when a free follow hits the cap.
export const FOLLOW_LIMIT_NOTE = 'Follow unlimited teams with Pro.'
