# HeadlineAnchor: UI/UX Design Handoff

Prepared for a full visual/UX uplift of the web frontend, to be carried out during the design phase.

**The one hard rule: zero breaking changes.** This is a redesign of presentation only. Data contracts, routes, DOM mount points, the wallet funding flow, and build/serve wiring must all keep working exactly as they do today. The "Immovable contract" section below is the checklist that guarantees this.

---

## 1. What the app is

HeadlineAnchor crawls news headlines from RSS feeds, writes a SHA-256 hash of each headline's content on-chain (BSV), detects when a publisher silently edits a headline, and anchors each new version. The web UI presents this as a live, browsable record: a feed of tracked headlines, a feed of detected edits with word-level diffs, cryptographic proof links, aggregate stats, and a page to top up the server wallet.

A reference screenshot of the current UI is at `docs/screenshot.png`.

The product promise the design should reinforce: **immutable news accountability**. The current visual language leans into that with a dark, terminal/forensic aesthetic (monospace accents, hash chips, red/green diff highlighting). Keep that intent central, whether or not the exact execution changes.

---

## 2. Tech stack (frontend)

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18.3 | Function components + hooks only. No class components. |
| Language | TypeScript 5.6 | Strict typing throughout `src/`. |
| Bundler / dev server | Vite 5 | `root` is `src/`, build output goes to `../dist`. |
| Routing | Hash-based, hand-rolled | No router library. Logic lives in `App.tsx` (`parseHash`). |
| Styling | **Inline style objects** | `Record<string, React.CSSProperties>` per component. **No CSS framework, no CSS modules, no Tailwind, no styled-components.** |
| State | `useState` / `useEffect` | No Redux/Zustand/Context. All state is local to components. |
| Fonts | Google Fonts | Loaded via `<link>` in `src/index.html`. |
| BSV wallet | `@bsv/simple/browser` | Dynamically imported inside `FundingPage` only. |

There is **no test suite** and no linter config in the repo. Verification is build + manual run (see section 9).

### How styling works today (important)

Every component defines a `const styles: Record<string, React.CSSProperties> = { ... }` at the bottom of the file and references it inline via `style={styles.foo}`. Conditional/active states are done by spreading: `style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}`.

Global styling is minimal and lives in a `<style>` block in `src/index.html`: a box-sizing reset, body font/background/colour, a `.mono` helper, the `#root` width constraint (`max-width: 960px`), and a single `@keyframes spin`.

This means the design phase has a choice to make, and it should be a deliberate one:
- **Option A (lowest risk):** keep the inline-style-object pattern, just restyle the values. Fully mechanical, zero new dependencies, no build changes.
- **Option B:** introduce a styling system (CSS variables + a stylesheet, CSS modules, or a token file). This is allowed, but it counts as a structural change and must not alter the public contract in section 8. If you go this way, prefer CSS custom properties driven from `index.html` so the token layer is centralised.

Recommendation: Option A unless the redesign genuinely needs theming/variants, in which case a CSS-variable token layer (Option B, minimal) is the clean path.

---

## 3. Current design tokens (extracted)

These are the actual values in use today, pulled from every component. Treat this as the "before" palette to redesign from, not a spec to preserve. It is here so nothing gets lost and so semantic roles stay consistent after the uplift.

### Colour: surfaces & borders

| Role | Value | Used for |
|------|-------|----------|
| Page background | `#0a0a0a` | body, expandable content blocks |
| Surface / card | `#111` | cards, nav bar, stat cards, inputs, diff block |
| Surface raised | `#1a1a1a` | pagination buttons, hash chips |
| Surface muted | `#1c1c1c` | "pending" proof badge |
| Accent surface | `#1a1a2e` | active tab, source pill, active chip, primary button bg |
| Border subtle | `#1a1a1a` | nav, stat card |
| Border default | `#222` | cards, diff block, content blocks |
| Border strong | `#333` | buttons, chips, inputs, GitHub link |

### Colour: text

| Role | Value |
|------|-------|
| Primary text | `#e0e0e0` |
| Bright text / headings | `#fff` |
| Body-in-cards | `#ccc` |
| Secondary | `#aaa` |
| Muted | `#666` |
| Most muted (arrows, ellipsis) | `#555` |

### Colour: semantic accents

| Role | Text | Background | Border |
|------|------|-----------|--------|
| Primary accent (links, active, brand brackets) | `#4a9eff` | `#1a1a2e` | `#4a9eff` |
| Success / proof / diff-added | `#4ade80` | `#0d2818` (proof), `#0f2d1a` (added) | `#166534` |
| Alert / edited / diff-removed / error | `#f87171` | `#2d1215` (label, error), `#3c1618` (removed) | `#7f1d1d` |
| Warning ("description changed") | `#f0a500` | - | - |

### Typography

- **Body font:** `Inter` (fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`), weights 400/500/600/700.
- **Mono font:** `JetBrains Mono` (fallback `monospace`), weights 400/500/700. Used for hashes, txids, stats, tab labels, the subtitle, code/`pre`.
- Loaded in `src/index.html` via a Google Fonts `<link>`. If the redesign changes fonts, update that link and the `body`/`.mono` rules together.
- Sizes in use range from `0.65rem` (tiny hash labels) to `2.5rem` (balance value). Body line-height `1.6`.

### Shape & motion

- Border radius: `2px`/`3px` (chips, diff highlights), `4px`/`6px`/`8px` (cards, buttons, badges), `20px` (pill filter chips).
- Transitions: `all 0.15s` on interactive elements (tabs, chips, buttons, GitHub link).
- One animation: `@keyframes spin` (funding spinner), defined in `index.html`.
- Layout container: `#root` is `max-width: 960px`, centred, `1rem` padding.

---

## 4. Screen & route inventory

Routing is hash-based. `App.tsx` parses `window.location.hash` into a tab + optional change id.

| Route (hash) | Tab | Component | Purpose |
|--------------|-----|-----------|---------|
| `#changes` (default) | Changes | `ChangesFeed` | Paginated feed of detected headline edits, each with an inline title diff. |
| `#changes/:id` | Changes (detail) | `ChangeDetail` | Single edit: full title + description diffs, hash before/after with expandable hashed content, proof badge, source URL. |
| `#headlines` | Headlines | `HeadlineFeed` -> `HeadlineCard` | Paginated feed of all tracked headlines. |
| `#stats` | Stats | `StatsView` (in `App.tsx`) | Five stat cards: headlines, anchors, changes, sources, uptime. |
| `#fund` | Fund | `FundingPage` | Wallet balance + BRC-100 funding flow. |

Shared UI: a centred logo header (`/logo.jpg`) with subtitle + GitHub link, a pill nav bar, and (on Headlines and Changes list only) a `SourceFilter` chip row.

### Component map

```
App.tsx ............ header, nav, route switch, StatsView + StatCard
  SourceFilter ..... chip row, GET /api/sources
  HeadlineFeed ..... pagination, GET /api/headlines
    HeadlineCard ... source pill + timeAgo + ProofBadge + title/desc
  ChangesFeed ...... pagination, GET /api/changes
    DiffView ....... word-level LCS diff, red/green inline highlight, context collapse
    ProofBadge ..... txid -> whatsonchain link, or "pending"
  ChangeDetail ..... GET /api/changes/:id, DiffView x2, HashRow (expandable), ProofBadge
  FundingPage ...... wallet balance + BRC-100 fund flow (see contract)
```

---

## 5. Immovable contract (do not break)

Everything in this section is a hard boundary. The redesign may restyle these elements freely but must not change their names, shapes, or behaviour.

### 5.1 API data shapes

The frontend consumes the backend through `src/api.ts` and `src/types.ts`. **Do not rename or reshape any field** in `types.ts` (`Headline`, `HeadlineChange`, `Source`, `Stats`, `PaginatedResponse`). These mirror the server's JSON responses. If a new field is genuinely needed for the design, it must be additive and coordinated with the backend, not assumed.

Endpoints (all under `/api`, proxied to Express on `:3000` in dev):

```
GET  /api/headlines?page=&limit=&source=   -> PaginatedResponse<Headline>
GET  /api/headlines/:id                    -> Headline | 404
GET  /api/changes?page=&limit=&source=     -> PaginatedResponse<HeadlineChange>
GET  /api/changes/:id                      -> HeadlineChange | 404
GET  /api/sources                          -> Source[]
GET  /api/stats                            -> Stats (+ uptimeSeconds)
GET  /api/wallet/balance                   -> { satoshis }
GET  /api/wallet/request?satoshis=         -> PaymentRequest
POST /api/wallet/receive                   -> { success } | { error }
```

### 5.2 Routing scheme

The hash values `#headlines`, `#changes`, `#changes/:id`, `#stats`, `#fund` are shareable/deep-linkable URLs. Keep them working. The `parseHash` / `navigate` contract in `App.tsx` can be restyled around, but the hash format itself is public (commit history shows shareable change links were an explicit feature).

### 5.3 DOM mount point

`index.html` must keep `<div id="root"></div>` and the `main.tsx` script tag. `main.tsx` mounts into `#root`. Vite's `root` is `src/`, so `index.html` stays in `src/`.

### 5.4 The wallet funding flow (`FundingPage.tsx`)

This is the most fragile piece. The **logic** must stay intact; only the presentation changes. Specifically preserve:
- The dynamic import `await import('@bsv/simple/browser')` (keeps the page loadable without a wallet extension).
- The exact fetch sequence: `GET /api/wallet/request?satoshis=` -> `wallet.fundServerWallet(request, ...)` -> `POST /api/wallet/receive` with the exact body shape (`tx` as `Array.from(...)`, `senderIdentityKey`, `derivationPrefix`, `derivationSuffix`, `outputIndex`).
- The status state machine (`idle | connecting | requesting | funding | sending | done | error`) and the 30s balance polling. You may restyle how these states look, but do not drop states or change their transitions.

### 5.5 Build & serve wiring

Do not change without explicit sign-off: `vite.config.ts` (`root: 'src'`, `outDir: '../dist'`, the `/api/` proxy with its **trailing slash**), the `dist/` output path (Express serves it in production via SPA fallback), and the `/logo.jpg` public asset path (`src/public/logo.jpg`).

---

## 6. What is safe to change

Everything visual and structural inside components, as long as section 5 holds:
- All colours, fonts, spacing, radii, shadows, transitions, iconography.
- Component internal markup and layout (grid vs flex, card structure, ordering).
- Adding purely-presentational components, hooks, and assets.
- Introducing a token layer / CSS variables / a stylesheet (Option B in section 2), including new files under `src/`.
- Empty/loading/error states, hover/focus/active affordances, responsive behaviour (the current layout is only lightly responsive; the mobile experience is a real opportunity).
- Motion and micro-interactions.
- Light/dark handling (currently dark-only; a light mode would be additive and welcome, not required).

Accessibility is fair game and encouraged: current contrast on muted greys (`#555`/`#666` on `#0a0a0a`) is borderline, focus states are mostly default, and several interactive elements are `div`/`a` hybrids that could use clearer roles.

---

## 7. Running it locally to preview

The frontend calls `/api/*`, so a live preview needs the backend and a database. Two paths:

**Full stack (accurate data):**
1. `docker compose up -d` (starts Postgres only).
2. `npm run dev` (starts Express on `:3000` + Vite on `:5173`, concurrently).
3. Open `http://localhost:5173`. The Vite proxy forwards `/api/` to Express.
4. Wallet/funding needs a BRC-100 wallet (MetaNet Client / BSV Desktop) and on-chain funds; the Fund tab can be styled against its idle/error states without a live wallet. Headlines/changes populate as the crawler polls (first items appear within a minute or two).

**Design-only (no backend), recommended for iteration:** a ready-made fixtures harness lives on the `design/fixtures` branch. It serves every `/api/*` route from in-memory sample data, so the whole UI renders with no Postgres, no crawler, and no wallet: just the Vite client.

```
git checkout design/fixtures
npm run dev:client -- --mode fixtures      # then open http://localhost:5173
# mac/linux alternative: VITE_USE_FIXTURES=true npm run dev:client
```

How it works (all additive, nothing in section 5 touched):
- `src/mocks/fixtures.ts` holds realistic sample headlines, edits, sources, stats, and a wallet balance, matching the `types.ts` shapes exactly. Edit this file to change what you see.
- `src/mocks/mockFetch.ts` installs a gated `window.fetch` interceptor. It is a no-op unless `VITE_USE_FIXTURES=true`, so normal `npm run dev` and production builds are completely unaffected.
- Activation is via Vite's `--mode fixtures`, which loads `src/.env.fixtures`. (The env file sits in `src/`, not the repo root, because this Vite config sets `root: 'src'` and `envDir` defaults to it.)

The sample data deliberately covers the states worth designing: anchored vs pending proof badges, a title-only edit, a description-only edit (the "Description changed" path), a long-text edit that triggers diff context-collapsing, and source-filter chips that actually filter. The Fund tab shows a live balance; clicking "Connect Wallet & Fund" still needs a real BRC-100 extension, so it lands in the error state (also worth styling).

**Do not merge the `design/fixtures` branch's `src/main.tsx` line or the `src/mocks/` folder into `main`.** They are preview-only. Restyled components are safe to cherry-pick; the fixtures plumbing is not.

Env config is documented in `.env.example`. Local dev auto-generates a wallet key to `.server-wallet.json`; no secrets needed just to see the UI.

---

## 8. Suggested focus areas (non-binding)

Offered as starting points, not requirements. The designer should feel free to reframe.
- **Changes feed is the hero.** It is the default route and the product's whole point. The diff readability, the "EDITED" treatment, and the proof link are the emotional core: make silent edits feel caught red-handed.
- **Trust signalling.** Proof badges, hashes, and txids are what make this credible. Right now they read as developer detail; they could read as evidence.
- **Density vs clarity.** The current UI is dense and terminal-flavoured. Decide deliberately whether to lean further in (forensic tool) or open it up (public-facing accountability site).
- **Mobile.** Largely unaddressed today.
- **Empty/first-run states.** "No changes detected yet." and "Crawler is running..." are the first thing a new deployer sees.

---

## 9. Handover back: deliverables & acceptance

To hand the redesign back smoothly, the return package should include:

1. **The changed code** on a branch, scoped to `src/` (+ `src/index.html`) unless a build change was explicitly agreed.
2. **A short change note** listing: which components changed, whether the styling approach stayed inline (Option A) or moved to a token layer (Option B), any new dependencies (ideally none), and any new files/assets.
3. **Before/after screenshots** for each of the five routes (Changes list, Change detail, Headlines, Stats, Fund) plus at least one mobile width.
4. **Contract self-check** confirming section 5 is untouched: API shapes, hash routes, `#root`, the funding flow logic, and the Vite/build wiring.

**Acceptance gate (must all pass):**
- `npm run build` succeeds (Vite build + `tsc -p tsconfig.server.json`). This is the real gate, since there are no tests.
- `npm run dev` runs and all five routes render and navigate, including deep-linking to `#changes/:id`.
- The funding flow still issues the same three calls in order (verify in the network tab against a stubbed or real backend).
- No new TypeScript errors, no console errors on load, no new runtime dependencies unless agreed.

If any contract item genuinely needs to change to achieve the design, that is a conversation to have before merging, not a silent change. The default is: presentation transforms, everything in section 5 stays put.
