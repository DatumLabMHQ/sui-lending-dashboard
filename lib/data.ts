// What the kit's frame reads from this dashboard (lib/platform.ts FrameData), plus the loaders the
// pages use. The Sui shapes and loaders live in lib/sui.ts.
import type { FrameData } from './platform';
import { loadSui } from './sui';
export { platformStatus, showKit } from './platform';
export { loadSui, loadPool } from './sui';

/** Pools and protocols, for the cmd+k palette. */
export const searchItems: FrameData['searchItems'] = async () => {
  const o = await loadSui();
  return [
    ...o.pools.map((p) => ({ label: `${p.symbol} on ${p.protocolLabel}`, href: `/pools/${p.id}`, hint: p.kind === 'cdp' ? 'Vault' : 'Pool' })),
    ...o.protocols.map((p) => ({ label: p.name, href: '/protocols', hint: 'Protocol' })),
  ];
};
/** Counts next to the nav entries. */
export const navBadges: FrameData['navBadges'] = async () => {
  const o = await loadSui();
  return { '/pools': o.pools.length, '/liquidations': o.recent.length, '/protocols': o.protocols.length };
};
/** The pools and protocols under their pages in the sidebar. */
export const navChildren: FrameData['navChildren'] = async () => {
  const o = await loadSui();
  return {
    '/pools': o.pools.map((p) => ({ label: `${p.symbol} · ${p.protocolLabel}`, href: `/pools/${p.id}` })),
    '/protocols': o.protocols.map((p) => ({ label: p.name, href: '/protocols' })),
  };
};
