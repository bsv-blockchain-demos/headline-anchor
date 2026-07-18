import React from 'react'
import type { HeadlineChange } from '../types'
import { computeDiffTokens } from '../diff'
import { timeAgo, truncHash } from '../format'
import { SectionHeader, Pager, LiveDot } from './ui'
import { SourceFilter } from './SourceFilter'
import { BeforeHeadline, AfterHeadline } from './Diff'
import { SealCheck, Spinner, IconX, IconArrowDown } from '../icons'

const PAGE_SIZE = 4

interface Props {
  changes: HeadlineChange[]
  sourceNames: string[]
  source: string
  onSource: (s: string) => void
  page: number
  onPage: (p: number) => void
  onOpen: (id: number) => void
  loading: boolean
}

export function ChangesFeed({ changes, sourceNames, source, onSource, page, onPage, onOpen, loading }: Props) {
  const filtered = source === 'All' ? changes : changes.filter((c) => c.source_name === source)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
      <SectionHeader
        kicker="THE EDIT LEDGER"
        title="Caught red-handed"
        sub="Every silent edit to a tracked headline, flagged the moment it happens and sealed on-chain as public evidence."
        right={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: "600 10px 'JetBrains Mono',monospace", color: 'var(--text2)', textTransform: 'uppercase' }}>
            <LiveDot />Scanning {sourceNames.length} sources
          </span>
        }
      />

      <SourceFilter names={sourceNames} selected={source} onChange={onSource} />

      {loading && filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', font: "400 14px 'Archivo'" }}>Scanning the wire…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', font: "400 14px 'Archivo'" }}>No edits caught yet. The record is clean.</p>
      ) : (
        <>
          <div>
            {pageItems.map((c, i) => {
              const { before, after } = computeDiffTokens(c.old_title, c.new_title)
              const verified = !!c.change_txid
              const hot = current === 1 && i === 0
              return (
                <div
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  style={{ borderTop: '1px solid var(--border)', padding: '22px 4px', cursor: 'pointer', transition: 'background .15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ font: "700 11px 'JetBrains Mono',monospace", color: 'var(--accent)' }}>#{c.id}</span>
                    <span style={{ font: "700 11px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text)' }}>{c.source_name}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)' }} />
                    <span style={{ font: "400 12px 'Archivo'", color: 'var(--text2)' }}>{timeAgo(c.detected_at)}</span>
                    {hot && <span style={{ font: "800 8.5px 'Archivo'", letterSpacing: '1.2px', color: 'var(--accent)' }}>● LATEST</span>}
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, font: "800 10px 'Archivo'", letterSpacing: '1.3px', color: 'var(--edit)', border: '1.5px solid var(--edit)', borderRadius: 2, padding: '3px 9px' }}>
                      <IconX size={9} />EDITED
                    </span>
                  </div>

                  <div style={{ font: "800 8px 'Archivo'", letterSpacing: '2px', color: 'var(--editText)', marginBottom: 8 }}>THEY PUBLISHED</div>
                  <div style={{ marginBottom: 16 }}>
                    <BeforeHeadline tokens={before} hot={hot} fontSize={17} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <IconArrowDown size={12} color="var(--ok)" />
                    <span style={{ font: "800 8px 'Archivo'", letterSpacing: '2px', color: 'var(--ok)' }}>NOW IT READS</span>
                  </div>
                  <AfterHeadline tokens={after} fontSize={21} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 15, flexWrap: 'wrap' }}>
                    {verified ? (
                      <>
                        <SealCheck size={24} />
                        <span style={{ font: "800 9.5px 'Archivo'", letterSpacing: '1.3px', color: 'var(--ok)' }}>VERIFIED ON-CHAIN</span>
                        <span style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>tx {truncHash(c.change_txid)}</span>
                      </>
                    ) : (
                      <>
                        <Spinner size={22} />
                        <span style={{ font: "800 9.5px 'Archivo'", letterSpacing: '1.3px', color: 'var(--warn)' }}>AWAITING ANCHOR</span>
                        <span style={{ font: "400 11px 'JetBrains Mono',monospace", color: 'var(--text2)' }}>in mempool</span>
                      </>
                    )}
                    <span style={{ flex: 1 }} />
                    <span style={{ font: "700 11px 'Archivo'", color: 'var(--accent)' }}>Open record →</span>
                  </div>
                </div>
              )
            })}
          </div>
          <Pager page={current} pages={pages} onPrev={() => onPage(Math.max(1, current - 1))} onNext={() => onPage(Math.min(pages, current + 1))} />
        </>
      )}
    </div>
  )
}
