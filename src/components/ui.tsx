import React from 'react'

export function LiveDot({ color = 'var(--ok)', size = 7 }: { color?: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, animation: 'ha-live 1.8s ease-in-out infinite', flex: 'none' }} />
}

export function SectionHeader({
  kicker, title, sub, right, mb = 8,
}: { kicker: string; title: string; sub: string; right?: React.ReactNode; mb?: number }) {
  return (
    <div style={{ borderBottom: '2px solid var(--text)', paddingBottom: 14, marginBottom: mb }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ font: "800 9px 'Archivo'", letterSpacing: '2.5px', color: 'var(--accent)' }}>{kicker}</span>
        {right && <><span style={{ flex: 1 }} />{right}</>}
      </div>
      <h1 style={{ font: "700 38px/1 'Newsreader',serif", letterSpacing: '-.5px', color: 'var(--text)', margin: 0 }}>{title}</h1>
      <p style={{ font: "400 15px/1.55 'Archivo'", color: 'var(--text2)', margin: '11px 0 0', maxWidth: 580, textWrap: 'pretty' as never }}>{sub}</p>
    </div>
  )
}

function pgBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    font: "700 10.5px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px',
    borderRadius: 2, padding: '9px 15px', transition: 'all .15s', background: 'transparent',
    ...(enabled
      ? { cursor: 'pointer', color: 'var(--text)', border: '1px solid var(--border2)' }
      : { cursor: 'default', color: 'var(--muted)', border: '1px solid var(--border)', opacity: .5 }),
  }
}

export function Pager({
  page, pages, onPrev, onNext,
}: { page: number; pages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 22 }}>
      <button onClick={onPrev} disabled={page <= 1} style={pgBtnStyle(page > 1)}>← Newer</button>
      <span style={{ font: "600 11px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>Page {page} of {pages}</span>
      <button onClick={onNext} disabled={page >= pages} style={pgBtnStyle(page < pages)}>Older →</button>
    </div>
  )
}
