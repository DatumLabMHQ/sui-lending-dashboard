// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the navigation. lib/sui.ts turns the three sui resources into the shapes the pages read;
// without DATUM_API_KEY the pages run on labelled sample data (lib/sample.ts).
export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'live' as 'draft' | 'live',
  slug: 'sui-lending-dashboard',
  // The name this dashboard's brief, product note and reconciliation rows use in datum-context.
  context: 'sui-lending',
  title: 'State of Lending on Sui',
  description: 'Every lending pool and CDP vault on Sui across NAVI, Suilend, Scallop, AlphaLend and Bucket, with liquidations and protocol TVL, read hourly from the Datum data platform.',
  // The question the overview answers. Pages lead with it.
  question: 'Where does lending on Sui stand today, and who holds the risk?',
  product: { slug: 'sui', label: 'Sui lending' },
  // The five protocols the platform tracks, with their DefiLlama slugs (logos and the comparison).
  protocols: {
    navi: { label: 'NAVI', defillamaSlug: 'navi-protocol', kind: 'lending' },
    suilend: { label: 'Suilend', defillamaSlug: 'suilend', kind: 'lending' },
    scallop: { label: 'Scallop', defillamaSlug: 'scallop-lend', kind: 'lending' },
    alphalend: { label: 'AlphaLend', defillamaSlug: 'alphalend', kind: 'lending' },
    bucket: { label: 'Bucket', defillamaSlug: 'bucket-protocol', kind: 'cdp' },
  } as Record<string, { label: string; defillamaSlug: string; kind: 'lending' | 'cdp' }>,
  // Resources are product/name pairs from GET /api/v1/products on datum-api.
  resources: {
    pools: { product: 'sui', name: 'pools' },              // one row per protocol, pool and day; percent-as-number
    protocols: { product: 'sui', name: 'protocols' },      // net and gross TVL per protocol per day, method, DefiLlama beside it
    liquidations: { product: 'sui', name: 'liquidations' }, // one row per event
  },
  // How far back the overview trend goes (daily rows, one call) and the liquidation window.
  trend: { days: 90 },
  liquidationDays: 30,
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/pools', label: 'Pools' },
    { href: '/liquidations', label: 'Liquidations' },
    { href: '/protocols', label: 'Protocols' },
    { href: '/methodology', label: 'Methodology' },
  ],
  sources: [
    { name: 'Datum data platform: pools', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Every pool of NAVI, Suilend, Scallop and AlphaLend and every Bucket vault, read from the chain and the protocols\' own endpoints: supply, borrow, rates, utilisation, LTV, liquidation threshold, price. Daily rows are the last snapshot of the UTC day; pool history from June 2026.' },
    { name: 'Datum data platform: protocol TVL', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Net and gross TVL per protocol. Net is our own count where the pools are read directly (NAVI, Suilend, AlphaLend) and the protocol\'s remote figure where they are not (Scallop, Bucket); the method is stored on every row. History from January 2026.' },
    { name: 'Datum data platform: liquidations', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly', detail: 'Every liquidation event decoded from the chain across NAVI, Suilend, Scallop and AlphaLend, with liquidator, borrower, collateral, debt and gas. Indexing was dead from 27 July to 3 September 2026; that gap is real, not zero activity.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'Read for the reconciliation only: its TVL per protocol beside our net figure, and the divergence the platform stores. AlphaLend has no DefiLlama history since July 2026.' },
  ],
  definitions: [
    { term: 'Supplied', unit: 'USD', text: 'Assets deposited in lending pools (and collateral posted in Bucket vaults) at the snapshot, at the platform price feed.' },
    { term: 'Borrowed', unit: 'USD', text: 'Debt outstanding against those pools and vaults.' },
    { term: 'Utilisation', unit: '%', text: 'Borrowed divided by supplied, per pool and in aggregate. Above 85% withdrawals may queue.' },
    { term: 'Supply APY, borrow APY', unit: '% a year', text: 'The rates the protocol reports at the snapshot, before incentives; incentive rates are shown separately where a protocol pays them.' },
    { term: 'LTV, liquidation threshold', unit: '%', text: 'How much can be borrowed against a pool\'s asset, and the debt to collateral ratio at which a position can be liquidated.' },
    { term: 'TVL, net and gross', unit: 'USD', text: 'Gross counts everything deposited; net takes borrowed out. Each protocol row says whether the figure is our own count (net) or the protocol\'s remote figure.' },
    { term: 'Liquidation', unit: 'event', text: 'One decoded liquidation: the collateral seized, the debt repaid, the gas paid and the liquidator\'s gross margin.' },
    { term: 'Archetype', unit: 'label', text: 'Lending pool (deposit to lend, borrow against deposits) or CDP vault (Bucket: post collateral, mint a stablecoin). Both are shown; the answer sentence keeps them apart.' },
  ],
};
export type DatumConfig = typeof config;
