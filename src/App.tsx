import React, { useState, useEffect } from 'react'
import { HeadlineFeed } from './components/HeadlineFeed'
import { ChangesFeed } from './components/ChangesFeed'
import { ChangeDetail } from './components/ChangeDetail'
import { SourceFilter } from './components/SourceFilter'
import { FundingPage } from './components/FundingPage'
import { fetchStats } from './api'
import type { Stats } from './types'

type Tab = 'headlines' | 'changes' | 'stats' | 'fund'
const TABS: Tab[] = ['headlines', 'changes', 'stats', 'fund']

function parseHash(): { tab: Tab; changeId?: number } {
  const raw = window.location.hash.replace(/^#/, '')
  const changeMatch = raw.match(/^changes\/(\d+)$/)
  if (changeMatch) return { tab: 'changes', changeId: Number(changeMatch[1]) }
  if (TABS.includes(raw as Tab)) return { tab: raw as Tab }
  return { tab: 'changes' }
}

function navigate(hash: string) {
  window.location.hash = hash
}

export function App() {
  const [route, setRoute] = useState(parseHash)
  const [source, setSource] = useState<string | undefined>()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) navigate('changes')
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const tab = route.tab

  useEffect(() => {
    if (tab === 'stats') {
      fetchStats().then(setStats).catch(console.error)
    }
  }, [tab])

  return (
    <div>
      <header style={styles.header}>
        <a href="#headlines" style={styles.logoLink}>
          <span style={styles.logoAnchor}>&#9875;</span>
          <h1 style={styles.title}>
            <span style={styles.titlePrefix}>Headline</span>
            <span style={styles.titleAccent}>Anchor</span>
          </h1>
        </a>
        <p style={styles.subtitle}>
          <span style={styles.subtitleBracket}>[</span>
          immutable news accountability on BSV
          <span style={styles.subtitleBracket}>]</span>
        </p>
        <a
          href="https://github.com/bsv-blockchain-demos/headline-anchor"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.ghLink}
        >
          GitHub
        </a>
      </header>

      <nav style={styles.nav}>
        {TABS.map((t) => (
          <a
            key={t}
            href={`#${t}`}
            style={{
              ...styles.tab,
              ...(tab === t && !route.changeId ? styles.tabActive : {}),
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </a>
        ))}
      </nav>

      {(tab === 'headlines' || (tab === 'changes' && !route.changeId)) && (
        <SourceFilter selected={source} onChange={setSource} />
      )}

      {tab === 'headlines' && <HeadlineFeed source={source} />}
      {tab === 'changes' && !route.changeId && <ChangesFeed source={source} />}
      {tab === 'changes' && route.changeId && <ChangeDetail id={route.changeId} />}
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
    padding: '2.5rem 0 1.5rem',
  },
  logoLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoAnchor: {
    fontSize: '2.2rem',
    color: '#4a9eff',
    filter: 'drop-shadow(0 0 8px rgba(74, 158, 255, 0.4))',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  titlePrefix: {
    color: '#fff',
  },
  titleAccent: {
    color: '#4a9eff',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '0.8rem',
    marginTop: '0.5rem',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
  },
  subtitleBracket: {
    color: '#4a9eff',
  },
  ghLink: {
    display: 'inline-block',
    marginTop: '0.6rem',
    color: '#aaa',
    fontSize: '0.75rem',
    fontFamily: "'JetBrains Mono', monospace",
    textDecoration: 'none',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '3px 10px',
    letterSpacing: '0.03em',
    transition: 'all 0.15s',
  },
  nav: {
    display: 'flex',
    gap: '0.25rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '4px',
    width: 'fit-content',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tab: {
    padding: '0.45rem 1.25rem',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    letterSpacing: '0.02em',
  },
  tabActive: {
    background: '#1a1a2e',
    color: '#4a9eff',
    boxShadow: '0 0 12px rgba(74, 158, 255, 0.15)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.75rem',
    padding: '1rem 0',
  },
  statCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#4a9eff',
  },
  statLabel: {
    color: '#555',
    fontSize: '0.75rem',
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: '0.4rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
}
