import React from 'react'
import type { DiffToken } from '../diff'

// "They published" line: kept words muted, removed words as red strike chips.
// On the newest (hot) entry, a redaction bar lifts to expose each struck word.
export function BeforeHeadline({
  tokens, hot = false, fontSize, variant = 'list',
}: { tokens: DiffToken[]; hot?: boolean; fontSize: number; variant?: 'list' | 'detail' }) {
  const pad = variant === 'detail' ? '1px 5px' : '1px 4px'
  return (
    <div style={{ font: `400 ${fontSize}px/1.5 'Newsreader',serif`, textWrap: 'pretty' as never }}>
      {tokens.map((tok, i) =>
        tok.kind === 'same' ? (
          <React.Fragment key={i}><span style={{ color: 'var(--text2)' }}>{tok.t}</span>{' '}</React.Fragment>
        ) : (
          <React.Fragment key={i}>
            <span style={{
              position: 'relative', display: 'inline-block', verticalAlign: 'baseline',
              color: 'var(--editText)', background: 'var(--editBg)', borderRadius: 2, padding: pad,
              textDecoration: 'line-through', textDecorationColor: 'var(--edit)',
            }}>
              {tok.t}
              {hot && (
                <span style={{
                  position: 'absolute', inset: 0, background: 'var(--redact)', borderRadius: 2,
                  transformOrigin: 'right', animation: 'ha-reveal 5.5s ease-in-out infinite',
                }} />
              )}
            </span>{' '}
          </React.Fragment>
        )
      )}
    </div>
  )
}

// "Now it reads" line: kept words normal, added words as green highlight chips.
export function AfterHeadline({
  tokens, fontSize, variant = 'list',
}: { tokens: DiffToken[]; fontSize: number; variant?: 'list' | 'detail' }) {
  const pad = variant === 'detail' ? '1px 7px' : '1px 6px'
  const weight = variant === 'detail' ? 700 : 700
  const ls = variant === 'detail' ? '-.3px' : '-.2px'
  return (
    <div style={{ font: `${weight} ${fontSize}px/1.34 'Newsreader',serif`, color: 'var(--text)', letterSpacing: ls, textWrap: 'pretty' as never }}>
      {tokens.map((tok, i) =>
        tok.kind === 'same' ? (
          <React.Fragment key={i}><span>{tok.t}</span>{' '}</React.Fragment>
        ) : (
          <React.Fragment key={i}>
            <span style={{
              color: 'var(--okText)', background: 'var(--okBg)', borderRadius: 2, padding: pad, fontWeight: 700,
              boxShadow: 'inset 0 -2px 0 var(--ok)',
              WebkitBoxDecorationBreak: 'clone', boxDecorationBreak: 'clone',
            }}>{tok.t}</span>{' '}
          </React.Fragment>
        )
      )}
    </div>
  )
}
