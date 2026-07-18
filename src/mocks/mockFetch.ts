/**
 * Gated window.fetch interceptor for design-phase previews. THROWAWAY.
 *
 * Self-installs at import time ONLY when VITE_USE_FIXTURES === 'true', so this
 * module is an inert no-op in normal dev/prod runs. It intercepts every /api/*
 * request and answers from src/mocks/fixtures.ts, letting the whole UI render
 * (including FundingPage's direct balance fetch) with no backend, DB, or wallet.
 *
 * Run it with:  npm run dev:client -- --mode fixtures
 * (mac/linux alt: VITE_USE_FIXTURES=true npm run dev:client)
 *
 * Do NOT merge this branch's main.tsx import into main. Restyled components are
 * safe to cherry-pick; the fixtures plumbing is preview-only.
 */
import { headlines, changes, sources, stats, walletBalanceSatoshis } from './fixtures'

const ENABLED = import.meta.env.VITE_USE_FIXTURES === 'true'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface MockResult {
  status: number
  body: unknown
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

function resolve(pathname: string, params: URLSearchParams, method: string): MockResult | null {
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '20', 10) || 20))
  const source = params.get('source') ?? undefined

  // Collection endpoints
  if (pathname === '/api/headlines') {
    const filtered = source ? headlines.filter((h) => h.source_name === source) : headlines
    return { status: 200, body: { page, limit, data: paginate(filtered, page, limit) } }
  }
  if (pathname === '/api/changes') {
    const filtered = source ? changes.filter((c) => c.source_name === source) : changes
    return { status: 200, body: { page, limit, data: paginate(filtered, page, limit) } }
  }
  if (pathname === '/api/sources') {
    return { status: 200, body: sources }
  }
  if (pathname === '/api/stats') {
    return { status: 200, body: stats }
  }
  if (pathname === '/api/wallet/balance') {
    return { status: 200, body: { satoshis: walletBalanceSatoshis } }
  }
  if (pathname === '/api/wallet/request') {
    // The real fund button also needs a BRC-100 wallet extension, so clicking
    // "Connect Wallet & Fund" still lands in the error state (styleable). This
    // just keeps the request itself from 500-ing if reached.
    return {
      status: 200,
      body: {
        serverIdentityKey: '02'.padEnd(66, '0'),
        derivationPrefix: 'mock-prefix',
        derivationSuffix: 'mock-suffix',
        satoshis: Math.max(1, parseInt(params.get('satoshis') ?? '50000', 10) || 50000),
        memo: 'fixtures preview',
      },
    }
  }
  if (pathname === '/api/wallet/receive' && method === 'POST') {
    return { status: 200, body: { success: true } }
  }

  // Item endpoints: /api/headlines/:id and /api/changes/:id
  const hMatch = pathname.match(/^\/api\/headlines\/(\d+)$/)
  if (hMatch) {
    const found = headlines.find((h) => h.id === Number(hMatch[1]))
    return found ? { status: 200, body: found } : { status: 404, body: { error: 'Not found' } }
  }
  const cMatch = pathname.match(/^\/api\/changes\/(\d+)$/)
  if (cMatch) {
    const found = changes.find((c) => c.id === Number(cMatch[1]))
    return found ? { status: 200, body: found } : { status: 404, body: { error: 'Not found' } }
  }

  return null
}

export function installMockFetch() {
  if (!ENABLED) return

  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

    let parsed: URL
    try {
      parsed = new URL(url, window.location.origin)
    } catch {
      return original(input, init)
    }

    if (!parsed.pathname.startsWith('/api/')) {
      return original(input, init)
    }

    const result = resolve(parsed.pathname, parsed.searchParams, method)
    if (!result) {
      return new Response(JSON.stringify({ error: 'No fixture for ' + parsed.pathname }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Small delay so loading states are visible and designable.
    await delay(250)
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // eslint-disable-next-line no-console
  console.info('%c[fixtures] /api/* served from src/mocks/fixtures.ts (design preview mode)', 'color:#4a9eff')
}

installMockFetch()
