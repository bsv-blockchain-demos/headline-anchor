import type { Headline, HeadlineChange, Source, Stats, PaginatedResponse } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function fetchHeadlines(page = 1, limit = 20, source?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (source) params.set('source', source)
  return get<PaginatedResponse<Headline>>(`/headlines?${params}`)
}

export function fetchHeadline(id: number) {
  return get<Headline>(`/headlines/${id}`)
}

export function fetchChanges(page = 1, limit = 20, source?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (source) params.set('source', source)
  return get<PaginatedResponse<HeadlineChange>>(`/changes?${params}`)
}

export function fetchChange(id: number) {
  return get<HeadlineChange>(`/changes/${id}`)
}

export function fetchSources() {
  return get<Source[]>('/sources')
}

export function fetchStats() {
  return get<Stats>('/stats')
}
