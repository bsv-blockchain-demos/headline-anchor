import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'headline-anchor.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    feed_url TEXT NOT NULL UNIQUE,
    enabled INTEGER DEFAULT 1,
    poll_interval_seconds INTEGER DEFAULT 300
  );

  CREATE TABLE IF NOT EXISTS headlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    txid TEXT,
    first_seen_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_headlines_url ON headlines(url);

  CREATE TABLE IF NOT EXISTS headline_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headline_id INTEGER NOT NULL REFERENCES headlines(id),
    old_title TEXT NOT NULL,
    new_title TEXT NOT NULL,
    old_description TEXT,
    new_description TEXT,
    old_hash TEXT NOT NULL,
    new_hash TEXT NOT NULL,
    change_txid TEXT,
    detected_at TEXT NOT NULL
  );
`)

// --- Sources ---

export interface Source {
  id: number
  name: string
  feed_url: string
  enabled: number
  poll_interval_seconds: number
}

const stmtGetSourceByUrl = db.prepare('SELECT * FROM sources WHERE feed_url = ?')
const stmtInsertSource = db.prepare(
  'INSERT INTO sources (name, feed_url, poll_interval_seconds) VALUES (?, ?, ?)'
)
const stmtGetAllSources = db.prepare('SELECT * FROM sources WHERE enabled = 1')

export function getOrCreateSource(name: string, feedUrl: string, pollInterval: number): Source {
  const existing = stmtGetSourceByUrl.get(feedUrl) as Source | undefined
  if (existing) return existing
  const info = stmtInsertSource.run(name, feedUrl, pollInterval)
  return { id: info.lastInsertRowid as number, name, feed_url: feedUrl, enabled: 1, poll_interval_seconds: pollInterval }
}

export function getAllSources(): Source[] {
  return stmtGetAllSources.all() as Source[]
}

// --- Headlines ---

export interface Headline {
  id: number
  source_id: number
  title: string
  description: string | null
  url: string
  content_hash: string
  txid: string | null
  first_seen_at: string
  created_at: string
}

const stmtGetHeadlineByUrl = db.prepare('SELECT * FROM headlines WHERE url = ?')
const stmtInsertHeadline = db.prepare(
  'INSERT INTO headlines (source_id, title, description, url, content_hash, txid, first_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
)
const stmtUpdateHeadline = db.prepare(
  'UPDATE headlines SET title = ?, description = ?, content_hash = ?, txid = ? WHERE id = ?'
)

export function getHeadlineByUrl(url: string): Headline | undefined {
  return stmtGetHeadlineByUrl.get(url) as Headline | undefined
}

export function insertHeadline(
  sourceId: number, title: string, description: string | null, url: string,
  contentHash: string, txid: string | null, firstSeenAt: string
): Headline {
  const info = stmtInsertHeadline.run(sourceId, title, description, url, contentHash, txid, firstSeenAt)
  return {
    id: info.lastInsertRowid as number, source_id: sourceId, title, description,
    url, content_hash: contentHash, txid, first_seen_at: firstSeenAt, created_at: new Date().toISOString()
  }
}

export function updateHeadline(id: number, title: string, description: string | null, contentHash: string, txid: string | null) {
  stmtUpdateHeadline.run(title, description, contentHash, txid, id)
}

export function getRecentHeadlines(page: number, limit: number, sourceName?: string) {
  const offset = (page - 1) * limit
  if (sourceName) {
    return db.prepare(`
      SELECT h.*, s.name as source_name FROM headlines h
      JOIN sources s ON h.source_id = s.id
      WHERE s.name = ?
      ORDER BY h.first_seen_at DESC LIMIT ? OFFSET ?
    `).all(sourceName, limit, offset) as (Headline & { source_name: string })[]
  }
  return db.prepare(`
    SELECT h.*, s.name as source_name FROM headlines h
    JOIN sources s ON h.source_id = s.id
    ORDER BY h.first_seen_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as (Headline & { source_name: string })[]
}

export function getHeadlineById(id: number) {
  return db.prepare(`
    SELECT h.*, s.name as source_name FROM headlines h
    JOIN sources s ON h.source_id = s.id
    WHERE h.id = ?
  `).get(id) as (Headline & { source_name: string }) | undefined
}

// --- Changes ---

export interface HeadlineChange {
  id: number
  headline_id: number
  old_title: string
  new_title: string
  old_description: string | null
  new_description: string | null
  old_hash: string
  new_hash: string
  change_txid: string | null
  detected_at: string
}

const stmtInsertChange = db.prepare(
  `INSERT INTO headline_changes (headline_id, old_title, new_title, old_description, new_description, old_hash, new_hash, change_txid, detected_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

export function insertChange(
  headlineId: number, oldTitle: string, newTitle: string,
  oldDesc: string | null, newDesc: string | null,
  oldHash: string, newHash: string,
  changeTxid: string | null, detectedAt: string
): HeadlineChange {
  const info = stmtInsertChange.run(headlineId, oldTitle, newTitle, oldDesc, newDesc, oldHash, newHash, changeTxid, detectedAt)
  return {
    id: info.lastInsertRowid as number, headline_id: headlineId,
    old_title: oldTitle, new_title: newTitle,
    old_description: oldDesc, new_description: newDesc,
    old_hash: oldHash, new_hash: newHash,
    change_txid: changeTxid, detected_at: detectedAt
  }
}

export function getRecentChanges(page: number, limit: number, sourceName?: string) {
  const offset = (page - 1) * limit
  if (sourceName) {
    return db.prepare(`
      SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
      JOIN headlines h ON hc.headline_id = h.id
      JOIN sources s ON h.source_id = s.id
      WHERE s.name = ?
      ORDER BY hc.detected_at DESC LIMIT ? OFFSET ?
    `).all(sourceName, limit, offset) as (HeadlineChange & { url: string; original_txid: string | null; source_name: string })[]
  }
  return db.prepare(`
    SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
    JOIN headlines h ON hc.headline_id = h.id
    JOIN sources s ON h.source_id = s.id
    ORDER BY hc.detected_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as (HeadlineChange & { url: string; original_txid: string | null; source_name: string })[]
}

export function getChangeById(id: number) {
  return db.prepare(`
    SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
    JOIN headlines h ON hc.headline_id = h.id
    JOIN sources s ON h.source_id = s.id
    WHERE hc.id = ?
  `).get(id) as (HeadlineChange & { url: string; original_txid: string | null; source_name: string }) | undefined
}

// --- Stats ---

export function getStats() {
  const headlines = (db.prepare('SELECT COUNT(*) as count FROM headlines').get() as { count: number }).count
  const changes = (db.prepare('SELECT COUNT(*) as count FROM headline_changes').get() as { count: number }).count
  const sources = (db.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').get() as { count: number }).count
  const anchored = (db.prepare('SELECT COUNT(*) as count FROM headlines WHERE txid IS NOT NULL').get() as { count: number }).count
  return { headlines, changes, sources, anchored }
}

export default db
