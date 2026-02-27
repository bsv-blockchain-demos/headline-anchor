import React, { useState, useEffect } from 'react'
import { fetchSources } from '../api'
import type { Source } from '../types'

interface SourceFilterProps {
  selected: string | undefined
  onChange: (source: string | undefined) => void
}

export function SourceFilter({ selected, onChange }: SourceFilterProps) {
  const [sources, setSources] = useState<Source[]>([])

  useEffect(() => {
    fetchSources().then(setSources).catch(console.error)
  }, [])

  if (sources.length === 0) return null

  return (
    <div style={styles.container}>
      <button
        style={{ ...styles.chip, ...(selected === undefined ? styles.chipActive : {}) }}
        onClick={() => onChange(undefined)}
      >
        All
      </button>
      {sources.map((s) => (
        <button
          key={s.id}
          style={{ ...styles.chip, ...(selected === s.name ? styles.chipActive : {}) }}
          onClick={() => onChange(selected === s.name ? undefined : s.name)}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
    justifyContent: 'center',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid #333',
    background: 'transparent',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: '#1a1a2e',
    color: '#4a9eff',
    borderColor: '#4a9eff',
  },
}
