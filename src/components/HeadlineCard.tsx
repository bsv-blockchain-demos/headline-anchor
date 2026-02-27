import React from 'react'
import type { Headline } from '../types'
import { ProofBadge } from './ProofBadge'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function HeadlineCard({ headline }: { headline: Headline }) {
  return (
    <div style={styles.card}>
      <div style={styles.meta}>
        <span style={styles.source}>{headline.source_name}</span>
        <span style={styles.time}>{timeAgo(headline.first_seen_at)}</span>
        <ProofBadge txid={headline.txid} />
      </div>
      <a href={headline.url} target="_blank" rel="noopener noreferrer" style={styles.title}>
        {headline.title}
      </a>
      {headline.description && (
        <p style={styles.desc}>{headline.description.slice(0, 200)}</p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  source: {
    background: '#1a1a2e',
    color: '#4a9eff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  time: {
    color: '#666',
    fontSize: '0.8rem',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '1.05rem',
    fontWeight: 600,
    textDecoration: 'none',
    lineHeight: 1.4,
    display: 'block',
  },
  desc: {
    color: '#888',
    fontSize: '0.85rem',
    marginTop: '0.4rem',
    lineHeight: 1.5,
  },
}
