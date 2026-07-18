import React from 'react'
import type { HeadlineChange } from '../types'
import { timeAgo } from '../format'
import { IconPencil } from '../icons'

// Horizontally scrolling marquee of recent catches. Hover to pause. Each item
// links to its Exhibit record (#changes/:id).
export function LiveWire({ changes }: { changes: HeadlineChange[] }) {
  if (changes.length === 0) return null
  const items = changes.map((c) => ({ id: c.id, source: c.source_name, text: c.new_title, ago: timeAgo(c.detected_at) }))

  const run = (copy: number) =>
    items.map((w, i) => (
      <a
        key={`${copy}-${i}`}
        className="wire-item"
        href={`#changes/${w.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: "400 12px 'JetBrains Mono',monospace", color: 'var(--text2)', textDecoration: 'none', cursor: 'pointer' }}
      >
        <IconPencil size={11} color="var(--edit)" />
        <b style={{ color: 'var(--text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', fontFamily: "'Archivo'", fontSize: 11 }}>{w.source}</b>
        rewrote
        <span className="wire-quote" style={{ color: 'var(--text)' }}>&ldquo;{w.text}&rdquo;</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)', flex: 'none' }} />
        <span style={{ color: 'var(--muted)' }}>{w.ago}</span>
      </a>
    ))

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid var(--text)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 22 }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'var(--edit)', color: '#fff' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'ha-live 1.4s ease-in-out infinite' }} />
        <span style={{ font: "800 10px 'Archivo'", letterSpacing: '1.5px' }}>LIVE WIRE</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 94%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 94%,transparent)' }}>
        <div
          onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused' }}
          onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running' }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 34, whiteSpace: 'nowrap', paddingLeft: 34, animation: 'ha-marq 42s linear infinite' }}
        >
          {run(0)}
          {run(1)}
        </div>
      </div>
    </div>
  )
}
