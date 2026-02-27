import { getAllSources, type Source, getUnanchoredHeadlines, getUnanchoredChanges, setHeadlineTxid, setChangeTxid } from './db.js'
import { fetchFeed } from './crawler.js'
import { processHeadlines } from './detector.js'
import { anchorHash, isLowFunds, clearLowFunds } from './anchor.js'

const timers: Map<number, ReturnType<typeof setInterval>> = new Map()
let retryTimer: ReturnType<typeof setInterval> | null = null

async function pollSource(source: Source) {
  const start = performance.now()
  try {
    const headlines = await fetchFeed(source)
    const ms = (performance.now() - start).toFixed(0)
    console.log(`[scheduler] Polled ${source.name}: ${headlines.length} headlines (${ms}ms)`)
    if (headlines.length > 0) {
      await processHeadlines(source, headlines)
    }
  } catch (err) {
    const ms = (performance.now() - start).toFixed(0)
    console.error(`[scheduler] Error polling ${source.name} (${ms}ms):`, err)
  }
}

async function retryUnanchored() {
  const headlines = await getUnanchoredHeadlines()
  const changes = await getUnanchoredChanges()
  const total = headlines.length + changes.length

  if (total === 0) return

  // If low on funds, clear flag to test one anchor
  if (isLowFunds()) clearLowFunds()

  let retried = 0

  for (const h of headlines) {
    if (isLowFunds()) break
    const txid = await anchorHash(h.content_hash)
    if (!txid) {
      if (isLowFunds()) break
      continue
    }
    await setHeadlineTxid(h.id, txid, h.content_hash)
    retried++
  }

  for (const c of changes) {
    if (isLowFunds()) break
    const txid = await anchorHash(c.new_hash)
    if (!txid) {
      if (isLowFunds()) break
      continue
    }
    await setChangeTxid(c.id, txid)
    retried++
  }

  if (retried > 0) {
    console.log(`[retry] Anchored ${retried}/${total} pending items`)
  }
  if (isLowFunds() && total - retried > 0) {
    console.log(`[retry] Low funds — ${total - retried} items waiting`)
  }
}

export async function startScheduler() {
  const sources = await getAllSources()
  console.log(`[scheduler] Starting polling for ${sources.length} sources`)

  sources.forEach((source, index) => {
    // Stagger initial fetches by 5 seconds each
    const initialDelay = index * 5000

    setTimeout(() => {
      // Run immediately on first tick
      pollSource(source)

      // Then set up the recurring interval
      const timer = setInterval(
        () => pollSource(source),
        source.poll_interval_seconds * 1000
      )
      timers.set(source.id, timer)
    }, initialDelay)
  })

  // Retry unanchored items on startup + every 60s
  retryUnanchored()
  retryTimer = setInterval(retryUnanchored, 60000)
}

export function stopScheduler() {
  for (const timer of timers.values()) {
    clearInterval(timer)
  }
  timers.clear()
  if (retryTimer) {
    clearInterval(retryTimer)
    retryTimer = null
  }
  console.log('[scheduler] Stopped all polling')
}
