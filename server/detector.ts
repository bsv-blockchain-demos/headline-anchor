import type { Source } from './db.js'
import type { RawHeadline } from './crawler.js'
import { getHeadlineByUrl, insertHeadline, updateHeadline, insertChange } from './db.js'
import { anchorHash } from './anchor.js'

export async function processHeadlines(source: Source, headlines: RawHeadline[]) {
  let newCount = 0
  let changedCount = 0

  for (const raw of headlines) {
    const existing = await getHeadlineByUrl(raw.url)

    if (!existing) {
      const txid = await anchorHash(raw.contentHash)

      await insertHeadline(
        source.id, raw.title, raw.description, raw.url,
        raw.contentHash, txid, new Date().toISOString()
      )
      newCount++
    } else if (existing.content_hash !== raw.contentHash) {
      // Content changed — anchor the new hash
      const newTxid = await anchorHash(raw.contentHash)

      await insertChange(
        existing.id, existing.title, raw.title,
        existing.description, raw.description,
        existing.content_hash, raw.contentHash,
        newTxid, new Date().toISOString()
      )

      await updateHeadline(existing.id, raw.title, raw.description, raw.contentHash, newTxid)
      changedCount++
    }
  }

  if (newCount > 0 || changedCount > 0) {
    console.log(`[detector] ${source.name}: ${newCount} new, ${changedCount} changed`)
  }
}
