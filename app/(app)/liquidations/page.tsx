import { config } from '@/datum.config';
import { PageHeader } from '@/components/page-header';
import { LiquidationsTable } from '@/components/sui-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadSui } from '@/lib/data';
import { count, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Liquidations' };

export default async function Liquidations() {
  const d = await loadSui();
  const r = d.recent;
  const byProtocol = new Map<string, number>(); r.forEach((l) => byProtocol.set(l.protocolLabel, (byProtocol.get(l.protocolLabel) ?? 0) + l.collateralUsd));
  const seized = r.reduce((a, l) => a + l.collateralUsd, 0), gas = r.reduce((a, l) => a + l.gasUsd, 0), margin = r.reduce((a, l) => a + l.margin, 0);
  const liquidators = new Set(r.map((l) => l.liquidator)).size;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <PageHeader eyebrow="Liquidations" question="How much collateral is being liquidated on Sui, and who is doing it?"
        answer={<>{count(r.length)} liquidations in the last {config.liquidationDays} days seized {usd(seized)} of collateral across NAVI, Suilend, Scallop and AlphaLend, as of {d.asOf}. {count(liquidators)} distinct liquidator addresses did the work, paying {usd(gas)} in gas for an estimated {usd(margin)} of gross margin. Bucket liquidations are structurally near zero and are not indexed.</>} />
      <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @2xl/main:grid-cols-4">
        {stat('Events', count(r.length), `last ${config.liquidationDays} days`)}
        {stat('Collateral seized', usd(seized), 'at the price at the time')}
        {stat('Liquidators', count(liquidators), 'distinct addresses')}
        {stat('Gross margin', usd(margin), `after ${usd(gas)} of gas`)}
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Collateral seized per day</CardTitle><CardDescription>Spikes follow price moves; the days between are the base rate of small positions crossing the line.</CardDescription></CardHeader>
          <CardContent className="px-2">{d.liquidationsByDay.length ? <BarChart data={d.liquidationsByDay} x="day" series={[{ key: 'usd', label: 'Collateral seized' }]} unit="usd" height={220} /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">No liquidations in the window.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Seized by protocol</CardTitle><CardDescription>Where the liquidations happen. Event counts favour Scallop; value favours whoever holds the leveraged SUI.</CardDescription></CardHeader>
          <CardContent><DonutChart items={[...byProtocol.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)} unit="usd" height={220} centerLabel="seized" /></CardContent>
        </Card>
      </div>
      <LiquidationsTable data={r} title="Recent liquidations" pageSize={15}
        caption={<><b className="font-medium text-foreground">One row per event, newest first.</b> Collateral seized and debt repaid at the prices at the time; the liquidator&apos;s margin is the difference after gas. Open the transaction on Suiscan for the full trace.</>} />
    </>
  );
}
