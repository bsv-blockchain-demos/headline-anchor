import type { Source } from './db.js'
import type { RawHeadline } from './crawler.js'
import { getHeadlineByUrl, insertHeadline, updateHeadline, insertChange } from './db.js'
import { anchorHeadline, anchorChange } from './anchor.js'

export async function processHeadlines(source: Source, headlines: RawHeadline[]) {
  let newCount = 0
  let changedCount = 0

  for (const raw of headlines) {
    const existing = getHeadlineByUrl(raw.url)

    if (!existing) {
      // New headline — anchor hash only
      const txid = await anchorHeadline({
        contentHash: raw.contentHash,
      })

      insertHeadline(
        source.id, raw.title, raw.description, raw.url,
        raw.contentHash, txid, new Date().toISOString()
      )
      newCount++
    } else if (existing.content_hash !== raw.contentHash) {
      // Content changed — anchor prev/curr hashes only
      let changeTxid: string | null = null

      if (existing.txid) {
        changeTxid = await anchorChange({
          ref: existing.txid,
          prevHash: existing.content_hash,
          currHash: raw.contentHash,
        })
      }

      insertChange(
        existing.id, existing.title, raw.title,
        existing.description, raw.description,
        existing.content_hash, raw.contentHash,
        changeTxid, new Date().toISOString()
      )

      // Re-anchor the updated hash
      const newTxid = await anchorHeadline({
        contentHash: raw.contentHash,
      })

      updateHeadline(existing.id, raw.title, raw.description, raw.contentHash, newTxid)
      changedCount++
    }
    // If hash matches, skip (no change)
  }

  if (newCount > 0 || changedCount > 0) {
    console.log(`[detector] ${source.name}: ${newCount} new, ${changedCount} changed`)
  }
}
