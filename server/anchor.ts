import { getWallet } from './wallet.js'

export interface HeadlineData {
  contentHash: string
}

export interface ChangeData {
  ref: string
  prevHash: string
  currHash: string
}

export async function anchorHeadline(headline: HeadlineData): Promise<string | null> {
  try {
    const wallet = await getWallet()
    const result = await wallet.inscribeJSON({
      p: 'ha',
      t: 'h',
      h: headline.contentHash,
    })
    console.log(`[anchor] Headline anchored: ${result.txid}`)
    return result.txid
  } catch (err) {
    console.error('[anchor] Failed to anchor headline:', err)
    return null
  }
}

export async function anchorChange(change: ChangeData): Promise<string | null> {
  try {
    const wallet = await getWallet()
    const result = await wallet.inscribeJSON({
      p: 'ha',
      t: 'c',
      ref: change.ref,
      ph: change.prevHash,
      ch: change.currHash,
    })
    console.log(`[anchor] Change anchored: ${result.txid}`)
    return result.txid
  } catch (err) {
    console.error('[anchor] Failed to anchor change:', err)
    return null
  }
}
