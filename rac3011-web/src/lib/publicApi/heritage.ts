import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const pastDrrSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  terms: z.array(z.string()),
  homeClubId: z.string().nullable(),
  photoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  isLowResPhoto: z.boolean(),
});
export type PastDrr = z.infer<typeof pastDrrSchema>;

const listSchema = z.object({ items: z.array(pastDrrSchema) });

export function fetchPastDrrs(): Promise<{ items: PastDrr[] }> {
  return apiFetch('/public/past-drrs', { schema: listSchema });
}

export function fetchPastDrr(slug: string): Promise<PastDrr> {
  return apiFetch(`/public/past-drrs/${encodeURIComponent(slug)}`, { schema: pastDrrSchema });
}

export function groupTermsLabel(terms: string[]): string {
  return [...terms].sort().join(' · ');
}

export function primaryTerm(drr: Pick<PastDrr, 'terms'>): string {
  const sorted = [...drr.terms].sort();
  return sorted[sorted.length - 1] ?? '';
}

export function groupByPrimaryTerm(drrs: PastDrr[]): [string, PastDrr[]][] {
  const map = new Map<string, PastDrr[]>();
  for (const drr of drrs) {
    const key = primaryTerm(drr);
    map.set(key, [...(map.get(key) ?? []), drr]);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}
