export interface Headline {
  id: number
  source_id: number
  source_name: string
  title: string
  description: string | null
  url: string
  content_hash: string
  txid: string | null
  first_seen_at: string
  created_at: string
}

export interface HeadlineChange {
  id: number
  headline_id: number
  source_name: string
  url: string
  original_txid: string | null
  old_title: string
  new_title: string
  old_description: string | null
  new_description: string | null
  old_hash: string
  new_hash: string
  change_txid: string | null
  detected_at: string
}

export interface Source {
  id: number
  name: string
  feed_url: string
  enabled: number
  poll_interval_seconds: number
}

export interface Stats {
  headlines: number
  changes: number
  sources: number
  anchored: number
  uptimeSeconds: number
}

export interface PaginatedResponse<T> {
  page: number
  limit: number
  data: T[]
}
