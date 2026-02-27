import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://headline:headline@localhost:5432/headline_anchor',
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sources (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      feed_url TEXT NOT NULL UNIQUE,
      enabled BOOLEAN DEFAULT true,
      poll_interval_seconds INTEGER DEFAULT 300
    );

    CREATE TABLE IF NOT EXISTS headlines (
      id SERIAL PRIMARY KEY,
      source_id INTEGER NOT NULL REFERENCES sources(id),
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      txid TEXT,
      first_seen_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_headlines_url ON headlines(url);

    CREATE TABLE IF NOT EXISTS headline_changes (
      id SERIAL PRIMARY KEY,
      headline_id INTEGER NOT NULL REFERENCES headlines(id),
      old_title TEXT NOT NULL,
      new_title TEXT NOT NULL,
      old_description TEXT,
      new_description TEXT,
      old_hash TEXT NOT NULL,
      new_hash TEXT NOT NULL,
      change_txid TEXT,
      detected_at TIMESTAMPTZ NOT NULL
    );
  `)
  console.log('[db] Schema initialized')
}

// --- Sources ---

export interface Source {
  id: number
  name: string
  feed_url: string
  enabled: boolean
  poll_interval_seconds: number
}

export async function syncSources(config: Array<{ name: string; feedUrl: string; pollInterval: number }>) {
  const configNames = config.map(s => s.name)

  // First pass: for each config entry, keep only the row with the lowest id per name,
  // reassign its headlines, and delete the duplicates
  for (const s of config) {
    const { rows } = await pool.query(
      'SELECT id FROM sources WHERE name = $1 ORDER BY id', [s.name]
    )
    if (rows.length > 1) {
      const keepId = rows[0].id
      const dupeIds = rows.slice(1).map((r: { id: number }) => r.id)
      const dupePh = dupeIds.map((_: number, i: number) => `$${i + 2}`).join(', ')
      const simplePh = dupeIds.map((_: number, i: number) => `$${i + 1}`).join(', ')
      // Reassign headlines from duplicates to the kept row
      await pool.query(
        `UPDATE headlines SET source_id = $1 WHERE source_id IN (${dupePh})`,
        [keepId, ...dupeIds]
      )
      // Delete orphaned changes (shouldn't exist, but be safe)
      await pool.query(
        `DELETE FROM headline_changes WHERE headline_id IN (SELECT id FROM headlines WHERE source_id IN (${simplePh}))`,
        dupeIds
      )
      await pool.query(`DELETE FROM headlines WHERE source_id IN (${simplePh})`, dupeIds)
      await pool.query(`DELETE FROM sources WHERE id IN (${simplePh})`, dupeIds)
      console.log(`[db] Merged ${dupeIds.length} duplicate row(s) for "${s.name}"`)
    }
  }

  // Second pass: upsert each config entry — match by name, update URL + interval
  for (const s of config) {
    const { rows } = await pool.query('SELECT id FROM sources WHERE name = $1', [s.name])
    if (rows.length > 0) {
      await pool.query(
        'UPDATE sources SET feed_url = $1, poll_interval_seconds = $2, enabled = true WHERE name = $3',
        [s.feedUrl, s.pollInterval, s.name]
      )
    } else {
      // URL might exist under a different name — clear it first
      await pool.query('DELETE FROM sources WHERE feed_url = $1', [s.feedUrl])
      await pool.query(
        'INSERT INTO sources (name, feed_url, poll_interval_seconds, enabled) VALUES ($1, $2, $3, true)',
        [s.name, s.feedUrl, s.pollInterval]
      )
    }
  }

  // Third pass: disable any sources whose name is not in config
  if (configNames.length > 0) {
    const placeholders = configNames.map((_, i) => `$${i + 1}`).join(', ')
    const { rowCount } = await pool.query(
      `UPDATE sources SET enabled = false WHERE name NOT IN (${placeholders}) AND enabled = true`,
      configNames
    )
    if (rowCount && rowCount > 0) {
      console.log(`[db] Disabled ${rowCount} source(s) not in config`)
    }
  }
}

export async function getAllSources(): Promise<Source[]> {
  const { rows } = await pool.query('SELECT * FROM sources WHERE enabled = true')
  return rows as Source[]
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

export async function getHeadlineByUrl(url: string): Promise<Headline | undefined> {
  const { rows } = await pool.query('SELECT * FROM headlines WHERE url = $1', [url])
  return rows[0] as Headline | undefined
}

export async function insertHeadline(
  sourceId: number, title: string, description: string | null, url: string,
  contentHash: string, txid: string | null, firstSeenAt: string
): Promise<Headline> {
  const { rows } = await pool.query(
    'INSERT INTO headlines (source_id, title, description, url, content_hash, txid, first_seen_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at',
    [sourceId, title, description, url, contentHash, txid, firstSeenAt]
  )
  return {
    id: rows[0].id, source_id: sourceId, title, description,
    url, content_hash: contentHash, txid, first_seen_at: firstSeenAt, created_at: rows[0].created_at
  }
}

export async function updateHeadline(id: number, title: string, description: string | null, contentHash: string, txid: string | null) {
  await pool.query(
    'UPDATE headlines SET title = $1, description = $2, content_hash = $3, txid = $4 WHERE id = $5',
    [title, description, contentHash, txid, id]
  )
}

export async function getRecentHeadlines(page: number, limit: number, sourceName?: string) {
  const offset = (page - 1) * limit
  if (sourceName) {
    const { rows } = await pool.query(`
      SELECT h.*, s.name as source_name FROM headlines h
      JOIN sources s ON h.source_id = s.id
      WHERE s.name = $1
      ORDER BY h.first_seen_at DESC LIMIT $2 OFFSET $3
    `, [sourceName, limit, offset])
    return rows as (Headline & { source_name: string })[]
  }
  const { rows } = await pool.query(`
    SELECT h.*, s.name as source_name FROM headlines h
    JOIN sources s ON h.source_id = s.id
    ORDER BY h.first_seen_at DESC LIMIT $1 OFFSET $2
  `, [limit, offset])
  return rows as (Headline & { source_name: string })[]
}

export async function getHeadlineById(id: number) {
  const { rows } = await pool.query(`
    SELECT h.*, s.name as source_name FROM headlines h
    JOIN sources s ON h.source_id = s.id
    WHERE h.id = $1
  `, [id])
  return rows[0] as (Headline & { source_name: string }) | undefined
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

export async function insertChange(
  headlineId: number, oldTitle: string, newTitle: string,
  oldDesc: string | null, newDesc: string | null,
  oldHash: string, newHash: string,
  changeTxid: string | null, detectedAt: string
): Promise<HeadlineChange> {
  const { rows } = await pool.query(
    `INSERT INTO headline_changes (headline_id, old_title, new_title, old_description, new_description, old_hash, new_hash, change_txid, detected_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [headlineId, oldTitle, newTitle, oldDesc, newDesc, oldHash, newHash, changeTxid, detectedAt]
  )
  return {
    id: rows[0].id, headline_id: headlineId,
    old_title: oldTitle, new_title: newTitle,
    old_description: oldDesc, new_description: newDesc,
    old_hash: oldHash, new_hash: newHash,
    change_txid: changeTxid, detected_at: detectedAt
  }
}

export async function getRecentChanges(page: number, limit: number, sourceName?: string) {
  const offset = (page - 1) * limit
  if (sourceName) {
    const { rows } = await pool.query(`
      SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
      JOIN headlines h ON hc.headline_id = h.id
      JOIN sources s ON h.source_id = s.id
      WHERE s.name = $1
      ORDER BY hc.detected_at DESC LIMIT $2 OFFSET $3
    `, [sourceName, limit, offset])
    return rows as (HeadlineChange & { url: string; original_txid: string | null; source_name: string })[]
  }
  const { rows } = await pool.query(`
    SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
    JOIN headlines h ON hc.headline_id = h.id
    JOIN sources s ON h.source_id = s.id
    ORDER BY hc.detected_at DESC LIMIT $1 OFFSET $2
  `, [limit, offset])
  return rows as (HeadlineChange & { url: string; original_txid: string | null; source_name: string })[]
}

export async function getChangeById(id: number) {
  const { rows } = await pool.query(`
    SELECT hc.*, h.url, h.txid as original_txid, s.name as source_name FROM headline_changes hc
    JOIN headlines h ON hc.headline_id = h.id
    JOIN sources s ON h.source_id = s.id
    WHERE hc.id = $1
  `, [id])
  return rows[0] as (HeadlineChange & { url: string; original_txid: string | null; source_name: string }) | undefined
}

// --- Retry helpers ---

export async function getUnanchoredHeadlines(): Promise<Headline[]> {
  const { rows } = await pool.query('SELECT * FROM headlines WHERE txid IS NULL ORDER BY id')
  return rows as Headline[]
}

export async function setHeadlineTxid(id: number, txid: string, contentHash: string) {
  await pool.query('UPDATE headlines SET txid = $1 WHERE id = $2', [txid, id])
  // Also backfill any change record that produced this hash
  await pool.query(
    'UPDATE headline_changes SET change_txid = $1 WHERE headline_id = $2 AND new_hash = $3 AND change_txid IS NULL',
    [txid, id, contentHash]
  )
}

export async function getUnanchoredChanges(): Promise<HeadlineChange[]> {
  const { rows } = await pool.query('SELECT * FROM headline_changes WHERE change_txid IS NULL ORDER BY id')
  return rows as HeadlineChange[]
}

export async function setChangeTxid(id: number, txid: string) {
  await pool.query('UPDATE headline_changes SET change_txid = $1 WHERE id = $2', [txid, id])
}

// --- Stats ---

export async function getStats() {
  const [headlines, changes, sources, anchored] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM headlines'),
    pool.query('SELECT COUNT(*) as count FROM headline_changes'),
    pool.query('SELECT COUNT(*) as count FROM sources WHERE enabled = true'),
    pool.query('SELECT COUNT(*) as count FROM headlines WHERE txid IS NOT NULL'),
  ])
  return {
    headlines: parseInt(headlines.rows[0].count),
    changes: parseInt(changes.rows[0].count),
    sources: parseInt(sources.rows[0].count),
    anchored: parseInt(anchored.rows[0].count),
  }
}

export default pool
