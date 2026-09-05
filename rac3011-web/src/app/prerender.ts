import { dehydrate, hydrate, type DehydratedState, type Query, type QueryClient } from '@tanstack/react-query';

declare global {
  interface Window {
    __RAC_PRERENDERED__?: boolean;
    __RAC_PRERENDERED_STATE__?: DehydratedState;
    __RAC_DEHYDRATE__?: () => string;
  }
}

// Predicate is passed in (not imported from ./providers) to avoid a circular import.
export function exposeQueryClientForPrerender(client: QueryClient, shouldDehydrateQuery: (query: Query) => boolean): void {
  if (typeof window === 'undefined') return;
  window.__RAC_DEHYDRATE__ = () => JSON.stringify(dehydrate(client, { shouldDehydrateQuery }));
}

// No-op when the page wasn't prerendered (or was degraded at build time, see scripts/prerender.ts).
export function hydratePrerenderedState(client: QueryClient): void {
  if (typeof window === 'undefined' || !window.__RAC_PRERENDERED_STATE__) return;
  hydrate(client, window.__RAC_PRERENDERED_STATE__);
}

export function isPrerendered(): boolean {
  return typeof window !== 'undefined' && window.__RAC_PRERENDERED__ === true;
}
