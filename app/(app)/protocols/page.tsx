import { PageHeader } from '@/components/page-header';
import { ProtocolsTable } from '@/components/sui-tables';
import { BarChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadSui } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Protocols' };

export default async function Protocols() {
  const d = await loadSui();
  const ps = d.protocols;
  const net = ps.reduce((a, p) => a + p.tvlNet, 0);
  const lead = ps[0];
  const compare = ps.map((p) => ({ name: p.name, ours: p.tvlNet, defillama: p.defillama ?? 0 }));
  const worst = [...ps].filter((p) => p.divergence != null).sort((a, b) => Math.abs(b.divergence ?? 0) - Math.abs(a.divergence ?? 0))[0];
  return (
    <>
      <PageHeader eyebrow="Protocols" question="Who holds Sui's lending, and do our numbers agree with DefiLlama's?"
        answer={<>{count(ps.length)} protocols hold {usd(net)} of net TVL as of {d.asOf}; {lead ? `${lead.name} is ${pct(net ? (lead.tvlNet / net) * 100 : 0, 0)} of it.` : ''} {worst && worst.divergence != null ? `The widest gap to DefiLlama is ${worst.name} at ${pct(Math.abs(worst.divergence), 1)}; the table says which figures are our own count and which are the protocol's.` : ''}</>} />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Our net TVL beside DefiLlama&apos;s</CardTitle><CardDescription>Per protocol on the same day. AlphaLend has no DefiLlama figure since July 2026, so its second bar is empty by design.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={compare} x="name" series={[{ key: 'ours', label: 'Our count' }, { key: 'defillama', label: 'DefiLlama' }]} unit="usd" height={260} legend /></CardContent>
        </Card>
      </div>
      <ProtocolsTable data={ps} title="Protocols"
        caption={<><b className="font-medium text-foreground">One row per protocol.</b> Net TVL takes borrowing out of gross. Method says whether the figure is our own count from the pools (NAVI, Suilend, AlphaLend) or the protocol&apos;s remote figure (Scallop, Bucket). Divergence is ours against DefiLlama.</>} />
    </>
  );
}
