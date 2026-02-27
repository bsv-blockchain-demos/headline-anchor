import { getAllSources, type Source } from './db.js'
import { fetchFeed } from './crawler.js'
import { processHeadlines } from './detector.js'

const timers: Map<number, ReturnType<typeof setInterval>> = new Map()

async function pollSource(source: Source) {
  try {
    const headlines = await fetchFeed(source)
    if (headlines.length > 0) {
      await processHeadlines(source, headlines)
    }
  } catch (err) {
    console.error(`[scheduler] Error polling ${source.name}:`, err)
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
}

export function stopScheduler() {
  for (const timer of timers.values()) {
    clearInterval(timer)
  }
  timers.clear()
  console.log('[scheduler] Stopped all polling')
}
