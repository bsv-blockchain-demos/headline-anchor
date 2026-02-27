import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  initDb, syncSources, getAllSources,
  getRecentHeadlines, getHeadlineById,
  getRecentChanges, getChangeById,
  getStats,
} from './db.js'
import { startScheduler } from './scheduler.js'
import { getWallet, startBalanceMonitor, createFundingRequest, receiveFunding, getBalanceSatoshis } from './wallet.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.PORT ?? '3000', 10)
const startTime = Date.now()

app.use(express.json())

// --- API Routes ---

app.get('/api/headlines', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const source = req.query.source as string | undefined
  const headlines = await getRecentHeadlines(page, limit, source)
  res.json({ page, limit, data: headlines })
})

app.get('/api/headlines/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const headline = await getHeadlineById(id)
  if (!headline) return res.status(404).json({ error: 'Not found' })
  res.json(headline)
})

app.get('/api/changes', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const source = req.query.source as string | undefined
  const changes = await getRecentChanges(page, limit, source)
  res.json({ page, limit, data: changes })
})

app.get('/api/changes/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  const change = await getChangeById(id)
  if (!change) return res.status(404).json({ error: 'Not found' })
  res.json(change)
})

app.get('/api/sources', async (_req, res) => {
  const sources = await getAllSources()
  res.json(sources)
})

app.get('/api/wallet/balance', async (_req, res) => {
  try {
    const satoshis = await getBalanceSatoshis()
    res.json({ satoshis })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/wallet/request', async (req, res) => {
  try {
    const satoshis = Math.max(1, parseInt(req.query.satoshis as string) || 50000)
    const request = await createFundingRequest(satoshis)
    res.json(request)
  } catch (err: any) {
    console.error('[wallet] Request failed:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/wallet/receive', async (req, res) => {
  try {
    const { tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex } = req.body
    if (!tx || !senderIdentityKey || !derivationPrefix || !derivationSuffix || outputIndex == null) {
      return res.status(400).json({ error: 'Missing required fields: tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex' })
    }
    await receiveFunding({ tx, senderIdentityKey, derivationPrefix, derivationSuffix, outputIndex })
    res.json({ success: true })
  } catch (err: any) {
    console.error('[wallet] Receive failed:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/stats', async (_req, res) => {
  const stats = await getStats()
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000)
  res.json({ ...stats, uptimeSeconds })
})

// --- Static file serving (production) ---
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// --- Start ---
async function start() {
  await initDb()

  // Sync sources from config — config file is the source of truth
  const configPath = path.join(__dirname, '..', 'sources.config.json')
  if (fs.existsSync(configPath)) {
    const sources = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Array<{
      name: string; feedUrl: string; pollInterval: number
    }>
    await syncSources(sources)
    console.log(`[server] Synced ${sources.length} sources from config`)
  }

  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`)
    getWallet()
      .then(() => startBalanceMonitor())
      .catch(err => console.error('[wallet] Init failed:', err))
    startScheduler()
  })
}

start().catch(err => {
  console.error('[server] Failed to start:', err)
  process.exit(1)
})
