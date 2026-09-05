import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const publicClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  slug: z.string(),
  zoneId: z.string().nullable(),
});
export type PublicClub = z.infer<typeof publicClubSchema>;

const publicClubListSchema = z.object({ items: z.array(publicClubSchema), total: z.number() });

export async function fetchPublicClubs(zoneId?: string): Promise<PublicClub[]> {
  const qs = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : '';
  const res = await apiFetch(`/public/clubs${qs}`, { schema: publicClubListSchema });
  return res.items;
}

export const zoneSchema = z.object({ id: z.string(), name: z.string(), order: z.number() });
export type Zone = z.infer<typeof zoneSchema>;

export async function fetchZones(): Promise<Zone[]> {
  return apiFetch('/zones', { schema: z.array(zoneSchema) });
}

export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  zoneId: z.string().nullable(),
});
export type Club = z.infer<typeof clubSchema>;

export async function fetchClub(id: string): Promise<Club> {
  return apiFetch(`/clubs/${encodeURIComponent(id)}`, { schema: clubSchema.passthrough() });
}
