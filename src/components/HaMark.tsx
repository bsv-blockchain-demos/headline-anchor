import React from 'react'

// The "HA" hexagon-seal wordmark: blue gradient hexagon, HA lettering, a
// timestamp tick and an anchor-point diamond. Rendered in the masthead and footer.
// `idSuffix` keeps the gradient id unique per instance.
export function HaMark({ size = 44, idSuffix = 'a' }: { size?: number; idSuffix?: string }) {
  const gid = `haMark-${idSuffix}`
  return (
    <div style={{ width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id={gid} x1="6" y1="2" x2="42" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6fb3ff" />
            <stop offset="1" stopColor="#3f7fd6" />
          </linearGradient>
        </defs>
        <path d="M24 2.5 41 12 41 30 24 39.5 7 30 7 12Z" fill={`url(#${gid})`} />
        <text x="24" y="25.5" textAnchor="middle" fontFamily="Archivo, sans-serif" fontWeight="800" fontSize="15" letterSpacing="-.5" fill="var(--bg)">HA</text>
        <path d="M17.5 31 H30.5" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 30.4 l2.4 2.7 -2.4 2.7 -2.4 -2.7 Z" fill="var(--bg)" />
      </svg>
    </div>
  )
}
