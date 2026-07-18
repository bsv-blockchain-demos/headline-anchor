import React from 'react'
import type { Headline } from '../types'
import { timeAgo, formatNumber } from '../format'
import { useCountUp } from '../hooks'
import { SectionHeader, Pager } from './ui'
import { SourceFilter } from './SourceFilter'
import { IconCheck } from '../icons'

const PAGE_SIZE = 4

interface StatsNums { headlines: number; anchors: number; changes: number; sources: number }

interface Props {
  headlines: Headline[]
  sourceNames: string[]
  source: string
  onSource: (s: string) => void
  page: number
  onPage: (p: number) => void
  stats: StatsNums | null
  uptimeLabel: string
  loading: boolean
}

function TelemetryCell({ value, label, color = 'var(--text)', labelColor = 'var(--text2)', last = false }: { value: string; label: string; color?: string; labelColor?: string; last?: boolean }) {
  return (
    <div style={{ padding: '15px 16px', borderRight: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ font: "800 26px/1 'Archivo'", color, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ font: "700 8.5px 'Archivo'", letterSpacing: '1.2px', color: labelColor, marginTop: 7 }}>{label}</div>
    </div>
  )
}

function TelemetryStrip({ stats, uptimeLabel }: { stats: StatsNums | null; uptimeLabel: string }) {
  const headlines = useCountUp(stats?.headlines ?? 0, !!stats)
  const anchors = useCountUp(stats?.anchors ?? 0, !!stats)
  const changes = useCountUp(stats?.changes ?? 0, !!stats)
  const sources = useCountUp(stats?.sources ?? 0, !!stats)
  return (
    <div style={{ borderTop: '1px solid var(--text)', borderBottom: '1px solid var(--text)', marginBottom: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))' }}>
      <TelemetryCell value={formatNumber(headlines)} label="TRACKED" />
      <TelemetryCell value={formatNumber(anchors)} label="ANCHORS" />
      <TelemetryCell value={formatNumber(changes)} label="EDITS CAUGHT" color="var(--edit)" labelColor="var(--edit)" />
      <TelemetryCell value={formatNumber(sources)} label="SOURCES" />
      <TelemetryCell value={uptimeLabel} label="UPTIME" color="var(--ok)" last />
    </div>
  )
}

export function HeadlineFeed({ headlines, sourceNames, source, onSource, page, onPage, stats, uptimeLabel, loading }: Props) {
  const filtered = source === 'All' ? headlines : headlines.filter((h) => h.source_name === source)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
      <TelemetryStrip stats={stats} uptimeLabel={uptimeLabel} />

      <SectionHeader
        kicker="THE RECORD"
        title="Tracked headlines"
        sub="Every headline, hashed and anchored the moment we see it: the baseline any later edit is measured against."
      />

      <SourceFilter names={sourceNames} selected={source} onChange={onSource} />

      {loading && filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', font: "400 14px 'Archivo'" }}>Reading the wire…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', font: "400 14px 'Archivo'" }}>No headlines yet. The crawler is warming up.</p>
      ) : (
        <>
          <div>
            {pageItems.map((h) => {
              const anchored = !!h.txid
              return (
                <div
                  key={h.id}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  style={{ borderTop: '1px solid var(--border)', padding: '20px 4px', transition: 'background .15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ font: "700 11px 'Archivo'", textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text)' }}>{h.source_name}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)' }} />
                    <span style={{ font: "400 12px 'Archivo'", color: 'var(--text2)' }}>{timeAgo(h.first_seen_at)}</span>
                    {anchored ? (
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, font: "700 9px 'Archivo'", letterSpacing: '.8px', color: 'var(--ok)' }}>
                        <IconCheck size={10} />ANCHORED
                      </span>
                    ) : (
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, font: "700 9px 'Archivo'", letterSpacing: '.8px', color: 'var(--warn)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)' }} />PENDING
                      </span>
                    )}
                  </div>
                  <div style={{ font: "600 19px/1.35 'Newsreader',serif", color: 'var(--text)', marginBottom: 6, textWrap: 'pretty' as never }}>{h.title}</div>
                  {h.description && <div style={{ font: "400 13.5px/1.6 'Archivo'", color: 'var(--text2)', textWrap: 'pretty' as never }}>{h.description}</div>}
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
