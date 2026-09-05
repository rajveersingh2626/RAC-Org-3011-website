import { z } from 'zod';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { projectSummarySchema } from './showcase';

const flagshipItemSchema = z.object({ title: z.string(), summary: z.string() }).catch({ title: '', summary: '' });

const homeSchema = z.object({
  hero: z.object({
    badge: z.string().nullable(),
    title: z.string().nullable(),
    subtitle: z.string().nullable(),
    ctaPrimary: z.string().nullable(),
    ctaSecondary: z.string().nullable(),
  }),
  footerTagline: z.string().nullable(),
  stats: z.object({ zones: z.number(), focusAreas: z.number(), foundedYear: z.number(), ageRange: z.string() }),
  flagship: z.array(flagshipItemSchema).catch([]),
  latestProjects: z.array(projectSummarySchema),
  // optional: §14.2 splits the live visitor counter out into GET /public/live; see lib/publicApi/live.ts
  visits: z.object({ year: z.number(), count: z.number() }).optional(),
});
export type Home = z.infer<typeof homeSchema>;

export const HOME_QUERY_KEY = ['public', 'home'] as const;

export function fetchHome(): Promise<Home> {
  return apiFetch('/public/home', { schema: homeSchema });
}

export function useHomeQuery(): UseQueryResult<Home> {
  return useQuery({ queryKey: HOME_QUERY_KEY, queryFn: fetchHome });
}
