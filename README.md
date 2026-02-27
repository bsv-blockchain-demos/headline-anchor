# HeadlineAnchor

HeadlineAnchor watches major news sources for headline changes and creates a permanent, tamper-proof record on the BSV blockchain. When a news outlet silently edits a headline or description, HeadlineAnchor catches it, stores the before and after, and anchors a cryptographic hash on-chain so anyone can verify what was published and when.

## How It Works

1. **Crawl** — Polls RSS feeds from sources like AP News, BBC, NY Times, Al Jazeera, and the White House
2. **Hash** — Computes a SHA-256 hash of each headline's title and description
3. **Anchor** — Writes the hash to the BSV blockchain using [`@bsv/simple`](https://github.com/bsv-blockchain/simple), creating an immutable timestamp proof
4. **Detect** — On each poll, compares content hashes against what's stored. If something changed, the new version gets anchored too
5. **Display** — Web UI shows a live feed of headlines, a changes tab with word-level diffs, and on-chain proof links

Every version of every headline gets its own on-chain anchor. The full text stays in a local database — only the hash goes on-chain, keeping costs minimal.

## Built With `@bsv/simple`

All blockchain interactions go through [`@bsv/simple`](https://github.com/bsv-blockchain/simple) — a TypeScript SDK that handles wallet management, key derivation, and transaction construction with a clean, high-level API.

HeadlineAnchor uses:

- **`ServerWallet`** — Server-side wallet with automatic key management. Generates and persists a private key, handles UTXO tracking internally
- **`inscribeFileHash()`** — Anchors SHA-256 hashes on-chain in a single call. No manual transaction building needed
- **BRC-29 Payment Flow** — Browser-to-server funding via `createPaymentRequest()` and `receivePayment()`, compatible with BRC-100 wallets like MetaNet Client

## Quick Start

```bash
# Clone and install
git clone https://github.com/bsv-blockchain-demos/headline-anchor.git
cd headline-anchor
npm install

# Start PostgreSQL
docker compose up -d

# Run in development mode
npm run dev
```

Open `http://localhost:5173` to see the UI. Headlines start appearing within a few minutes.

To anchor on-chain, fund the server wallet through the **Fund** tab using a BRC-100 compatible wallet. Each anchor costs ~2000 satoshis. Unfunded headlines are saved locally and automatically anchored once funding is available.

## Configuration

Edit `sources.config.json` to add or remove RSS sources:

```json
[
  { "name": "BBC News", "feedUrl": "https://feeds.bbci.co.uk/news/rss.xml", "pollInterval": 120 },
  { "name": "AP News", "feedUrl": "https://feedx.net/rss/ap.xml", "pollInterval": 120 }
]
```

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://headline:headline@localhost:5432/headline_anchor` |
| `SERVER_PRIVATE_KEY` | Wallet private key (hex) | Auto-generated and saved to `.server-wallet.json` |
| `PORT` | Express server port | `3000` |

## License

MIT
