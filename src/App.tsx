import React, { useState, useEffect } from 'react'
import { fetchSources, fetchStats, fetchChanges, fetchHeadlines } from './api'
import type { Headline, HeadlineChange, Stats } from './types'
import { formatNumber, formatUptime } from './format'
import { HaMark } from './components/HaMark'
import { LiveWire } from './components/LiveWire'
import { ChangesFeed } from './components/ChangesFeed'
import { ChangeDetail } from './components/ChangeDetail'
import { HeadlineFeed } from './components/HeadlineFeed'
import { StatsView } from './components/StatsView'
import { FundModal } from './components/FundingPage'
import { LiveDot } from './components/ui'
import { IconSun, IconMoon, IconGitHub } from './icons'

type Theme = 'dark' | 'light'
type ContentTab = 'headlines' | 'changes' | 'stats'
const REPO_URL = 'https://github.com/bsv-blockchain-demos/headline-anchor'
const WINDOW = 40

interface Route { tab: ContentTab; id: number | null }

function parseHash(): { route: Route; fund: boolean } {
  const raw = (window.location.hash || '').replace(/^#/, '')
  if (raw === 'fund') return { route: { tab: 'changes', id: null }, fund: true }
  const detail = raw.match(/^changes\/(\d+)$/)
  if (detail) return { route: { tab: 'changes', id: Number(detail[1]) }, fund: false }
  const [t] = raw.split('/')
  const tab: ContentTab = t === 'headlines' || t === 'stats' ? (t as ContentTab) : 'changes'
  return { route: { tab, id: null }, fund: false }
}

function navigate(hash: string) {
  window.location.hash = hash
}

export function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [route, setRoute] = useState<Route>(() => parseHash().route)
  const [fundOpen, setFundOpen] = useState<boolean>(() => parseHash().fund)

  const [source, setSourceState] = useState('All')
  const [chPage, setChPage] = useState(1)
  const [hlPage, setHlPage] = useState(1)

  const [sourceNames, setSourceNames] = useState<string[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [uptime, setUptime] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [changes, setChanges] = useState<HeadlineChange[]>([])
  const [headlines, setHeadlines] = useState<Headline[]>([])
  const [chLoading, setChLoading] = useState(true)
  const [hlLoading, setHlLoading] = useState(true)

  // Theme -> root attribute (drives the CSS token layer).
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  // Hash routing. #fund toggles the modal without changing the content route.
  useEffect(() => {
    const apply = () => {
      const { route: r, fund } = parseHash()
      setFundOpen(fund)
      if (!fund) setRoute(r)
      else if (window.location.hash.replace(/^#/, '') === 'fund') { /* keep current content route */ }
    }
    if (!window.location.hash) navigate('#changes')
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  // Initial data.
  const loadBalance = () => {
    fetch('/api/wallet/balance').then((r) => r.json()).then((d) => setBalance(d.satoshis)).catch(() => {})
  }
  useEffect(() => {
    fetchSources().then((ss) => setSourceNames(ss.map((s) => s.name))).catch(() => {})
    fetchStats().then((st) => { setStats(st); setUptime(st.uptimeSeconds) }).catch(() => {})
    fetchChanges(1, WINDOW).then((r) => setChanges(r.data)).catch(() => {}).finally(() => setChLoading(false))
    fetchHeadlines(1, WINDOW).then((r) => setHeadlines(r.data)).catch(() => {}).finally(() => setHlLoading(false))
    loadBalance()
    const bal = setInterval(loadBalance, 30000)
    const tick = setInterval(() => setUptime((u) => (u == null ? u : u + 1)), 1000)
    return () => { clearInterval(bal); clearInterval(tick) }
  }, [])

  // Navigation via hash (the effect above turns it into state).
  const contentHash = route.id != null && route.tab === 'changes' ? `#changes/${route.id}` : `#${route.tab}`
  const goTab = (t: ContentTab) => navigate(`#${t}`)
  const openFund = () => navigate('#fund')
  const closeFund = () => navigate(contentHash)
  const openDetail = (id: number) => navigate(`#changes/${id}`)
  const setSource = (s: string) => { setSourceState(s); setChPage(1); setHlPage(1) }

  const statsNums = stats ? { headlines: stats.headlines, anchors: stats.anchored, changes: stats.changes, sources: stats.sources } : null
  const uptimeLabel = uptime == null ? '—' : formatUptime(uptime)

  const isDetail = route.tab === 'changes' && route.id != null

  const tabDefs: [string, ContentTab][] = [['Headlines', 'headlines'], ['Changes', 'changes'], ['Stats', 'stats']]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 22px 40px' }}>
      {/* masthead */}
      <div style={{ height: 4, background: 'var(--text)', marginTop: 22 }} />
      <div style={{ height: 1, background: 'var(--text)', marginTop: 2 }} />
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 0', flexWrap: 'wrap' }}>
        <a href="#changes" style={{ display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none' }}>
          <HaMark size={44} idSuffix="head" />
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ font: "900 24px/1 'Archivo'", letterSpacing: '-.7px', color: 'var(--text)' }}>Headline Anchor</div>
            <div style={{ font: "500 9px/1 'JetBrains Mono',monospace", color: 'var(--text2)', marginTop: 9, letterSpacing: '1.4px', textTransform: 'uppercase' }}>immutable news accountability on BSV Blockchain</div>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <button onClick={openFund} title="Fund the server wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: "700 13px 'Archivo'", color: 'var(--ok)', background: 'var(--okBg)', border: '1px solid var(--okBorder)', borderRadius: 2, padding: '8px 13px', cursor: 'pointer' }}>
            <LiveDot size={6} />
            {balance == null ? '—' : formatNumber(balance)}<span style={{ color: 'var(--text2)', fontWeight: 600, fontSize: 11 }}>sats</span>
          </button>
          <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} title="Toggle theme" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, color: 'var(--text2)', cursor: 'pointer' }}>
            {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
        </div>
      </header>

      <LiveWire changes={changes} />

      {/* nav */}
      <nav style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 26, overflowX: 'auto' }}>
        {tabDefs.map(([name, key]) => {
          const active = !fundOpen && route.tab === key
          return (
            <button
              key={key}
              onClick={() => goTab(key)}
              style={{ font: `${active ? 700 : 600} 13px 'Archivo'`, letterSpacing: '.2px', whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, borderRadius: 0, padding: '12px 2px', marginRight: 26, color: active ? 'var(--text)' : 'var(--text2)' }}
            >
              {name}
            </button>
          )
        })}
      </nav>

      {/* content */}
      <div>
        {isDetail && <ChangeDetail id={route.id!} onBack={() => goTab('changes')} />}
        {!isDetail && route.tab === 'changes' && (
          <ChangesFeed changes={changes} sourceNames={sourceNames} source={source} onSource={setSource} page={chPage} onPage={setChPage} onOpen={openDetail} loading={chLoading} />
        )}
        {route.tab === 'headlines' && (
          <HeadlineFeed headlines={headlines} sourceNames={sourceNames} source={source} onSource={setSource} page={hlPage} onPage={setHlPage} stats={statsNums} uptimeLabel={uptimeLabel} loading={hlLoading} />
        )}
        {route.tab === 'stats' && <StatsView stats={statsNums} uptimeLabel={uptimeLabel} />}
      </div>

      {/* footer */}
      <footer style={{ marginTop: 44, borderTop: '1px solid var(--text)', padding: '20px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HaMark size={34} idSuffix="foot" />
          <div style={{ lineHeight: 1.35 }}>
            <div style={{ font: "900 14px 'Archivo'", letterSpacing: '-.3px', color: 'var(--text)' }}>Headline Anchor</div>
            <div style={{ font: "500 9px 'JetBrains Mono',monospace", color: 'var(--muted)', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: 4 }}>immutable news accountability on BSV Blockchain</div>
          </div>
        </div>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: "600 12px 'Archivo'", color: 'var(--text2)', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, padding: '8px 13px' }}>
          <IconGitHub size={15} />GitHub
        </a>
      </footer>

      {fundOpen && <FundModal balance={balance} onClose={closeFund} onFunded={loadBalance} />}
    </div>
  )
}
