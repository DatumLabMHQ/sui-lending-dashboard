'use client';
// Pools, protocols and liquidations on the kit's DataTable. Dashboard file: the columns belong to this product.
import Link from 'next/link';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { AssetAvatar } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { address, count, pct, usd } from '@/lib/format';
import type { Liquidation, Pool, Protocol } from '@/lib/sui-types';

type Caption = React.ReactNode;
const riskClass = (u: number) => (u > 85 ? 'text-(--red)' : u > 70 ? 'text-(--yellow)' : 'text-(--green)');
const NA = <span className="text-muted-foreground">n/a</span>;
const Proto = ({ label, logo }: { label: string; logo?: string }) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AssetAvatar symbol={label} src={logo} className="size-4" />{label}</span>;

const poolColumns = defineColumns<Pool>((col) => [
  col.accessor('symbol', { header: 'Pool', enableHiding: false, cell: ({ row }) => (
    <Link href={`/pools/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.symbol} /><span className="leading-tight"><span className="block font-medium">{row.original.symbol}</span><span className="block text-xs text-muted-foreground">{row.original.kind === 'cdp' ? 'CDP vault' : 'lending pool'}</span></span></Link>) }),
  col.accessor('protocolLabel', { header: 'Protocol', cell: ({ row }) => <Proto label={row.original.protocolLabel} logo={row.original.logo} /> }),
  col.accessor('supplied', { header: ({ column }) => <SortHeader column={column} label="Supplied" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.supplied)}</span> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.borrowed)}</span> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Badge variant="outline" className={`px-1.5 tabular-nums ${riskClass(row.original.utilization)}`}><span className="size-1.5 rounded-full bg-current" />{pct(row.original.utilization, 1)}</Badge> }),
  col.accessor('supplyApy', { header: ({ column }) => <SortHeader column={column} label="Supply APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.supplyApy)}</span> }),
  col.accessor('borrowApy', { header: ({ column }) => <SortHeader column={column} label="Borrow APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.borrowApy)}</span> }),
  col.accessor('ltv', { header: 'Max LTV', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{pct(row.original.ltv, 0)}</span> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{pct(row.original.liqThreshold, 0)}</span> }),
]);
export function PoolsTable({ data, title, caption, pageSize = 12 }: { data: Pool[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Pool> rows={data} columns={poolColumns} title={title} caption={caption} getRowId={(p) => p.id} rowHref={(p) => `/pools/${p.id}`}
    search={(p, q) => `${p.symbol} ${p.protocolLabel} ${p.kind}`.toLowerCase().includes(q)} searchPlaceholder="Filter pools"
    numeric={['supplied', 'borrowed', 'utilization', 'supplyApy', 'borrowApy', 'ltv', 'liqThreshold']} labels={{ symbol: 'Pool', protocolLabel: 'Protocol', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', supplyApy: 'Supply APY', borrowApy: 'Borrow APY', ltv: 'Max LTV', liqThreshold: 'Liq. threshold' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="pool" empty="No pools match." />;
}

const protocolColumns = defineColumns<Protocol>((col) => [
  col.accessor('name', { header: 'Protocol', enableHiding: false, cell: ({ row }) => <span className="flex items-center gap-2.5"><AssetAvatar symbol={row.original.name} src={row.original.logo} /><span className="leading-tight"><span className="block font-medium">{row.original.name}</span><span className="block text-xs text-muted-foreground">{row.original.kind === 'cdp' ? 'CDP vaults' : 'lending pools'} · {count(row.original.pools)}</span></span></span> }),
  col.accessor('tvlNet', { header: ({ column }) => <SortHeader column={column} label="Net TVL" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.tvlNet)}</span> }),
  col.accessor('tvlGross', { header: ({ column }) => <SortHeader column={column} label="Gross TVL" />, cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{usd(row.original.tvlGross)}</span> }),
  col.accessor('borrows', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.borrows)}</span> }),
  col.accessor('method', { header: 'Method', cell: ({ row }) => <Badge variant={row.original.method === 'net' ? 'secondary' : 'outline'} className="font-normal">{row.original.method === 'net' ? 'our count' : 'remote figure'}</Badge> }),
  col.accessor('defillama', { header: 'DefiLlama TVL', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.defillama == null ? NA : usd(row.original.defillama)}</span> }),
  col.accessor('divergence', { header: 'Divergence', cell: ({ row }) => (row.original.divergence == null ? NA : <span className={`tabular-nums ${Math.abs(row.original.divergence) > 10 ? 'text-(--yellow)' : 'text-muted-foreground'}`}>{row.original.divergence >= 0 ? '+' : ''}{pct(row.original.divergence, 1)}</span>) }),
]);
export function ProtocolsTable({ data, title, caption }: { data: Protocol[]; title: string; caption: Caption }) {
  return <DataTable<Protocol> rows={data} columns={protocolColumns} title={title} caption={caption} getRowId={(p) => p.id}
    search={(p, q) => p.name.toLowerCase().includes(q)} searchPlaceholder="Filter protocols"
    numeric={['tvlNet', 'tvlGross', 'borrows', 'defillama', 'divergence']} labels={{ name: 'Protocol', tvlNet: 'Net TVL', tvlGross: 'Gross TVL', borrows: 'Borrowed', method: 'Method', defillama: 'DefiLlama TVL', divergence: 'Divergence' }}
    initialSort={[{ id: 'tvlNet', desc: true }]} pageSize={10} noun="protocol" empty="No protocols match." />;
}

const liquidationColumns = defineColumns<Liquidation>((col) => [
  col.accessor('ts', { header: 'When (UTC)', enableHiding: false, cell: ({ row }) => <span className="font-mono text-xs">{row.original.ts}</span> }),
  col.accessor('protocolLabel', { header: 'Protocol', cell: ({ row }) => <span className="text-muted-foreground">{row.original.protocolLabel}</span> }),
  col.accessor('collateralUsd', { header: ({ column }) => <SortHeader column={column} label="Collateral seized" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.collateralUsd)} <span className="text-xs text-muted-foreground">{row.original.collateralAsset}</span></span> }),
  col.accessor('debtUsd', { header: ({ column }) => <SortHeader column={column} label="Debt repaid" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.debtUsd)} <span className="text-xs text-muted-foreground">{row.original.debtAsset}</span></span> }),
  col.accessor('margin', { header: ({ column }) => <SortHeader column={column} label="Liquidator margin" />, cell: ({ row }) => <span className={`tabular-nums ${row.original.margin < 0 ? 'text-(--red)' : ''}`}>{usd(row.original.margin, 2)}</span> }),
  col.accessor('liquidator', { header: 'Liquidator', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{address(row.original.liquidator)}</span> }),
  col.accessor('tx', { header: 'Tx', cell: ({ row }) => (row.original.tx.startsWith('sample') ? NA : <a href={`https://suiscan.xyz/mainnet/tx/${row.original.tx}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowSquareOutIcon className="size-3.5" />Suiscan</a>) }),
]);
export function LiquidationsTable({ data, title, caption, pageSize = 15 }: { data: Liquidation[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Liquidation> rows={data} columns={liquidationColumns} title={title} caption={caption} getRowId={(l) => l.id}
    search={(l, q) => `${l.protocolLabel} ${l.collateralAsset} ${l.debtAsset} ${l.liquidator} ${l.borrower}`.toLowerCase().includes(q)} searchPlaceholder="Filter by protocol, asset or address"
    numeric={['collateralUsd', 'debtUsd', 'margin']} labels={{ ts: 'When', protocolLabel: 'Protocol', collateralUsd: 'Collateral seized', debtUsd: 'Debt repaid', margin: 'Liquidator margin', liquidator: 'Liquidator', tx: 'Tx' }}
    initialSort={[{ id: 'ts', desc: true }]} pageSize={pageSize} noun="event" empty="No liquidations match." />;
}
