import { getWallet } from './wallet.js'

// Serialize all inscription calls to prevent UTXO race conditions
// when multiple sources poll concurrently
let lock: Promise<void> = Promise.resolve()

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = lock.then(fn, fn)
  lock = result.then(() => {}, () => {})
  return result
}

let lowFunds = false

export function isLowFunds() { return lowFunds }
export function clearLowFunds() { lowFunds = false }

export async function anchorHash(contentHash: string): Promise<string | null> {
  if (lowFunds) return null

  return serialize(async () => {
    if (lowFunds) return null
    try {
      const wallet = await getWallet()
      const hash = contentHash.replace(/^sha256:/, '')
      const result = await wallet.inscribeFileHash(hash)
      console.log(`[anchor] Hash anchored: ${result.txid}`)
      return result.txid
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Insufficient funds')) {
        lowFunds = true
        console.warn('[anchor] Insufficient funds — pausing until balance recovers')
      } else {
        console.error('[anchor] Failed to anchor hash:', err)
      }
      return null
    }
  })
}
