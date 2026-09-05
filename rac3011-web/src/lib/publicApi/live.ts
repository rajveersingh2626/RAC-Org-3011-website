import { useEffect } from 'react';
import { z } from 'zod';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

const liveVisitsSchema = z.object({ year: z.number(), count: z.number() });
export type LiveVisits = z.infer<typeof liveVisitsSchema>;

const homeVisitsFallbackSchema = z.object({ visits: liveVisitsSchema });

export const LIVE_QUERY_KEY = ['public', 'live'] as const;

// GET /public/live may not exist yet (it splits the counter out of /public/home per
// spec §14.2); a 404 falls back to reading visits off /public/home so the page never breaks.
async function fetchLiveVisits(): Promise<LiveVisits> {
  try {
    return await apiFetch('/public/live', { schema: liveVisitsSchema });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const home = await apiFetch('/public/home', { schema: homeVisitsFallbackSchema });
      return home.visits;
    }
    throw err;
  }
}

export function useLiveVisits(): UseQueryResult<LiveVisits> {
  return useQuery({ queryKey: LIVE_QUERY_KEY, queryFn: fetchLiveVisits, refetchInterval: 10_000 });
}

const VISIT_SESSION_KEY = 'rac3011.visitCounted';

export function useVisitOnce(): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY)) return;
    window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    void apiFetch('/public/visits', { method: 'POST', schema: liveVisitsSchema })
      .then((visits) => qc.setQueryData<LiveVisits>(LIVE_QUERY_KEY, visits))
      .catch(() => {
        window.sessionStorage.removeItem(VISIT_SESSION_KEY);
      });
  }, [qc]);
}
