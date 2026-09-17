// Loads the Sui shapes the pages read. From the platform when DATUM_API_KEY is set, otherwise from
// lib/sample.ts, labelled as sample on every page. Three resources: sui/pools, sui/protocols, sui/liquidations.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { num, pct, price, usd } from './format';
import { protocolLogo } from './chains';
import { samplePool, sampleSui } from './sample';
import type { Kind, Liquidation, Point, Pool, PoolDetail, Protocol, Risk, Share, SuiOverview } from './sui-types';

const R = config.resources;
export const proto = (slug: string) => config.protocols[slug] ?? { label: slug, defillamaSlug: slug, kind: 'lending' as Kind };
const risk = (u: number): Risk => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe');
const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
const byDayAsc = (a: { day: string }, b: { day: string }) => a.day.localeCompare(b.day);
const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const change = (now: number, then: number | undefined) => (then ? (now / then - 1) * 100 : 0);
export const poolId = (protocol: string, symbol: string) => `${protocol}-${symbol}`.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');

export function toPool(r: Record<string, unknown>): Pool {
  const protocol = String(r.protocol ?? ''); const symbol = String(r.symbol ?? ''); const p = proto(protocol);
  const supplied = num(r.total_supply_usd), borrowed = num(r.total_borrows_usd);
  const utilization = r.utilization != null ? num(r.utilization) : supplied ? (borrowed / supplied) * 100 : 0;
  return { id: poolId(protocol, symbol), protocol, protocolLabel: p.label, symbol, kind: r.is_lending_pool === false ? 'cdp' : 'lending',
    supplied, borrowed, available: r.available_liquidity_usd != null ? num(r.available_liquidity_usd) : Math.max(0, supplied - borrowed), utilization,
    supplyApy: num(r.supply_apy), borrowApy: num(r.borrow_apy), incentiveSupplyApy: r.incentive_supply_apy == null ? null : num(r.incentive_supply_apy),
    ltv: num(r.ltv), liqThreshold: num(r.liquidation_threshold), price: num(r.price_usd), risk: risk(utilization), logo: protocolLogo(p.defillamaSlug) };
}
function toProtocol(r: Record<string, unknown>, pools: Pool[]): Protocol {
  const id = String(r.protocol ?? ''); const p = proto(id);
  return { id, name: p.label, kind: p.kind, method: String(r.method) === 'remote' ? 'remote' : 'net', tvlNet: num(r.tvl_net_usd), tvlGross: num(r.tvl_gross_usd), borrows: num(r.borrows_usd),
    defillama: r.defillama_tvl_usd ? num(r.defillama_tvl_usd) : null, divergence: r.divergence_vs_defillama == null ? null : num(r.divergence_vs_defillama), pools: pools.filter((x) => x.protocol === id).length, logo: protocolLogo(p.defillamaSlug) };
}
function toLiquidation(r: Record<string, unknown>): Liquidation {
  const protocol = String(r.protocol ?? '');
  return { id: String(r.event_id ?? ''), protocol, protocolLabel: proto(protocol).label, ts: String(r.ts ?? '').slice(0, 16).replace('T', ' '), day: dayOf(r.day ?? r.ts), tx: String(r.tx_digest ?? ''),
    liquidator: String(r.liquidator ?? ''), borrower: String(r.borrower ?? ''), collateralAsset: String(r.collateral_asset ?? ''), collateralUsd: num(r.collateral_usd), debtAsset: String(r.debt_asset ?? ''), debtUsd: num(r.debt_usd), gasUsd: num(r.gas_usd), margin: num(r.gross_margin_usd) };
}

/** The overview: latest pools and protocols, ninety days of protocol TVL, thirty days of liquidations. */
export const loadSui = cache(async (): Promise<SuiOverview> => {
  if (!hasKey()) return sampleSui();
  const since = isoDaysAgo(config.trend.days + 2), lsince = isoDaysAgo(config.liquidationDays);
  const [ps, pr, prh, lq] = await Promise.all([
    query(R.pools.product, R.pools.name, { limit: 1000 }),
    query(R.protocols.product, R.protocols.name, { limit: 100 }),
    query(R.protocols.product, R.protocols.name, { since, limit: 5000 }),
    query(R.liquidations.product, R.liquidations.name, { since: lsince, limit: 5000 }),
  ]);
  const pools = ps.rows.map(toPool).sort((a, b) => b.supplied - a.supplied);
  const protocols = pr.rows.map((r) => toProtocol(r, pools)).sort((a, b) => b.tvlNet - a.tvlNet);
  const asOf = dayOf(ps.day ?? pr.day ?? new Date().toISOString());
  const days = new Map<string, { supply: number; borrow: number }>();
  prh.rows.forEach((r) => { const d = dayOf(r.day); if (!d) return; const c = days.get(d) ?? { supply: 0, borrow: 0 }; c.supply += num(r.tvl_gross_usd); c.borrow += num(r.borrows_usd); days.set(d, c); });
  const history: Point[] = [...days.entries()].map(([day, v]) => ({ day, ...v })).sort(byDayAsc);
  const weekAgo = history.find((p) => p.day === isoDaysAgo(7, new Date(asOf + 'T00:00:00Z')));
  const lending = pools.filter((p) => p.kind === 'lending'), cdp = pools.filter((p) => p.kind === 'cdp');
  const supplied = sum(pools, (p) => p.supplied), borrowed = sum(pools, (p) => p.borrowed);
  const recent = lq.rows.map(toLiquidation).sort((a, b) => b.ts.localeCompare(a.ts));
  const ld = new Map<string, { events: number; usd: number }>();
  recent.forEach((l) => { const c = ld.get(l.day) ?? { events: 0, usd: 0 }; c.events += 1; c.usd += l.collateralUsd; ld.set(l.day, c); });
  const liquidationsByDay: Point[] = [...ld.entries()].map(([day, v]) => ({ day, ...v })).sort(byDayAsc);
  const byProtocol: Share[] = protocols.map((p) => ({ name: p.name, value: p.tvlNet })).filter((s) => s.value > 0);
  const withLlama = protocols.filter((p) => p.defillama);
  const reconciliation: SuiOverview['reconciliation'] = withLlama.length ? {
    ours: sum(withLlama, (p) => p.tvlNet), theirs: sum(withLlama, (p) => p.defillama ?? 0), theirsSource: `DefiLlama (${asOf}, ${withLlama.map((p) => p.name).join(', ')})`,
    note: 'Both are net TVL for the protocols DefiLlama tracks; AlphaLend has no DefiLlama figure since July 2026 and is left out of this comparison. Gaps are timing and price feeds; the Protocols page shows each one.',
  } : null;
  return {
    asOf, sample: false,
    kpis: { supplied, borrowed, utilization: supplied ? (borrowed / supplied) * 100 : 0, suppliedChange7d: change(sum(protocols, (p) => p.tvlGross), weekAgo ? num(weekAgo.supply) : undefined), borrowedChange7d: change(sum(protocols, (p) => p.borrows), weekAgo ? num(weekAgo.borrow) : undefined),
      lendingPools: lending.length, cdpVaults: cdp.length, protocols: protocols.length, events30d: recent.length, liquidated30dUsd: sum(recent, (l) => l.collateralUsd), lendingSupplied: sum(lending, (p) => p.supplied), cdpSupplied: sum(cdp, (p) => p.supplied) },
    history, byProtocol, liquidationsByDay, pools, protocols, recent, reconciliation,
  };
});

/** One pool: its own daily rows for the trend window. */
export const loadPool = cache(async (id: string): Promise<PoolDetail | null> => {
  if (!hasKey()) return samplePool(id);
  const o = await loadSui();
  const pool = o.pools.find((p) => p.id === id.toLowerCase());
  if (!pool) return null;
  const h = await query(R.pools.product, R.pools.name, { protocol: pool.protocol, symbol: pool.symbol, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 1000 });
  const rows = h.rows.map((r) => ({ day: dayOf(r.day), supplied: num(r.total_supply_usd), borrowed: num(r.total_borrows_usd), sa: num(r.supply_apy), ba: num(r.borrow_apy), u: num(r.utilization) })).filter((r) => r.day).sort(byDayAsc);
  return { asOf: o.asOf, sample: false, pool, history: rows.map((r) => ({ day: r.day, supplied: r.supplied, borrowed: r.borrowed })), rates: rows.map((r) => ({ day: r.day, supply_apy: r.sa, borrow_apy: r.ba, utilization: r.u })), facts: poolFacts(pool) };
});
export const poolFacts = (p: Pool) => [
  { label: 'Max LTV', value: pct(p.ltv, 0), note: 'How much can be borrowed against this asset' },
  { label: 'Liquidation threshold', value: pct(p.liqThreshold, 0), note: 'Debt to collateral ratio at which a position can be liquidated' },
  ...(p.incentiveSupplyApy != null ? [{ label: 'Incentive supply APY', value: pct(p.incentiveSupplyApy), note: 'Paid by the protocol on top of the base rate' }] : []),
  { label: 'Price', value: price(p.price), note: 'What the platform values one token at' },
  { label: 'Available', value: usd(p.available), note: 'Supplied and not borrowed; what can be withdrawn now' },
  { label: 'Protocol', value: p.protocolLabel }, { label: 'Archetype', value: p.kind === 'cdp' ? 'CDP vault' : 'Lending pool' },
];
