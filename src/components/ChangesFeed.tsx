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

function truncHash(hash: string) {
  const bare = hash.replace(/^sha256:/, '')
  return bare.slice(0, 8) + '...' + bare.slice(-8)
}

function hashInput(title: string, description: string | null) {
  return title + '|' + (description ?? '')
}

function HashRow({ oldHash, newHash, change }: { oldHash: string; newHash: string; change: HeadlineChange }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={styles.hashSection}>
      <div style={styles.hashRow}>
        <span style={styles.hashLabel}>HASH</span>
        <code style={styles.hashOld}>{truncHash(oldHash)}</code>
        <span style={styles.hashArrow}>&rarr;</span>
        <code style={styles.hashNew}>{truncHash(newHash)}</code>
        <button style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide content' : 'View hashed content'}
        </button>
      </div>
      {expanded && (
        <div style={styles.expandedContent}>
          <div style={styles.contentBlock}>
            <div style={styles.contentLabel}>
              Before <code style={styles.contentHash}>{oldHash}</code>
            </div>
            <pre style={styles.contentPre}>{hashInput(change.old_title, change.old_description)}</pre>
          </div>
          <div style={styles.contentBlock}>
            <div style={styles.contentLabel}>
              After <code style={styles.contentHash}>{newHash}</code>
            </div>
            <pre style={styles.contentPre}>{hashInput(change.new_title, change.new_description)}</pre>
          </div>
        </div>
      )}
    </div>
  )
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
        <div key={c.id} style={styles.card}>
          <div style={styles.meta}>
            <span style={styles.source}>{c.source_name}</span>
            <span style={styles.time}>{timeAgo(c.detected_at)}</span>
            <span style={styles.changeLabel}>EDITED</span>
            <ProofBadge txid={c.change_txid} />
          </div>
          <DiffView oldText={c.old_title} newText={c.new_title} label="Title" />
          <DiffView oldText={c.old_description} newText={c.new_description} label="Description" />
          <HashRow oldHash={c.old_hash} newHash={c.new_hash} change={c} />
          <div style={styles.urlRow}>
            <a href={c.url} target="_blank" rel="noopener noreferrer" style={styles.url}>
              {c.url}
            </a>
          </div>
        </div>
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
  urlRow: {
    marginTop: '0.5rem',
  },
  url: {
    color: '#4a9eff',
    fontSize: '0.8rem',
    textDecoration: 'none',
    wordBreak: 'break-all',
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
  hashSection: {
    marginBottom: '0.5rem',
  },
  hashRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  hashLabel: {
    color: '#888',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  hashOld: {
    color: '#f87171',
    fontSize: '0.75rem',
    background: '#1a1a1a',
    padding: '1px 5px',
    borderRadius: '3px',
  },
  hashArrow: {
    color: '#555',
    fontSize: '0.75rem',
  },
  hashNew: {
    color: '#4ade80',
    fontSize: '0.75rem',
    background: '#1a1a1a',
    padding: '1px 5px',
    borderRadius: '3px',
  },
  expandBtn: {
    background: 'none',
    border: '1px solid #333',
    borderRadius: '3px',
    color: '#888',
    fontSize: '0.7rem',
    padding: '1px 6px',
    cursor: 'pointer',
    marginLeft: '0.25rem',
  },
  expandedContent: {
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  contentBlock: {
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '4px',
    padding: '0.5rem',
  },
  contentLabel: {
    color: '#888',
    fontSize: '0.7rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  contentHash: {
    color: '#666',
    fontSize: '0.65rem',
    fontWeight: 400,
  },
  contentPre: {
    color: '#ccc',
    fontSize: '0.8rem',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    fontFamily: 'monospace',
  },
}
