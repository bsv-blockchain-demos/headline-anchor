import React, { useState, useEffect } from 'react'
import { fetchChange } from '../api'
import { DiffView } from './DiffView'
import { ProofBadge } from './ProofBadge'
import type { HeadlineChange } from '../types'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString()
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

export function ChangeDetail({ id }: { id: number }) {
  const [change, setChange] = useState<HeadlineChange | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setChange(null)
    setError(false)
    fetchChange(id)
      .then(setChange)
      .catch(() => setError(true))
  }, [id])

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#f87171' }}>Change not found.</p>
        <a href="#changes" style={styles.backLink}>Back to changes</a>
      </div>
    )
  }

  if (!change) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Loading...</p>
  }

  return (
    <div>
      <a href="#changes" style={styles.backLink}>Back to changes</a>
      <div style={styles.card}>
        <div style={styles.meta}>
          <span style={styles.source}>{change.source_name}</span>
          <span style={styles.time}>{formatTime(change.detected_at)}</span>
          <span style={styles.changeLabel}>EDITED</span>
          <ProofBadge txid={change.change_txid} />
        </div>
        <DiffView oldText={change.old_title} newText={change.new_title} label="Title" />
        <DiffView oldText={change.old_description} newText={change.new_description} label="Description" />
        <HashRow oldHash={change.old_hash} newHash={change.new_hash} change={change} />
        <div style={styles.urlRow}>
          <a href={change.url} target="_blank" rel="noopener noreferrer" style={styles.url}>
            {change.url}
          </a>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backLink: {
    color: '#4a9eff',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '1rem',
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1rem',
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
    color: '#aaa',
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
    color: '#aaa',
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
    color: '#aaa',
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
