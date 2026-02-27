import React from 'react'

interface DiffViewProps {
  oldText: string | null
  newText: string | null
  label: string
}

interface DiffSegment {
  type: 'equal' | 'removed' | 'added'
  words: string[]
}

function computeDiff(oldText: string, newText: string): DiffSegment[] {
  const oldWords = oldText.split(/\s+/).filter(Boolean)
  const newWords = newText.split(/\s+/).filter(Boolean)

  const m = oldWords.length
  const n = newWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldWords[i - 1] === newWords[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  const raw: { type: 'equal' | 'removed' | 'added'; word: string }[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      raw.push({ type: 'equal', word: oldWords[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: 'added', word: newWords[j - 1] })
      j--
    } else {
      raw.push({ type: 'removed', word: oldWords[i - 1] })
      i--
    }
  }
  raw.reverse()

  const segments: DiffSegment[] = []
  for (const { type, word } of raw) {
    if (segments.length > 0 && segments[segments.length - 1].type === type) {
      segments[segments.length - 1].words.push(word)
    } else {
      segments.push({ type, words: [word] })
    }
  }
  return segments
}

const CONTEXT_WORDS = 10

function collapseContext(segments: DiffSegment[]): (DiffSegment | 'ellipsis')[] {
  const result: (DiffSegment | 'ellipsis')[] = []
  for (let idx = 0; idx < segments.length; idx++) {
    const seg = segments[idx]
    if (seg.type !== 'equal' || seg.words.length <= CONTEXT_WORDS * 2 + 4) {
      result.push(seg)
      continue
    }
    const isFirst = idx === 0
    const isLast = idx === segments.length - 1
    if (isFirst) {
      result.push('ellipsis')
      result.push({ type: 'equal', words: seg.words.slice(-CONTEXT_WORDS) })
    } else if (isLast) {
      result.push({ type: 'equal', words: seg.words.slice(0, CONTEXT_WORDS) })
      result.push('ellipsis')
    } else {
      result.push({ type: 'equal', words: seg.words.slice(0, CONTEXT_WORDS) })
      result.push('ellipsis')
      result.push({ type: 'equal', words: seg.words.slice(-CONTEXT_WORDS) })
    }
  }
  return result
}

export function DiffView({ oldText, newText, label }: DiffViewProps) {
  const old = oldText ?? ''
  const curr = newText ?? ''
  if (old === curr) return null

  const segments = computeDiff(old, curr)
  const collapsed = collapseContext(segments)

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.diffBlock}>
        {collapsed.map((item, i) => {
          if (item === 'ellipsis') {
            return <span key={i} style={styles.ellipsis}> ··· </span>
          }
          const text = item.words.join(' ')
          if (item.type === 'removed') {
            return <span key={i} style={styles.removed}>{text} </span>
          }
          if (item.type === 'added') {
            return <span key={i} style={styles.added}>{text} </span>
          }
          return <span key={i}>{text} </span>
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '0.75rem',
  },
  label: {
    color: '#aaa',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  diffBlock: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    lineHeight: 1.8,
    background: '#111',
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid #222',
  },
  removed: {
    background: '#3c1618',
    color: '#f87171',
    textDecoration: 'line-through',
    borderRadius: '2px',
    padding: '1px 2px',
  },
  added: {
    background: '#0f2d1a',
    color: '#4ade80',
    borderRadius: '2px',
    padding: '1px 2px',
  },
  ellipsis: {
    color: '#555',
    fontStyle: 'italic',
  },
}
