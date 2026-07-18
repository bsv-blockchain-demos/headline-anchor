// Word-level diff (LCS) that splits into two token streams:
//   before  = kept + removed words (what they published)
//   after   = kept + added words   (what it now reads)
// Ported from the original DiffView LCS.

export interface DiffToken {
  t: string
  kind: 'same' | 'del' | 'add'
}

export interface DiffTokens {
  before: DiffToken[]
  after: DiffToken[]
}

type Segment = { type: 'equal' | 'removed' | 'added'; words: string[] }

function computeSegments(oldText: string, newText: string): Segment[] {
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

  const raw: { type: Segment['type']; word: string }[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      raw.push({ type: 'equal', word: oldWords[i - 1] }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: 'added', word: newWords[j - 1] }); j--
    } else {
      raw.push({ type: 'removed', word: oldWords[i - 1] }); i--
    }
  }
  raw.reverse()

  const segments: Segment[] = []
  for (const { type, word } of raw) {
    const last = segments[segments.length - 1]
    if (last && last.type === type) last.words.push(word)
    else segments.push({ type, words: [word] })
  }
  return segments
}

export function computeDiffTokens(oldText: string | null, newText: string | null): DiffTokens {
  const before: DiffToken[] = []
  const after: DiffToken[] = []
  const segments = computeSegments(oldText ?? '', newText ?? '')
  for (const seg of segments) {
    const t = seg.words.join(' ')
    if (seg.type === 'equal') {
      before.push({ t, kind: 'same' })
      after.push({ t, kind: 'same' })
    } else if (seg.type === 'removed') {
      before.push({ t, kind: 'del' })
    } else {
      after.push({ t, kind: 'add' })
    }
  }
  // If nothing differs (e.g. description-only change), still show the text plainly.
  if (before.length === 0) before.push({ t: oldText ?? '', kind: 'same' })
  if (after.length === 0) after.push({ t: newText ?? '', kind: 'same' })
  return { before, after }
}
