import React, { useState, useEffect } from 'react'
import { fetchChange } from '../api'
import type { HeadlineChange } from '../types'
import { computeDiffTokens } from '../diff'
import { formatTimestamp, truncHash, bareHash, hashInput } from '../format'
import { BeforeHeadline, AfterHeadline } from './Diff'
import { SealCheck, Spinner, IconX } from '../icons'

export function ChangeDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [change, setChange] = useState<HeadlineChange | null>(null)
  const [error, setError] = useState(false)
  const [hashOpen, setHashOpen] = useState(false)

  useEffect(() => {
    setChange(null); setError(false); setHashOpen(false)
    fetchChange(id).then(setChange).catch(() => setError(true))
  }, [id])

  const back = (
    <a onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: "600 13px 'Archivo'", color: 'var(--accent)', cursor: 'pointer', marginBottom: 18 }}>← Back to the ledger</a>
  )

  if (error) {
    return (
      <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
        {back}
        <p style={{ color: 'var(--edit)', font: "400 15px 'Archivo'", padding: '24px 0' }}>Record not found.</p>
      </div>
    )
  }
  if (!change) {
    return (
      <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
        {back}
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', font: "400 14px 'Archivo'" }}>Pulling the record…</p>
      </div>
    )
  }

  const { before, after } = computeDiffTokens(change.old_title, change.new_title)
  const verified = !!change.change_txid
  const desc = change.new_description ?? change.old_description ?? ''

  return (
    <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
      {back}
      <div style={{ borderTop: '3px solid var(--accent)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        {/* header strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexWrap: 'wrap' }}>
          <span style={{ font: "800 9px 'Archivo'", letterSpacing: '1.5px', background: 'var(--text)', color: 'var(--bg)', padding: '4px 8px' }}>EXHIBIT {change.id}</span>
          <span style={{ font: "700 12px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text)' }}>{change.source_name}</span>
          <span style={{ marginLeft: 'auto', font: "400 11px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>{formatTimestamp(change.detected_at)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: "800 10px 'Archivo'", letterSpacing: '1.3px', color: 'var(--edit)', border: '1.5px solid var(--edit)', borderRadius: 2, padding: '3px 9px', animation: 'ha-stamp 5s ease-out infinite', transformOrigin: 'center' }}>
            <IconX size={9} />EDITED
          </span>
        </div>

        {/* diff body */}
        <div style={{ padding: '24px 22px 8px' }}>
          <div style={{ font: "800 8.5px 'Archivo'", letterSpacing: '2px', color: 'var(--editText)', marginBottom: 9 }}>THEY PUBLISHED</div>
          <div style={{ marginBottom: 24 }}><BeforeHeadline tokens={before} hot fontSize={23} variant="detail" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
            <span style={{ font: "800 8.5px 'Archivo'", letterSpacing: '2px', color: 'var(--ok)' }}>NOW IT READS</span>
          </div>
          <div style={{ marginBottom: 26 }}><AfterHeadline tokens={after} fontSize={27} variant="detail" /></div>
          <div style={{ font: "800 8.5px 'Archivo'", letterSpacing: '2px', color: 'var(--muted)', marginBottom: 7 }}>ARTICLE STANDFIRST</div>
          <div style={{ font: "400 16px/1.6 'Newsreader',serif", color: 'var(--text2)', marginBottom: 24, textWrap: 'pretty' as never }}>{desc}</div>
        </div>

        {/* content hash */}
        <div style={{ margin: '0 22px 22px', background: 'var(--surface2)', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ font: "800 8.5px 'Archivo'", letterSpacing: '2px', color: 'var(--muted)' }}>CONTENT HASH</span>
            <span style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--editText)', background: 'var(--editBg)', padding: '3px 7px' }}>{truncHash(change.old_hash)}</span>
            <span style={{ color: 'var(--muted)' }}>→</span>
            <span style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--okText)', background: 'var(--okBg)', padding: '3px 7px' }}>{truncHash(change.new_hash)}</span>
            <button onClick={() => setHashOpen((v) => !v)} style={{ marginLeft: 'auto', font: "700 10px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--accent)', background: 'none', border: '1px solid var(--accentBorder)', borderRadius: 2, padding: '6px 10px', cursor: 'pointer' }}>
              {hashOpen ? 'Hide content' : 'Reveal hashed content'}
            </button>
          </div>
          {hashOpen && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 12px' }}>
                <div style={{ font: "700 9px 'Archivo'", letterSpacing: '1px', color: 'var(--editText)', marginBottom: 6, wordBreak: 'break-word' }}>BEFORE sha-256:{bareHash(change.old_hash)}</div>
                <div style={{ font: "400 11.5px/1.55 'JetBrains Mono',monospace", color: 'var(--text2)', wordBreak: 'break-word' }}>{hashInput(change.old_title, change.old_description)}</div>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '11px 12px' }}>
                <div style={{ font: "700 9px 'Archivo'", letterSpacing: '1px', color: 'var(--okText)', marginBottom: 6, wordBreak: 'break-word' }}>AFTER sha-256:{bareHash(change.new_hash)}</div>
                <div style={{ font: "400 11.5px/1.55 'JetBrains Mono',monospace", color: 'var(--text2)', wordBreak: 'break-word' }}>{hashInput(change.new_title, change.new_description)}</div>
              </div>
            </div>
          )}
        </div>

        {/* proof */}
        <div style={{ margin: '0 22px 22px', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface2)', border: '1px solid var(--border)', padding: 18, flexWrap: 'wrap' }}>
          {verified ? (
            <>
              <SealCheck size={56} pulse />
              <div style={{ lineHeight: 1.5 }}>
                <div style={{ font: "900 11px 'Archivo'", letterSpacing: '1.3px', color: 'var(--ok)' }}>SEALED &amp; VERIFIED ON-CHAIN</div>
                <div style={{ font: "400 12px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>tx {truncHash(change.change_txid)}</div>
                <div style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--muted)' }}>BSV mainnet</div>
              </div>
              <a href={`https://whatsonchain.com/tx/${change.change_txid}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', font: "700 12px 'Archivo'", color: 'var(--accent)', whiteSpace: 'nowrap' }}>View proof ↗</a>
            </>
          ) : (
            <>
              <Spinner size={40} />
              <div style={{ lineHeight: 1.5 }}>
                <div style={{ font: "900 11px 'Archivo'", letterSpacing: '1.3px', color: 'var(--warn)' }}>AWAITING ANCHOR</div>
                <div style={{ font: "400 12px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>hash computed, broadcast queued</div>
                <div style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--muted)' }}>seals at the next block</div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '0 22px 22px' }}>
          <a href={change.url} target="_blank" rel="noopener noreferrer" style={{ font: "400 12.5px 'JetBrains Mono',monospace", color: 'var(--accent)', wordBreak: 'break-all' }}>{change.url}</a>
        </div>
      </div>
    </div>
  )
}
