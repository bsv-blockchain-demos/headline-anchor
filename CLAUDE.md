# HeadlineAnchor

BSV-powered app that crawls news headlines from RSS feeds, anchors content hashes on-chain via OP_RETURN, detects silent edits, and anchors change records too. Web UI shows a live feed with cryptographic proof links and a funding page.

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **BSV**: `@bsv/simple` v0.2.3 (`ServerWallet`, `inscribeJSON()`)
- **Database**: PostgreSQL 16 via `pg` (node-postgres) connection pool
- **RSS**: `rss-parser`
- **Frontend**: React 18 + Vite 5
- **Hashing**: Node.js `crypto` (SHA-256)

## Project Structure

```
server/
  index.ts        — Express server, API routes, static serving, source seeding, wallet endpoints
  db.ts           — PostgreSQL schema + all async query helpers (sources, headlines, changes, stats)
  wallet.ts       — ServerWallet singleton, BRC-29 funding flow, balance monitor
  anchor.ts       — inscribeJSON wrappers (hash-only, minimal on-chain data)
  crawler.ts      — RSS fetching + normalization via rss-parser
  detector.ts     — Compares fetched headlines against DB, triggers anchoring
  scheduler.ts    — setInterval polling per source, staggered start
src/
  index.html      — Vite entry HTML
  main.tsx        — React root
  App.tsx         — Tab layout (Headlines | Changes | Stats | Fund), stats view
  api.ts          — Fetch helpers for all backend endpoints
  types.ts        — Shared TypeScript interfaces
  components/
    HeadlineFeed.tsx  — Paginated headline list
    HeadlineCard.tsx  — Single headline with source pill, time, proof badge
    ChangesFeed.tsx   — Paginated change list with inline diffs
    DiffView.tsx      — Before/after diff display (red/green)
    ProofBadge.tsx    — Truncated txid linking to whatsonchain.com
    SourceFilter.tsx  — Chip-based source filter
    FundingPage.tsx   — Wallet balance display + BRC-100 funding flow
```

## Commands

- `npm run dev` — concurrent Express (tsx watch) + Vite dev server (`:5173` for frontend, `:3000` for API)
- `npm run build` — Vite build + tsc server compilation
- `npm start` — production mode (serves built frontend from dist/ on `:3000`)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/headlines?page=&limit=&source=` | Paginated headlines |
| GET | `/api/headlines/:id` | Single headline with proof |
| GET | `/api/changes?page=&limit=&source=` | Paginated changes |
| GET | `/api/changes/:id` | Single change with diff + proof |
| GET | `/api/sources` | All configured sources |
| GET | `/api/stats` | Counts + uptime |
| GET | `/api/wallet/balance` | Current wallet balance in satoshis |
| GET | `/api/wallet/request?satoshis=` | Create BRC-29 payment request |
| POST | `/api/wallet/receive` | Internalize payment from browser wallet |

## Database

PostgreSQL via `pg` connection pool. Connection string from `DATABASE_URL` env var (defaults to `postgres://headline:headline@localhost:5432/headline_anchor`).

Run `docker compose up -d` to start a local Postgres instance. Three tables:
- `sources` — RSS feed configs (seeded from `sources.config.json` on startup)
- `headlines` — tracked headlines with content_hash and txid
- `headline_changes` — detected edits with old/new title+description and change_txid

Schema uses `CREATE TABLE IF NOT EXISTS` in `initDb()` — called at server startup before seeding. All DB functions are async.

## BSV Wallet

Key resolution order:
1. `SERVER_PRIVATE_KEY` env var (hex)
2. `.server-wallet.json` file
3. Auto-generates and saves to `.server-wallet.json`

### Funding

You cannot fund by sending BSV directly to the address — `@bsv/simple` only recognizes UTXOs from its own BRC-29 derivation flow. Use the Fund tab in the web UI with a BRC-100 compatible wallet (MetaNet Client, BSV Desktop, etc.).

Flow: `GET /api/wallet/request` → browser wallet `fundServerWallet()` → `POST /api/wallet/receive`

### Balance Monitor

Polls `listOutputs()` every 30s, logs changes. Exposed via `GET /api/wallet/balance`.

## On-Chain Protocol

Minimal hash-only anchoring to minimize costs. Protocol prefix: `"p": "ha"`.

- **Headline**: `{"p":"ha","t":"h","h":"sha256:..."}`
- **Change**: `{"p":"ha","t":"c","ref":"<original_txid>","ph":"sha256:...","ch":"sha256:..."}`

All text content (titles, descriptions, diffs) stored in local DB only.

## Key Patterns

- Content hash: `sha256(title + '|' + description)` — used to detect edits
- Headline lookup: by URL (unique index) — same URL = same article
- Error handling: per-source, per-headline — one failure doesn't crash others
- Scheduler stagger: 5s delay between initial source fetches
- Frontend: inline styles (no CSS framework), dark theme, all client state via useState/useEffect
- Vite proxy: `/api/` → Express. Note the trailing slash — prevents intercepting `api.ts` source file

## Configuration

RSS sources in `sources.config.json`. Seeded into DB on first run. Delete DB and restart to re-seed with updated sources.

## Upcoming

- Flux deployment examples
- Push to github bsv-blockchain-demos
- GHCR container workflows
