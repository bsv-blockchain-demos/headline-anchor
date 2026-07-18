import React from 'react'
import { formatNumber } from '../format'
import { useCountUp } from '../hooks'
import { SectionHeader, LiveDot } from './ui'
import { IconList, IconCheck, IconTrending, IconFlag, IconClock, Sparkline } from '../icons'

interface StatsNums { headlines: number; anchors: number; changes: number; sources: number }

function FigureCell({ icon, value, label, valueColor = 'var(--text)', labelColor = 'var(--text2)', cellBg, last = false, footer }: {
  icon: React.ReactNode; value: string; label: string; valueColor?: string; labelColor?: string; cellBg?: string; last?: boolean; footer?: React.ReactNode
}) {
  return (
    <div style={{ padding: '22px 20px', borderRight: last ? 'none' : '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: cellBg }}>
      <div style={{ marginBottom: 14 }}>{icon}</div>
      <div style={{ font: "800 34px/1 'Archivo'", color: valueColor, letterSpacing: '-1.5px' }}>{value}</div>
      {footer ?? <div style={{ font: "700 9px 'Archivo'", letterSpacing: '1.3px', color: labelColor, marginTop: 9 }}>{label}</div>}
    </div>
  )
}

export function StatsView({ stats, uptimeLabel }: { stats: StatsNums | null; uptimeLabel: string }) {
  const headlines = useCountUp(stats?.headlines ?? 0, !!stats)
  const anchors = useCountUp(stats?.anchors ?? 0, !!stats)
  const changes = useCountUp(stats?.changes ?? 0, !!stats)
  const sources = useCountUp(stats?.sources ?? 0, !!stats)

  return (
    <div style={{ animation: 'ha-enter .36s cubic-bezier(.2,.7,.2,1)' }}>
      <SectionHeader
        kicker="TELEMETRY"
        title="Ledger at a glance"
        sub="What the anchor has witnessed so far. Numbers only ever go up. Nothing here can be quietly walked back."
        mb={20}
      />

      <div style={{ border: '1px solid var(--text)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <FigureCell icon={<IconList size={18} color="var(--text2)" />} value={formatNumber(headlines)} label="HEADLINES TRACKED" />
        <FigureCell icon={<IconCheck size={18} color="var(--ok)" />} value={formatNumber(anchors)} label="ON-CHAIN ANCHORS" />
        <FigureCell icon={<IconTrending size={18} color="var(--edit)" />} value={formatNumber(changes)} label="EDITS CAUGHT" valueColor="var(--edit)" labelColor="var(--edit)" cellBg="var(--editBg)" />
        <FigureCell icon={<IconFlag size={18} color="var(--text2)" />} value={formatNumber(sources)} label="ACTIVE SOURCES" />
        <FigureCell
          icon={<IconClock size={18} color="var(--ok)" />}
          value={uptimeLabel}
          label="UPTIME"
          valueColor="var(--text)"
          last
          footer={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
              <LiveDot size={6} />
              <span style={{ font: "700 9px 'Archivo'", letterSpacing: '1.3px', color: 'var(--text2)' }}>UPTIME</span>
            </div>
          }
        />
      </div>

      <div style={{ marginTop: 16, border: '1px solid var(--border)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ font: "700 12px 'Archivo'", color: 'var(--text)', marginBottom: 3 }}>Detection rate</div>
          <div style={{ font: "400 12.5px 'Archivo'", color: 'var(--text2)' }}>Roughly one silent edit caught for every four headlines tracked.</div>
        </div>
        <Sparkline />
      </div>
    </div>
  )
}
