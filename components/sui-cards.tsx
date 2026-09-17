// The KPI row: shadcn's section-cards recipe on the Sui overview numbers. Server component.
import { TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { count, delta, pct, usd } from '@/lib/format';
import type { SuiOverview } from '@/lib/sui-types';

type Stat = { label: string; value: string; change?: number; headline: string; detail: string };
function Trend({ change }: { change: number }) { const Icon = change >= 0 ? TrendUpIcon : TrendDownIcon; return <Badge variant="outline"><Icon />{delta(change)}</Badge>; }

export function SuiCards({ kpis: k, asOf }: { kpis: SuiOverview['kpis']; asOf: string }) {
  const stats: Stat[] = [
    { label: 'Supplied', value: usd(k.supplied), change: k.suppliedChange7d, headline: k.suppliedChange7d >= 0 ? 'Growing over the week' : 'Shrinking over the week', detail: `${count(k.lendingPools)} lending pools and ${count(k.cdpVaults)} vaults across ${count(k.protocols)} protocols, as of ${asOf}` },
    { label: 'Borrowed', value: usd(k.borrowed), change: k.borrowedChange7d, headline: k.borrowedChange7d >= k.suppliedChange7d ? 'Demand outpacing supply' : 'Supply outpacing demand', detail: 'Debt outstanding against pools and vaults' },
    { label: 'Utilisation', value: pct(k.utilization, 1), headline: k.utilization > 85 ? 'Above the withdrawal-queue line' : k.utilization > 70 ? 'Healthy demand for liquidity' : 'Ample idle liquidity', detail: 'Borrowed divided by supplied' },
    { label: 'Liquidated, 30 days', value: usd(k.liquidated30dUsd), headline: `${k.events30d.toLocaleString('en-US')} liquidation events`, detail: k.unpriced30d ? `Across the four lending protocols; ${k.unpriced30d.toLocaleString('en-US')} more with no debt figure left out` : 'Collateral seized across the four lending protocols' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((s) => (
        <Card key={s.label} className="@container/card">
          <CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums @[250px]/card:text-3xl">{s.value}</CardTitle>{s.change !== undefined ? <CardAction><Trend change={s.change} /></CardAction> : null}</CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm"><div className="line-clamp-1 flex gap-2 font-medium">{s.headline}{s.change !== undefined ? (s.change >= 0 ? <TrendUpIcon className="size-4" /> : <TrendDownIcon className="size-4" />) : null}</div><div className="text-muted-foreground">{s.detail}</div></CardFooter>
        </Card>
      ))}
    </div>
  );
}
