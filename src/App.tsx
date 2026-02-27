import React, { useState, useEffect } from 'react'
import { HeadlineFeed } from './components/HeadlineFeed'
import { ChangesFeed } from './components/ChangesFeed'
import { SourceFilter } from './components/SourceFilter'
import { FundingPage } from './components/FundingPage'
import { fetchStats } from './api'
import type { Stats } from './types'

type Tab = 'headlines' | 'changes' | 'stats' | 'fund'

export function App() {
  const [tab, setTab] = useState<Tab>('headlines')
  const [source, setSource] = useState<string | undefined>()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (tab === 'stats') {
      fetchStats().then(setStats).catch(console.error)
    }
  }, [tab])

  return (
    <div>
      <header style={styles.header}>
        <h1 style={styles.title}>HeadlineAnchor</h1>
        <p style={styles.subtitle}>Immutable news accountability on BSV</p>
      </header>

      <nav style={styles.nav}>
        {(['headlines', 'changes', 'stats', 'fund'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {}),
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {(tab === 'headlines' || tab === 'changes') && (
        <SourceFilter selected={source} onChange={setSource} />
      )}

      {tab === 'headlines' && <HeadlineFeed source={source} />}
      {tab === 'changes' && <ChangesFeed source={source} />}
      {tab === 'stats' && <StatsView stats={stats} />}
      {tab === 'fund' && <FundingPage />}
    </div>
  )
}

function StatsView({ stats }: { stats: Stats | null }) {
  if (!stats) return <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p>

  const uptime = formatUptime(stats.uptimeSeconds)

  return (
    <div style={styles.statsGrid}>
      <StatCard label="Headlines Tracked" value={stats.headlines} />
      <StatCard label="On-Chain Anchors" value={stats.anchored} />
      <StatCard label="Changes Detected" value={stats.changes} />
      <StatCard label="Active Sources" value={stats.sources} />
      <StatCard label="Uptime" value={uptime} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    textAlign: 'center',
    padding: '2rem 0 1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
    marginTop: '0.25rem',
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '0.5rem 1.5rem',
    border: '1px solid #333',
    borderRadius: '6px',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#1a1a2e',
    color: '#fff',
    borderColor: '#4a9eff',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '1rem',
    padding: '1rem 0',
  },
  statCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#4a9eff',
  },
  statLabel: {
    color: '#888',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
}
