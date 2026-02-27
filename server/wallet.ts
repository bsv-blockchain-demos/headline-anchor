import { ServerWallet } from '@bsv/simple/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WALLET_FILE = path.join(__dirname, '..', '.server-wallet.json')

let wallet: Awaited<ReturnType<typeof ServerWallet.create>> | null = null

function getPrivateKey(): string {
  // 1. Check env
  if (process.env.SERVER_PRIVATE_KEY) {
    return process.env.SERVER_PRIVATE_KEY
  }

  // 2. Check wallet file
  if (fs.existsSync(WALLET_FILE)) {
    const data = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'))
    return data.privateKey
  }

  // 3. Auto-generate
  const privateKey = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(WALLET_FILE, JSON.stringify({ privateKey }, null, 2), { mode: 0o600 })
  console.log('[wallet] Generated new private key, saved to .server-wallet.json')
  return privateKey
}

export async function getWallet() {
  if (!wallet) {
    const privateKey = getPrivateKey()
    console.log('[wallet] Creating ServerWallet...')
    wallet = await ServerWallet.create({
      privateKey,
      network: 'main',
    })
    console.log(`[wallet] ServerWallet initialized — address: ${wallet.getAddress()}`)
  }
  return wallet
}

// Pending payment requests keyed by derivationSuffix
const pendingRequests = new Map<string, { derivationPrefix: string; derivationSuffix: string; satoshis: number }>()

export async function createFundingRequest(satoshis: number) {
  const w = await getWallet()
  const request = w.createPaymentRequest({ satoshis, memo: 'HeadlineAnchor wallet funding' })
  pendingRequests.set(request.derivationSuffix, {
    derivationPrefix: request.derivationPrefix,
    derivationSuffix: request.derivationSuffix,
    satoshis,
  })
  console.log(`[wallet] Created payment request for ${satoshis} sat`)
  return request
}

export async function receiveFunding(payload: {
  tx: number[]
  senderIdentityKey: string
  derivationPrefix: string
  derivationSuffix: string
  outputIndex: number
}) {
  const w = await getWallet()
  await w.receivePayment({
    tx: payload.tx,
    senderIdentityKey: payload.senderIdentityKey,
    derivationPrefix: payload.derivationPrefix,
    derivationSuffix: payload.derivationSuffix,
    outputIndex: payload.outputIndex,
  })
  pendingRequests.delete(payload.derivationSuffix)
  console.log('[wallet] Payment received and internalized')
}

export async function getBalanceSatoshis(): Promise<number> {
  const w = await getWallet()
  const client = w.getClient()
  let total = 0
  let offset = 0
  const pageSize = 100
  while (true) {
    const result = await client.listOutputs({ basket: 'default', limit: pageSize, offset })
    const outputs = result?.outputs ?? []
    total += outputs
      .filter((o: any) => o.spendable !== false)
      .reduce((sum: number, o: any) => sum + (o.satoshis ?? 0), 0)
    if (outputs.length < pageSize) break
    offset += pageSize
  }
  return total
}

let lastKnownBalance = 0

export function startBalanceMonitor(intervalMs = 30000) {
  console.log('[wallet] Balance monitor started (polling every 30s)')
  const check = async () => {
    try {
      const balance = await Promise.race([
        getBalanceSatoshis(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ])
      if (balance !== lastKnownBalance) {
        const diff = balance - lastKnownBalance
        console.log(`[wallet] Balance: ${balance} sat${lastKnownBalance > 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}`)
        lastKnownBalance = balance
      }
    } catch (err) {
      console.error('[wallet] Balance check failed:', err)
    }
  }

  check()
  setInterval(check, intervalMs)
}
