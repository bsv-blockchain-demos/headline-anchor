/**
 * Fixture data for design-phase previews. THROWAWAY: not for production.
 *
 * Lets the frontend render fully populated on all five routes without Postgres,
 * the crawler, or a BSV wallet. Shapes mirror src/types.ts exactly; if a field
 * changes there, mirror it here.
 *
 * Activated only when VITE_USE_FIXTURES=true (see src/mocks/mockFetch.ts).
 */
import type { Headline, HeadlineChange, Source, Stats } from '../types'

// --- helpers -------------------------------------------------------------

const now = Date.now()
const minsAgo = (n: number) => new Date(now - n * 60_000).toISOString()

/** Deterministic 64-char pseudo-hex so hashes/txids look real without a crypto call. */
function fakeHex(seed: string): string {
  let out = ''
  let acc = 0
  for (let i = 0; i < seed.length; i++) acc = (acc * 31 + seed.charCodeAt(i)) & 0xffff
  while (out.length < 64) {
    acc = (acc * 1103515245 + 12345) & 0x7fffffff
    out += (acc % 16).toString(16)
  }
  return out.slice(0, 64)
}

// --- sources (mirrors sources.config.json) -------------------------------

export const sources: Source[] = [
  { id: 1, name: 'White House', feed_url: 'https://www.whitehouse.gov/news/feed/', enabled: 1, poll_interval_seconds: 120 },
  { id: 2, name: 'BBC News', feed_url: 'https://feeds.bbci.co.uk/news/rss.xml', enabled: 1, poll_interval_seconds: 120 },
  { id: 3, name: 'AP News', feed_url: 'https://feedx.net/rss/ap.xml', enabled: 1, poll_interval_seconds: 120 },
  { id: 4, name: 'NY Times', feed_url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', enabled: 1, poll_interval_seconds: 180 },
  { id: 5, name: 'Al Jazeera', feed_url: 'https://www.aljazeera.com/xml/rss/all.xml', enabled: 1, poll_interval_seconds: 180 },
  { id: 6, name: 'The Guardian', feed_url: 'https://www.theguardian.com/world/rss', enabled: 1, poll_interval_seconds: 180 },
  { id: 7, name: 'Reuters', feed_url: 'https://example.com/reuters.xml', enabled: 1, poll_interval_seconds: 180 },
]

// --- headlines -----------------------------------------------------------
// tuple: [source_name, title, description, ageMins, anchored]
type HRow = [string, string, string | null, number, boolean]

const headlineRows: HRow[] = [
  ['BBC News', 'Central bank holds interest rates steady amid inflation concerns', 'Policymakers voted 7-2 to keep the benchmark rate unchanged, citing persistent price pressures in the services sector.', 3, true],
  ['NY Times', 'Talks over regional ceasefire enter third day without agreement', 'Negotiators say gaps remain on the sequencing of withdrawals and the return of detainees.', 8, true],
  ['AP News', 'Tech firms pledge new safeguards ahead of election season', null, 14, true],
  ['White House', 'President signs executive order on domestic manufacturing', 'The order directs agencies to prioritise domestically produced components in federal procurement.', 22, true],
  ['Al Jazeera', 'Aid convoy reaches northern district after week-long delay', 'Trucks carrying food and medical supplies crossed the checkpoint early on Tuesday.', 31, true],
  ['The Guardian', 'Study links coastal flooding to accelerating ice melt', 'Researchers warn that current projections may understate the pace of sea-level rise.', 44, true],
  ['Reuters', 'Oil prices slip as supply outlook eases', 'Brent crude fell more than one per cent following reports of higher output.', 58, true],
  ['BBC News', 'Rail operators announce weekend timetable changes', 'Passengers are advised to check services before travelling this weekend.', 73, false],
  ['NY Times', 'City council approves budget after marathon session', 'The vote followed hours of public comment on cuts to transit funding.', 96, true],
  ['AP News', 'Wildfire containment reaches sixty per cent, officials say', 'Cooler conditions overnight helped crews strengthen containment lines.', 121, true],
  ['Al Jazeera', 'Regional summit to focus on trade and border security', null, 150, true],
  ['The Guardian', 'Union announces strike ballot over pay dispute', 'Members will vote next month on industrial action affecting several depots.', 190, true],
  ['White House', 'Administration outlines plan to expand rural broadband', 'The proposal earmarks funding for connectivity in underserved counties.', 240, true],
  ['Reuters', 'Markets close mixed as earnings season begins', 'Technology shares led gains while energy stocks lagged.', 310, true],
]

export const headlines: Headline[] = headlineRows.map(([source_name, title, description, ageMins, anchored], i) => {
  const src = sources.find((s) => s.name === source_name)!
  const id = i + 1
  return {
    id,
    source_id: src.id,
    source_name,
    title,
    description,
    url: `https://example.com/${source_name.toLowerCase().replace(/\s+/g, '-')}/article-${id}`,
    content_hash: fakeHex(`h${id}${title}`),
    txid: anchored ? fakeHex(`tx${id}${title}`) : null,
    first_seen_at: minsAgo(ageMins),
    created_at: minsAgo(ageMins),
  }
})

// --- changes -------------------------------------------------------------
// A spread of edit types to exercise DiffView, the "Description changed" path,
// long-text context collapsing, and pending vs anchored proof badges.

interface ChangeSeed {
  source_name: string
  oldTitle: string
  newTitle: string
  oldDesc: string | null
  newDesc: string | null
  ageMins: number
  anchored: boolean
}

const longBase =
  'Officials confirmed that the review would examine procurement records, contractor communications, and internal audit findings across every affected department before any conclusions are published later this year according to a statement'

const changeSeeds: ChangeSeed[] = [
  {
    source_name: 'BBC News',
    oldTitle: 'At least 12 injured in factory blast, officials say',
    newTitle: 'At least 34 injured in factory blast, officials say',
    oldDesc: 'Emergency crews responded to the scene early on Wednesday morning.',
    newDesc: 'Emergency crews responded to the scene early on Wednesday morning.',
    ageMins: 6,
    anchored: true,
  },
  {
    source_name: 'NY Times',
    oldTitle: 'Senator condemns proposal as reckless and unworkable',
    newTitle: 'Senator questions proposal, urges further review',
    oldDesc: 'The remarks came during a committee hearing on the draft legislation.',
    newDesc: 'The remarks came during a committee hearing on the draft legislation.',
    ageMins: 19,
    anchored: true,
  },
  {
    // title unchanged, description changed -> exercises the "Description changed" path
    source_name: 'AP News',
    oldTitle: 'Storm system moves inland, prompting evacuations',
    newTitle: 'Storm system moves inland, prompting evacuations',
    oldDesc: 'Authorities ordered residents in three coastal counties to leave immediately.',
    newDesc: 'Authorities ordered residents in five coastal counties to leave immediately, warning of a life-threatening surge.',
    ageMins: 42,
    anchored: true,
  },
  {
    source_name: 'White House',
    oldTitle: 'Statement on the economy and job growth figures',
    newTitle: 'Statement on the economy and revised job growth figures',
    oldDesc: `${longBase} the figure was described as preliminary and subject to revision.`,
    newDesc: `${longBase} the figure was described as final and no longer subject to revision.`,
    ageMins: 88,
    anchored: true,
  },
  {
    source_name: 'The Guardian',
    oldTitle: 'Report finds no evidence of misconduct in review',
    newTitle: 'Report finds limited evidence of misconduct in review',
    oldDesc: 'The independent panel published its findings on Thursday.',
    newDesc: 'The independent panel published its findings on Thursday.',
    ageMins: 140,
    anchored: false,
  },
  {
    source_name: 'Al Jazeera',
    oldTitle: 'Ministers agree framework for phased withdrawal',
    newTitle: 'Ministers agree framework for immediate withdrawal',
    oldDesc: 'The agreement followed several rounds of overnight negotiation.',
    newDesc: 'The agreement followed several rounds of overnight negotiation.',
    ageMins: 300,
    anchored: true,
  },
  {
    source_name: 'Reuters',
    oldTitle: 'Company recalls 40,000 vehicles over brake fault',
    newTitle: 'Company recalls 140,000 vehicles over brake fault',
    oldDesc: null,
    newDesc: null,
    ageMins: 640,
    anchored: true,
  },
  {
    source_name: 'BBC News',
    oldTitle: 'Court delays ruling on contested planning permission',
    newTitle: 'Court overturns ruling on contested planning permission',
    oldDesc: 'The decision affects a long-running dispute over the waterfront development.',
    newDesc: 'The decision affects a long-running dispute over the waterfront development.',
    ageMins: 1500,
    anchored: true,
  },
  {
    source_name: 'NY Times',
    oldTitle: 'Officials describe talks as productive and ongoing',
    newTitle: 'Officials describe talks as stalled',
    oldDesc: 'A follow-up meeting had been expected later in the week.',
    newDesc: 'No follow-up meeting has been scheduled.',
    ageMins: 2880,
    anchored: true,
  },
  {
    source_name: 'The Guardian',
    oldTitle: 'Minister denies knowledge of the contract',
    newTitle: 'Minister acknowledges awareness of the contract',
    oldDesc: 'The comments were made in response to questions from reporters.',
    newDesc: 'The comments were made in response to questions from reporters.',
    ageMins: 4200,
    anchored: false,
  },
]

export const changes: HeadlineChange[] = changeSeeds.map((c, i) => {
  const id = i + 1
  return {
    id,
    headline_id: 1000 + id,
    source_name: c.source_name,
    url: `https://example.com/${c.source_name.toLowerCase().replace(/\s+/g, '-')}/change-${id}`,
    original_txid: c.anchored ? fakeHex(`otx${id}`) : null,
    old_title: c.oldTitle,
    new_title: c.newTitle,
    old_description: c.oldDesc,
    new_description: c.newDesc,
    old_hash: fakeHex(`old${id}${c.oldTitle}`),
    new_hash: fakeHex(`new${id}${c.newTitle}`),
    change_txid: c.anchored ? fakeHex(`ctx${id}${c.newTitle}`) : null,
    detected_at: minsAgo(c.ageMins),
  }
})

// --- stats ---------------------------------------------------------------

export const stats: Stats = {
  headlines: 1284,
  changes: 96,
  sources: sources.length,
  anchored: 1201,
  uptimeSeconds: 3 * 3600 + 47 * 60,
}

export const walletBalanceSatoshis = 48_213
