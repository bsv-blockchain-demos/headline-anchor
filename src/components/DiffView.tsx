import React from 'react'

interface DiffViewProps {
  oldText: string | null
  newText: string | null
  label: string
}

export function DiffView({ oldText, newText, label }: DiffViewProps) {
  const old = oldText ?? ''
  const curr = newText ?? ''
  if (old === curr) return null

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.diffRow}>
        <div style={styles.removed}>
          <span style={styles.diffMarker}>-</span>
          {old}
        </div>
        <div style={styles.added}>
          <span style={styles.diffMarker}>+</span>
          {curr}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '0.75rem',
  },
  label: {
    color: '#888',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  diffRow: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    lineHeight: 1.6,
  },
  removed: {
    background: '#2d1215',
    color: '#f87171',
    padding: '4px 8px',
    borderRadius: '4px 4px 0 0',
    border: '1px solid #7f1d1d',
    borderBottom: 'none',
  },
  added: {
    background: '#0d2818',
    color: '#4ade80',
    padding: '4px 8px',
    borderRadius: '0 0 4px 4px',
    border: '1px solid #166534',
  },
  diffMarker: {
    fontWeight: 700,
    marginRight: '0.5rem',
    opacity: 0.6,
  },
}
