// Shared formatting helpers.

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

// Strip an optional "sha256:" / "sha-256:" prefix and return the bare hash.
export function bareHash(hash: string): string {
  return hash.replace(/^sha-?256:/i, '')
}

export function truncHash(hash: string | null): string {
  if (!hash) return ''
  const bare = bareHash(hash)
  if (bare.length <= 18) return bare
  return bare.slice(0, 8) + '…' + bare.slice(-8)
}

// The exact content the server hashes: title + '|' + description.
export function hashInput(title: string, description: string | null): string {
  return title + '|' + (description ?? '')
}

export function formatNumber(n: number): string {
  return Number(n).toLocaleString('en-US')
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}
