# HeadlineAnchor

BSV-powered app that crawls news headlines from RSS feeds, anchors content hashes on-chain via `inscribeFileHash`, detects silent edits, and anchors each iteration. Web UI shows a live feed with word-level diffs, cryptographic proof links, and a funding page.

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **BSV**: `@bsv/simple` v0.2.3 (`ServerWallet`, `inscribeFileHash()`)
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
  anchor.ts       — Serialized inscribeFileHash wrapper with low-funds mode
  crawler.ts      — RSS fetching + normalization via rss-parser (descriptions truncated at 1024 chars)
  detector.ts     — Compares fetched headlines against DB, anchors new hash on insert or change
  scheduler.ts    — setInterval polling per source, staggered start, retry sweep for unanchored items
src/
  index.html      — Vite entry HTML
  main.tsx        — React root
  App.tsx         — Tab layout (Headlines | Changes | Stats | Fund), stats view
  api.ts          — Fetch helpers for all backend endpoints
  types.ts        — Shared TypeScript interfaces
  components/
    HeadlineFeed.tsx  — Paginated headline list
    HeadlineCard.tsx  — Single headline with source pill, time, proof badge
    ChangesFeed.tsx   — Paginated change list with diffs, hash comparison, expandable hashed content
    DiffView.tsx      — Word-level inline diff with context collapsing
    ProofBadge.tsx    — Truncated txid linking to whatsonchain.com
    SourceFilter.tsx  — Chip-based source filter
    FundingPage.tsx   — Wallet balance display + BRC-100 funding flow
```

## Commands

- `npm run dev` — concurrent Express (tsx watch) + Vite dev server (`:5173` for frontend, `:3000` for API)
- `npm run build` — Vite build + tsc server compilation
- `npm start` — production mode (serves built frontend from dist/ on `:3000`)
- `npm run generate-key` — generate a random 32-byte hex private key for `SERVER_PRIVATE_KEY`

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

Polls `listOutputs()` every 30s (paginated, 100 per page), logs changes. Exposed via `GET /api/wallet/balance`.

## On-Chain Anchoring

Uses `inscribeFileHash(hash)` — writes only the bare SHA-256 hex hash on-chain. Both new headlines and edited headlines get the same treatment: anchor the current content hash. No separate change record on-chain; change history is tracked in the local DB only.

All text content (titles, descriptions, diffs) stored in local DB only.

## Key Patterns

- Content hash: `sha256(title + '|' + description)` — used to detect edits
- Descriptions truncated at 1024 characters before hashing and storage
- Headline lookup: by URL (unique index) — same URL = same article
- Error handling: per-source, per-headline — one failure doesn't crash others
- Serialized anchoring: all `inscribeFileHash` calls go through a mutex to prevent UTXO race conditions
- Low-funds mode: on "Insufficient funds" error, anchoring pauses silently; retry sweep probes every 60s
- Retry sweep: runs on startup + every 60s, re-anchors headlines/changes with null txid, stops on first funds failure
- Scheduler stagger: 5s delay between initial source fetches
- Poll logging: each source poll logs headline count and response time
- Frontend: inline styles (no CSS framework), dark theme, all client state via useState/useEffect
- Diff view: word-level LCS diff with inline red (strikethrough) / green highlights, context collapsing for long text
- Vite proxy: `/api/` → Express. Note the trailing slash — prevents intercepting `api.ts` source file

## Configuration

RSS sources in `sources.config.json` (White House, BBC, AP, NYT, Al Jazeera). Synced to DB on startup via `syncSources()` — adds new, updates existing, disables removed. Poll intervals: 120s–180s depending on source.

## Docker / GHCR

- **Dockerfile**: Multi-stage build (Node 22 alpine). Build stage runs `npm run build`, runtime stage copies `dist/`, `dist-server/`, production `node_modules`, `sources.config.json`. Entry: `node dist-server/index.js`, port 3000.
- **`.github/workflows/ghcr.yml`**: Triggers on push to `main` and `v*` tags. Builds multi-arch (`linux/amd64`, `linux/arm64`) via Buildx (no QEMU needed — Buildx container driver handles it). Pushes to `ghcr.io/bsv-blockchain-demos/headline-anchor` with tags: `latest`, `sha-<commit>`, semver on tag.
- **docker-compose.yml**: `docker compose up` starts only Postgres (dev). `docker compose --profile deploy up` starts both Postgres and the app from the GHCR image. The deploy profile requires `SERVER_PRIVATE_KEY` env var (set in shell or `.env`).
- **`.env.example`**: Documents all env vars. `SERVER_PRIVATE_KEY` is required for containerized/Kube deployments; local dev auto-generates to `.server-wallet.json`.

## Upcoming

- Flux deployment examples
- Push to github bsv-blockchain-demos
