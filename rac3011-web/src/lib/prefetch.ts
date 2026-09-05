import { useEffect, useRef } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { fetchClubs } from '@/lib/publicApi/clubs';
import { fetchProjects } from '@/lib/publicApi/showcase';
import { fetchInitiatives } from '@/lib/publicApi/initiatives';
import { fetchPastDrrs } from '@/lib/publicApi/heritage';
import { fetchDistrictTeam } from '@/lib/publicApi/leadership';
import { fetchResources } from '@/lib/publicApi/resources';

const SHOWCASE_PAGE_SIZE = 12;

interface PrefetchEntry {
  queryKey: unknown[];
  queryFn: () => Promise<unknown>;
}

// Keyed by the public nav-link destination; each entry mirrors the queryKey/queryFn
// the destination page itself uses on mount, so the prefetch actually seeds that cache hit.
const NAV_PREFETCH_MAP: Record<string, PrefetchEntry> = {
  '/map': { queryKey: ['public', 'clubs'], queryFn: () => fetchClubs() },
  '/showcase': { queryKey: ['public', 'projects', null, 1], queryFn: () => fetchProjects({ page: 1, pageSize: SHOWCASE_PAGE_SIZE }) },
  '/initiatives': { queryKey: ['public', 'initiatives'], queryFn: fetchInitiatives },
  '/heritage': { queryKey: ['public', 'past-drrs'], queryFn: fetchPastDrrs },
  '/leadership': { queryKey: ['public', 'district-team'], queryFn: fetchDistrictTeam },
  '/resources': { queryKey: ['public', 'resources'], queryFn: fetchResources },
};

function prefetchRoute(client: QueryClient, to: string): void {
  const entry = NAV_PREFETCH_MAP[to];
  if (!entry) return;
  void client.prefetchQuery({ queryKey: entry.queryKey, queryFn: entry.queryFn });
}

// staleTime (5 min default) makes prefetchQuery a no-op when the destination's own
// query already has fresh data, so calling this liberally on hover/focus is safe.
export function useNavPrefetch(): (to: string) => void {
  const client = useQueryClient();
  return (to: string) => prefetchRoute(client, to);
}

const IDLE_FALLBACK_DELAY_MS = 200;

export function useIdlePrefetch(ready: boolean): void {
  const client = useQueryClient();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!ready || firedRef.current) return;
    firedRef.current = true;

    const run = () => {
      void client.prefetchQuery({ queryKey: ['public', 'clubs'], queryFn: () => fetchClubs() });
      void client.prefetchQuery({
        queryKey: ['public', 'projects', 'categories'],
        queryFn: () => fetchProjects({ pageSize: 100 }),
      });
      void client.prefetchQuery({
        queryKey: ['public', 'projects', null, 1],
        queryFn: () => fetchProjects({ page: 1, pageSize: SHOWCASE_PAGE_SIZE }),
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = window.setTimeout(run, IDLE_FALLBACK_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [ready, client]);
}
