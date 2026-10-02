# HeadlineAnchor

HeadlineAnchor polls configured RSS feeds, detects changes to the titles and descriptions it observes, and anchors their SHA-256 hashes on BSV. A React interface displays headlines, change comparisons, database statistics and server-wallet funding.

[Hosted application](https://headline-anchor.bsvb.tech/)

![HeadlineAnchor changes view](docs/screenshot.png)

## How it works

1. Read RSS sources from [sources.config.json](sources.config.json), synchronising their configuration to PostgreSQL at startup.
2. Trim feed text, limit descriptions to 1,024 characters and calculate `SHA256(title + "|" + description)`.
3. Identify articles by URL and compare their hashes with the stored version.
4. Attempt to anchor each new or changed hash through `@bsv/simple`'s `inscribeFileHash` method.
5. Keep text and change history in PostgreSQL, with transaction links when anchoring succeeds.

The service observes feed snapshots at polling intervals. It cannot capture edits that occur between polls, verify the truth of an article or establish its original publication time. Only hashes are written on-chain; the before-and-after text and its relationship to an article depend on the retained database.

When anchoring fails, records can remain unanchored. A background sweep retries pending records at startup and every 60 seconds. Wallet funding and network availability determine when an anchor can be submitted.

## Prerequisites

- Node.js 22 and npm.
- PostgreSQL; the included Compose file provides PostgreSQL 16 for local development.
- GitHub Packages access for `@bsv-blockchain-demos/float-balance-route`.
- Network access to the configured RSS feeds and BSV services.
- A funded server wallet for mainnet anchoring. A BRC-100 browser wallet is needed only for the application's funding flow.

The Float package is imported unconditionally, even when treasury monitoring is disabled. Authenticate npm to `https://npm.pkg.github.com` with an account/token permitted to read that package before installing. Keep authentication in your user-level npm configuration.

## Local development

```sh
git clone https://github.com/bsv-blockchain-demos/headline-anchor.git
cd headline-anchor
npm ci
docker compose up -d postgres
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/` requests to the Express server at port 3000. Database tables are created and sources are synchronised automatically at server startup.

The source does not explicitly load `.env` in the Node application. Export custom settings into the process environment before running the npm commands. The included `.env.example` is a configuration reference; Compose also uses `.env` for its own interpolation.

| Variable | Behaviour |
| --- | --- |
| `DATABASE_URL` | Defaults to `postgres://headline:headline@localhost:5432/headline_anchor`, matching the local Compose database. |
| `PORT` | Express port, default `3000`. Update the Vite proxy if changing it during development. |
| `SERVER_PRIVATE_KEY` | Server wallet key in hexadecimal. If absent, a key is loaded from or generated into `.server-wallet.json`. |
| `FLOAT_BALANCE_TOKEN` | When set, enables the bearer-authenticated `/treasury/balance` endpoint. |

The wallet network is fixed to mainnet. Preserve the server key and its wallet storage identity across restarts. The generated local key file is plaintext with restrictive filesystem permissions and must remain private.

## Funding and checking results

Use the **Fund** tab with a funded BRC-100 wallet. It creates a BRC-29 payment request, asks the browser wallet to pay it and passes the transaction back for internalisation. Sending to an arbitrary displayed address does not reproduce this funding flow.

After funding, inspect pending records as the retry sweep runs. Transaction links show submitted anchors; the application does not separately track mined confirmations. Costs depend on the wallet and transaction construction, so the interface should be used to inspect actual funding and balance requirements.

## Build and deploy

```sh
npm run build
npm start
```

The build creates `dist/` for the frontend and `dist-server/` for Express. Production serves both through port 3000 by default.

The Compose `deploy` profile starts the published application image alongside PostgreSQL:

```sh
docker compose --profile deploy up -d
```

Provision `SERVER_PRIVATE_KEY` before using that profile. The app container has no persistent volume for an automatically generated key, so an unset key can result in a new wallet identity when the container is replaced. The provided PostgreSQL credentials are development defaults.

Building the Dockerfile requires a BuildKit secret named `github_token` for GitHub Packages. The local Compose deployment uses a prebuilt image. Its environment list does not currently forward `FLOAT_BALANCE_TOKEN`; add that explicitly if deploying the monitoring endpoint.

## API and source

| Path | Purpose |
| --- | --- |
| `GET /api/headlines` and `GET /api/headlines/:id` | Browse observed headlines. |
| `GET /api/changes` and `GET /api/changes/:id` | Browse recorded changes. |
| `GET /api/sources` and `GET /api/stats` | Inspect configured sources and database counts. |
| `GET /api/wallet/balance` | Read the wallet's spendable default-basket balance. |
| `GET /api/wallet/request` | Create a funding request using the `satoshis` query parameter. |
| `POST /api/wallet/receive` | Internalise a funding payment. |

The application API has no account login or route-level access control. The optional Float endpoint has its own bearer-token authentication. Review exposure of the wallet routes when hosting the service.

The main implementation is in [server/crawler.ts](server/crawler.ts), [server/detector.ts](server/detector.ts), [server/scheduler.ts](server/scheduler.ts) and [server/wallet.ts](server/wallet.ts). No automated test or lint script is currently defined in `package.json`.

## Licence

**MIT licence.** See [LICENSE](LICENSE) for the full terms.
