// ============================================================================
// src/components/Brand.jsx — CreaseFeed mark + wordmark lockup.
// Mark: navy rounded square, green ring (the crease), white condensed "CF".
// At 32px and below the letters drop out — ring only. Ref: docs/mockups/Brand.dc.html
// ============================================================================

export function CfMark({ size = 44, letters, className = '', title }) {
  const showLetters = letters ?? size > 32
  const ring = showLetters ? { r: 37, w: 8 } : { r: 36.5, w: 9.5 }
  return (
    <svg
      className={`cf-mark ${className}`}
      width={size} height={size} viewBox="0 0 120 120"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'}
    >
      <rect width="120" height="120" rx="26" fill="#0E1A2B" stroke="var(--cf-mark-edge, none)" strokeWidth="4" />
      <circle cx="60" cy="60" r={ring.r} fill="none" stroke="var(--cf-mark-ring, #1D6B44)" strokeWidth={ring.w} />
      {showLetters && (
        <text
          x="60" y="61" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Barlow Condensed', sans-serif" fontWeight="800" fontSize="34" fill="#FFFFFF"
        >CF</text>
      )}
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return <span className={`cf-wordmark ${className}`}>CREASE<span className="cf-wordmark-feed">FEED</span></span>
}

export const TAGLINE = 'Every team you follow. One feed.'

export function Lockup({ onClick }) {
  return (
    <button type="button" className="logo-wrap" onClick={onClick} aria-label="CreaseFeed home">
      <CfMark size={44} />
      <span className="logo-text">
        <Wordmark className="logo" />
        <span className="logo-tag">{TAGLINE}</span>
      </span>
    </button>
  )
}
