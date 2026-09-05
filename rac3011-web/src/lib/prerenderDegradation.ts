export interface ApiResponseEvent {
  url: string;
  ok: boolean;
}

// /public/live and /public/visits are deliberately blocked during the crawl (never baked into HTML), so their failure must not count here.
export function isDegraded(events: readonly ApiResponseEvent[], apiOrigin: string): boolean {
  return events.some(
    (e) => e.url.startsWith(`${apiOrigin}/public/`) && !e.url.includes('/public/live') && !e.url.includes('/public/visits') && !e.ok,
  );
}
