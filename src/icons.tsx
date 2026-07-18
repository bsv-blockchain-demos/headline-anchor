import React from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}

const stroke = (p: IconProps, sw: number) => ({
  width: p.size ?? 16,
  height: p.size ?? 16,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: p.color ?? 'currentColor',
  strokeWidth: p.strokeWidth ?? sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: p.style,
})

export const IconPencil = (p: IconProps) => (
  <svg {...stroke(p, 2.4)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
)
export const IconX = (p: IconProps) => (
  <svg {...stroke(p, 3.2)}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const IconArrowDown = (p: IconProps) => (
  <svg {...stroke(p, 3)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
)
export const IconCheck = (p: IconProps) => (
  <svg {...stroke(p, 3)}><path d="M20 6 9 17l-5-5" /></svg>
)
export const IconSun = (p: IconProps) => (
  <svg {...stroke(p, 2)}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>
)
export const IconMoon = (p: IconProps) => (
  <svg {...stroke(p, 2)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
)
export const IconList = (p: IconProps) => (
  <svg {...stroke(p, 2)}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
)
export const IconTrending = (p: IconProps) => (
  <svg {...stroke(p, 2)}><path d="M3 17l6-6 4 4 8-8M21 7v5h-5" /></svg>
)
export const IconFlag = (p: IconProps) => (
  <svg {...stroke(p, 2)}><path d="M4 19V5M4 6h9l-1.5 3L13 12H4" /></svg>
)
export const IconClock = (p: IconProps) => (
  <svg {...stroke(p, 2)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)

export const IconGitHub = ({ size = 15, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
)

// Rotating progress spinner (pending / working states).
export function Spinner({ size = 22, color = 'var(--warn)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" style={{ flex: 'none', animation: 'ha-spin 1.1s linear infinite' }}>
      <circle cx="25" cy="25" r="19" fill="none" stroke="var(--border2)" strokeWidth="4" />
      <circle cx="25" cy="25" r="19" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray="28 100" />
    </svg>
  )
}

// Hexagon "verified on-chain" seal with a check. `pulse` adds the expanding ring (detail view).
export function SealCheck({ size = 24, pulse = false }: { size?: number; pulse?: boolean }) {
  if (!pulse) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: 'none' }}>
        <path d="M24 4 41 12 41 28 24 44 7 28 7 12Z" fill="var(--okBg)" stroke="var(--ok)" strokeWidth="1.8" />
        <path d="M17 24 22 29 32 18" fill="none" stroke="var(--ok)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: size * 0.82, height: size * 0.82, borderRadius: '50%', border: '1.5px solid var(--ok)', animation: 'ha-pulse 2.6s ease-out infinite' }} />
      </div>
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'relative' }}>
        <path d="M24 3 42 11.5 42 28.5 24 45 6 28.5 6 11.5Z" fill="var(--okBg)" stroke="var(--ok)" strokeWidth="1.6" />
        <path d="M16 24 21.5 29.5 33 17" fill="none" stroke="var(--ok)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Detection-rate sparkline (Stats page).
export const Sparkline = () => (
  <svg width="130" height="42" viewBox="0 0 130 42" fill="none" preserveAspectRatio="none">
    <path d="M0 34 L18 30 L34 32 L50 22 L66 26 L82 14 L98 18 L114 8 L130 12" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M0 34 L18 30 L34 32 L50 22 L66 26 L82 14 L98 18 L114 8 L130 12 L130 42 L0 42Z" fill="var(--accentBg)" />
  </svg>
)
