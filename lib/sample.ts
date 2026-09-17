// Labelled sample data for the pages when no DATUM_API_KEY is set. Shaped like the platform's
// September 2026 numbers so the dashboard can be judged as is; every page says it is sample data.
import { SAMPLE_AS_OF } from './platform';
import { config } from '@/datum.config';
import { protocolLogo } from './chains';
import type { Liquidation, Point, Pool, PoolDetail, Protocol, SuiOverview } from './sui-types';
export { SAMPLE_AS_OF };

const rnd = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const daysBack = (n: number, from = SAMPLE_AS_OF) => Array.from({ length: n + 1 }, (_, i) => { const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (n - i)); return d.toISOString().slice(0, 10); });
const series = (days: string[], end: number, growth: number, wobble: number, seed: number) => { const r = rnd(seed); const out: number[] = []; let v = end / (1 + growth); days.forEach(() => { v *= 1 + growth / days.length + (r() - 0.5) * wobble; out.push(v); }); const k = end / out[out.length - 1]; return out.map((x) => x * k); };
const risk = (u: number) => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe') as Pool['risk'];
const P = (slug: string) => config.protocols[slug];
// protocol, symbol, kind, supplied, borrowed, supply APY, borrow APY, LTV, liquidation threshold, price
const POOLS: [string, string, 'lending' | 'cdp', number, number, number, number, number, number, number][] = [
  ['suilend', 'sSUI', 'lending', 50.2e6, 0, 0, 0, 70, 75, 3.62], ['suilend', 'SUI', 'lending', 39.8e6, 25.4e6, 1.37, 2.7, 70, 75, 3.41], ['navi', 'enzoBTC', 'lending', 33.3e6, 0, 0, 0, 62, 77, 116300],
  ['navi', 'SUI', 'lending', 31.1e6, 19.8e6, 1.9, 3.4, 75, 80, 3.41], ['navi', 'USDC', 'lending', 28.6e6, 24.1e6, 5.1, 7.2, 85, 90, 1], ['suilend', 'USDC', 'lending', 26.9e6, 22.5e6, 4.8, 6.9, 77, 80, 1],
  ['scallop', 'USDC', 'lending', 18.4e6, 12.1e6, 3.9, 6.1, 80, 85, 1], ['scallop', 'SUI', 'lending', 15.2e6, 6.3e6, 1.1, 2.9, 70, 75, 3.41], ['alphalend', 'SUI', 'lending', 12.7e6, 7.9e6, 1.6, 3.1, 70, 75, 3.41],
  ['alphalend', 'USDC', 'lending', 9.4e6, 8.6e6, 6.2, 8.4, 80, 85, 1], ['navi', 'wUSDT', 'lending', 8.8e6, 7.1e6, 4.4, 6.5, 85, 90, 1], ['bucket', 'SUI', 'cdp', 6.1e6, 2.4e6, 0, 3.5, 0, 90, 3.41], ['bucket', 'afSUI', 'cdp', 3.2e6, 1.4e6, 0, 3.5, 0, 90, 3.7],
];
const pools = (): Pool[] => POOLS.map(([protocol, symbol, kind, supplied, borrowed, supplyApy, borrowApy, ltv, liqThreshold, pr]) => { const u = supplied ? (borrowed / supplied) * 100 : 0; return { id: `${protocol}-${symbol}`.toLowerCase(), protocol, protocolLabel: P(protocol).label, symbol, kind, supplied, borrowed, available: supplied - borrowed, utilization: u, supplyApy, borrowApy, incentiveSupplyApy: null, ltv, liqThreshold, price: pr, risk: risk(u), logo: protocolLogo(P(protocol).defillamaSlug) }; });
const protocols = (ps: Pool[]): Protocol[] => [['navi', 'net', 168e6, 235e6, 67e6, 231e6], ['suilend', 'net', 121e6, 186e6, 65e6, 184e6], ['scallop', 'remote', 42e6, 63e6, 21e6, 61e6], ['alphalend', 'net', 55e6, 87e6, 32e6, null], ['bucket', 'remote', 18e6, 24e6, 6e6, 23e6]].map(([id, method, tvlNet, tvlGross, borrows, dl]) => {
  const p = P(id as string); return { id: id as string, name: p.label, kind: p.kind, method: method as 'net' | 'remote', tvlNet: tvlNet as number, tvlGross: tvlGross as number, borrows: borrows as number, defillama: dl as number | null, divergence: dl ? ((tvlNet as number) / (dl as number) - 1) * 100 : null, pools: ps.filter((x) => x.protocol === id).length, logo: protocolLogo(p.defillamaSlug) };
});
export function sampleSui(): SuiOverview {
  const ps = pools(), prs = protocols(ps); const days = daysBack(90); const s = series(days, prs.reduce((a, p) => a + p.tvlGross, 0), 0.12, 0.012, 3), b = series(days, prs.reduce((a, p) => a + p.borrows, 0), 0.18, 0.02, 5);
  const history: Point[] = days.map((day, i) => ({ day, supply: Math.round(s[i]), borrow: Math.round(b[i]) }));
  const r = rnd(9); const ldays = daysBack(30); const liquidationsByDay: Point[] = ldays.map((day) => ({ day, events: 40 + Math.round(r() * 160), usd: Math.round(0.8e6 + r() * 5e6) }));
  const recent: Liquidation[] = Array.from({ length: 60 }, (_, i) => { const p = ['navi', 'scallop', 'suilend', 'alphalend'][i % 4]; const c = Math.round(200 + r() * 40000); return { id: `ev-${i}`, protocol: p, protocolLabel: P(p).label, ts: `${ldays[ldays.length - 1 - (i % 30)]} ${String(i % 24).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`, day: ldays[ldays.length - 1 - (i % 30)], tx: `sample${i}`, liquidator: `0x${(i * 2654435761).toString(16).padStart(8, '0')}${'ab'.repeat(28)}`, borrower: `0x${(i * 40503).toString(16).padStart(8, '0')}${'cd'.repeat(28)}`, collateralAsset: ['SUI', 'sSUI', 'enzoBTC', 'USDC'][i % 4], collateralUsd: c, debtAsset: ['USDC', 'wUSDT', 'SUI', 'USDC'][i % 4], debtUsd: c * 0.92, gasUsd: 0.01 + r() * 0.05, margin: c * 0.05 }; });
  const supplied = ps.reduce((a, p) => a + p.supplied, 0), borrowed = ps.reduce((a, p) => a + p.borrowed, 0);
  const wl = prs.filter((p) => p.defillama);
  return { asOf: SAMPLE_AS_OF, sample: true,
    kpis: { supplied, borrowed, utilization: (borrowed / supplied) * 100, suppliedChange7d: (s[90] / s[83] - 1) * 100, borrowedChange7d: (b[90] / b[83] - 1) * 100, lendingPools: ps.filter((p) => p.kind === 'lending').length, cdpVaults: ps.filter((p) => p.kind === 'cdp').length, protocols: prs.length, events30d: liquidationsByDay.reduce((a, d) => a + Number(d.events), 0), liquidated30dUsd: liquidationsByDay.reduce((a, d) => a + Number(d.usd), 0), lendingSupplied: ps.filter((p) => p.kind === 'lending').reduce((a, p) => a + p.supplied, 0), cdpSupplied: ps.filter((p) => p.kind === 'cdp').reduce((a, p) => a + p.supplied, 0) },
    history, byProtocol: prs.map((p) => ({ name: p.name, value: p.tvlNet })), liquidationsByDay, pools: ps, protocols: prs, recent,
    reconciliation: { ours: wl.reduce((a, p) => a + p.tvlNet, 0), theirs: wl.reduce((a, p) => a + (p.defillama ?? 0), 0), theirsSource: 'DefiLlama (sample)', note: 'Both are net TVL for the protocols DefiLlama tracks; AlphaLend has no DefiLlama figure and is left out.' } };
}
export function samplePool(id: string): PoolDetail | null {
  const p = pools().find((x) => x.id === id.toLowerCase()); if (!p) return null;
  const days = daysBack(90); const s = series(days, p.supplied || 1e5, 0.15, 0.02, 21), b = series(days, p.borrowed || 0, 0.2, 0.03, 23);
  return { asOf: SAMPLE_AS_OF, sample: true, pool: p, history: days.map((day, i) => ({ day, supplied: Math.round(p.supplied ? s[i] : 0), borrowed: Math.round(p.borrowed ? b[i] : 0) })), rates: days.map((day, i) => ({ day, supply_apy: +(p.supplyApy * (0.9 + (i % 7) * 0.03)).toFixed(2), borrow_apy: +(p.borrowApy * (0.9 + (i % 5) * 0.04)).toFixed(2), utilization: p.supplied && p.borrowed ? +((b[i] / s[i]) * 100).toFixed(1) : 0 })),
    facts: [{ label: 'Max LTV', value: `${p.ltv}%` }, { label: 'Liquidation threshold', value: `${p.liqThreshold}%` }, { label: 'Price', value: `$${p.price}` }, { label: 'Protocol', value: p.protocolLabel }, { label: 'Archetype', value: p.kind === 'cdp' ? 'CDP vault' : 'Lending pool' }] };
}
