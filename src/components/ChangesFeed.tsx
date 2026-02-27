import React, { useState, useEffect } from 'react'
import { fetchChanges } from '../api'
import { DiffView } from './DiffView'
import { ProofBadge } from './ProofBadge'
import type { HeadlineChange } from '../types'

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

export function ChangesFeed({ source }: { source?: string }) {
  const [changes, setChanges] = useState<HeadlineChange[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [source])

  useEffect(() => {
    setLoading(true)
    fetchChanges(page, 20, source)
      .then((res) => setChanges(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, source])

  if (loading && changes.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Loading changes...</p>
  }

  if (changes.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No changes detected yet.</p>
  }

  return (
    <div>
      {changes.map((c) => (
        <a key={c.id} href={`#changes/${c.id}`} style={styles.cardLink}>
          <div style={styles.card}>
            <div style={styles.meta}>
              <span style={styles.source}>{c.source_name}</span>
              <span style={styles.time}>{timeAgo(c.detected_at)}</span>
              <span style={styles.changeLabel}>EDITED</span>
              <ProofBadge txid={c.change_txid} />
            </div>
            <div style={styles.title}>{c.new_title}</div>
            {c.new_description && (
              <p style={styles.desc}>{c.new_description.slice(0, 200)}</p>
            )}
            {c.old_title !== c.new_title && (
              <DiffView oldText={c.old_title} newText={c.new_title} label="Title change" />
            )}
            {c.old_title === c.new_title && (
              <div style={styles.descChanged}>Description changed</div>
            )}
          </div>
        </a>
      ))}
      <div style={styles.pagination}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={styles.pageBtn}
        >
          Previous
        </button>
        <span style={styles.pageNum}>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={changes.length < 20}
          style={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  cardLink: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    marginBottom: '0.75rem',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1rem',
    transition: 'border-color 0.15s',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
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
  changeLabel: {
    background: '#2d1215',
    color: '#f87171',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '1.05rem',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '0.25rem',
  },
  desc: {
    color: '#aaa',
    fontSize: '0.85rem',
    lineHeight: 1.5,
    marginBottom: '0.5rem',
  },
  descChanged: {
    color: '#f0a500',
    fontSize: '0.8rem',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: '0.25rem',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 0',
  },
  pageBtn: {
    padding: '0.4rem 1rem',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  pageNum: {
    color: '#666',
    fontSize: '0.85rem',
  },
}
