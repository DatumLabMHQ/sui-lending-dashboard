// Overview: the question, the one-line answer, then the numbers. Cards, trend, composition and the
// pools table read the Sui shapes from lib/data.ts (the platform, or labelled sample data).
import { config } from '@/datum.config';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { PageHeader } from '@/components/page-header';
import { SuiCards } from '@/components/sui-cards';
import { PoolsTable } from '@/components/sui-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadSui } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;

export default async function Overview() {
  const d = await loadSui();
  const k = d.kpis;
  const lead = d.protocols[0];
  return (
    <>
      <PageHeader eyebrow="Overview" question={config.question}
        answer={<>{usd(k.supplied)} is supplied across {count(k.lendingPools)} lending pools and {count(k.cdpVaults)} Bucket vaults on {count(k.protocols)} protocols, and {pct(k.utilization, 1)} of it is borrowed. {lead ? `${lead.name} holds the most net TVL at ${usd(lead.tvlNet)}.` : ''} Liquidators seized {usd(k.liquidated30dUsd)} of collateral in {k.events30d.toLocaleString('en-US')} events over thirty days. As of {d.asOf}.</>} />
      <SuiCards kpis={k} asOf={d.asOf} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={d.history} asOf={d.asOf} title="Gross TVL and borrowed, all protocols" description={<>Gross TVL is everything deposited across the five protocols; borrowed is the debt against it. The gap is the idle liquidity that sets rates. Our own count where the pools are read directly, the protocol&apos;s figure where not; daily points, as of {d.asOf}.</>} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Net TVL by protocol</CardTitle><CardDescription>Who holds the deposits after borrowing is netted out. Two lenders carry most of Sui; the rest compete for the remainder.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byProtocol} unit="usd" height={220} centerLabel="net TVL" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Collateral liquidated per day</CardTitle><CardDescription>Thirty days of seized collateral across NAVI, Suilend, Scallop and AlphaLend. Spikes are price moves; a flat line is a quiet market or a stalled indexer.</CardDescription></CardHeader>
          <CardContent className="px-2">{d.liquidationsByDay.length ? <BarChart data={d.liquidationsByDay} x="day" series={[{ key: 'usd', label: 'Collateral seized' }]} unit="usd" height={220} /> : <p className="px-4 py-10 text-center text-sm text-muted-foreground">No liquidations in the window.</p>}</CardContent>
        </Card>
      </div>
      <PoolsTable data={d.pools} title="Pools" pageSize={8}
        caption={<><b className="font-medium text-foreground">Where the money actually is.</b> A handful of pools carry most of the supply; their utilisation is the per-pool risk that the aggregate hides. Largest first; every pool opens to its own history.</>} />
      {d.reconciliation ? (
        <p className="px-4 text-sm text-muted-foreground lg:px-6"><b className="font-medium text-foreground">Reconciliation.</b> Our net TVL for the protocols DefiLlama tracks is {usd(d.reconciliation.ours)}; {d.reconciliation.theirsSource} reports {usd(d.reconciliation.theirs)}. {d.reconciliation.note}</p>
      ) : null}
    </>
  );
}
