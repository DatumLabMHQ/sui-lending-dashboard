// The shapes the Sui pages read. lib/sui.ts fills them from the platform's three sui resources
// (or lib/sample.ts without a key), so pages never depend on a resource's raw column names.
import type { Point, Share } from './types';
export type { Point, Share, Fact } from './types';

export type Risk = 'safe' | 'moderate' | 'high';
export type Kind = 'lending' | 'cdp';
export type Pool = {
  id: string; protocol: string; protocolLabel: string; symbol: string; kind: Kind;
  supplied: number; borrowed: number; available: number; utilization: number; supplyApy: number; borrowApy: number; incentiveSupplyApy: number | null;
  ltv: number; liqThreshold: number; price: number; risk: Risk; logo?: string;
};
export type Protocol = { id: string; name: string; kind: Kind; method: 'net' | 'remote'; tvlNet: number; tvlGross: number; borrows: number; defillama: number | null; divergence: number | null; pools: number; logo?: string };
export type Liquidation = { id: string; protocol: string; protocolLabel: string; ts: string; day: string; tx: string; liquidator: string; borrower: string; collateralAsset: string; collateralUsd: number; debtAsset: string; debtUsd: number; gasUsd: number; margin: number };
export type SuiOverview = {
  asOf: string; sample: boolean;
  kpis: { supplied: number; borrowed: number; utilization: number; suppliedChange7d: number; borrowedChange7d: number; lendingPools: number; cdpVaults: number; protocols: number; events30d: number; liquidated30dUsd: number; unpriced30d: number; lendingSupplied: number; cdpSupplied: number };
  history: Point[];              // day, supply (gross TVL), borrow
  byProtocol: Share[];           // net TVL
  liquidationsByDay: Point[];    // day, events, usd
  pools: Pool[]; protocols: Protocol[]; recent: Liquidation[];
  reconciliation: { ours: number; theirs: number; theirsSource: string; note: string } | null;
};
export type PoolDetail = { asOf: string; sample: boolean; pool: Pool; history: Point[]; rates: Point[]; facts: import('./types').Fact[] };
