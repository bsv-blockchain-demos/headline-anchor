import React from 'react'

export function ProofBadge({ txid }: { txid: string | null }) {
  if (!txid) {
    return <span style={styles.pending}>pending</span>
  }

  const short = txid.slice(0, 8) + '...' + txid.slice(-4)
  const href = `https://whatsonchain.com/tx/${txid}`

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={styles.badge}>
      {short}
    </a>
  )
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#0d2818',
    color: '#4ade80',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textDecoration: 'none',
    border: '1px solid #166534',
  },
  pending: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#1c1c1c',
    color: '#666',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    border: '1px solid #333',
  },
}
