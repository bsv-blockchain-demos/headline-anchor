import React, { useState, useEffect } from 'react'
import { fetchHeadlines } from '../api'
import { HeadlineCard } from './HeadlineCard'
import type { Headline } from '../types'

export function HeadlineFeed({ source }: { source?: string }) {
  const [headlines, setHeadlines] = useState<Headline[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPage(1)
  }, [source])

  useEffect(() => {
    setLoading(true)
    fetchHeadlines(page, 20, source)
      .then((res) => setHeadlines(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, source])

  if (loading && headlines.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Loading headlines...</p>
  }

  if (headlines.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No headlines yet. Crawler is running...</p>
  }

  return (
    <div>
      {headlines.map((h) => (
        <HeadlineCard key={h.id} headline={h} />
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
          disabled={headlines.length < 20}
          style={styles.pageBtn}
        >
          Next
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
