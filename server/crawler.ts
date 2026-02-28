import Parser from 'rss-parser'
import crypto from 'crypto'
import type { Source } from './db.js'

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HeadlineAnchor/1.0; +https://github.com/bsv-blockchain-demos)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
})

export interface RawHeadline {
  title: string
  description: string | null
  url: string
  contentHash: string
}

export function computeHash(title: string, description: string | null): string {
  const input = title + '|' + (description ?? '')
  return 'sha256:' + crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

export async function fetchFeed(source: Source): Promise<RawHeadline[]> {
  try {
    const feed = await parser.parseURL(source.feed_url)
    return extractHeadlines(feed)
  } catch (err) {
    console.error(`[crawler] Failed to fetch feed for ${source.name}:`, err)
    return []
  }
}

function extractHeadlines(feed: Parser.Output<Parser.Item>): RawHeadline[] {
  const headlines: RawHeadline[] = []

  for (const item of feed.items) {
    const title = (item.title ?? '').trim()
    const link = (item.link ?? '').trim()
    const guid = (item.guid ?? '').trim()
    // Prefer link, but fall back to guid if link is just a bare domain
    const url = (link && new URL(link).pathname.length > 1 ? link : guid || link)
    if (!title || !url) continue

    const raw = (item.contentSnippet ?? item.content ?? item.summary ?? '').trim()
    const description = raw ? (raw.length > 1024 ? raw.slice(0, 1024) : raw) : null
    const contentHash = computeHash(title, description)

    headlines.push({ title, description, url, contentHash })
  }

  return headlines
}
