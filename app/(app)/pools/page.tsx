import { PageHeader } from '@/components/page-header';
import { PoolsTable } from '@/components/sui-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadSui } from '@/lib/data';
import { count, pct } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Pools' };

export default async function Pools() {
  const d = await loadSui();
  const lending = d.pools.filter((p) => p.kind === 'lending');
  const high = lending.filter((p) => p.risk === 'high' && p.borrowed > 1e5);
  const byAsset = new Map<string, number>(); lending.forEach((p) => byAsset.set(p.symbol, (byAsset.get(p.symbol) ?? 0) + p.supplied));
  const assets = [...byAsset.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const tight = [...lending].filter((p) => p.borrowed > 1e5).sort((a, b) => b.utilization - a.utilization).slice(0, 10).map((p) => ({ name: `${p.symbol} · ${p.protocolLabel}`, utilization: p.utilization }));
  return (
    <>
      <PageHeader eyebrow="Pools" question="Which pools carry the risk?"
        answer={<>{count(d.pools.length)} pools and vaults as of {d.asOf}, aggregate utilisation {pct(d.kpis.utilization, 1)}. {high.length === 0 ? 'No pool with real borrowing is above 85% utilisation, the line where withdrawals start to queue.' : `${count(high.length)} ${high.length === 1 ? 'pool is' : 'pools are'} above 85% utilisation with real borrowing behind it, where withdrawals start to queue.`}</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Supplied by asset</CardTitle><CardDescription>What Sui lends: SUI and its staked forms, then dollars, then bridged BTC. Across the four lending protocols.</CardDescription></CardHeader>
          <CardContent><DonutChart items={assets} unit="usd" height={220} centerLabel="supplied" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tightest pools</CardTitle><CardDescription>Utilisation of the ten most-borrowed pools. Above 85% a supplier may wait to withdraw and the borrow rate climbs.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={tight} x="name" series={[{ key: 'utilization', label: 'Utilisation' }]} unit="pct" horizontal labels height={Math.max(220, tight.length * 28)} categoryWidth={140} /></CardContent>
        </Card>
      </div>
      <PoolsTable data={d.pools} title="All pools and vaults" pageSize={20}
        caption={<><b className="font-medium text-foreground">Per-pool risk.</b> Utilisation above 85% means suppliers may wait to withdraw; LTV and the liquidation threshold say how far a borrower can go and where they are liquidated. Bucket rows are CDP vaults: collateral posted, stablecoin minted.</>} />
    </>
  );
}
