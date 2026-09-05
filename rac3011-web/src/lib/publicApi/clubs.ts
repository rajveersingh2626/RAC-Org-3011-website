import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { projectSummarySchema } from './showcase';

export const clubSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  slug: z.string().nullable(),
  zoneId: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  president: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  logoUrl: z.string().nullable(),
  memberCount: z.number(),
});
export type ClubSummary = z.infer<typeof clubSummarySchema>;

export const boardMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  bloodGroup: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  ryYear: z.number(),
});
export type BoardMember = z.infer<typeof boardMemberSchema>;

export const clubDetailSchema = clubSummarySchema.extend({
  secretary: z.string().nullable(),
  secretaryEmail: z.string().nullable(),
  secretaryPhone: z.string().nullable(),
  meetingInfo: z.string().nullable(),
  socialLinks: z.record(z.string(), z.string()).nullable(),
  charterDate: z.string().nullable(),
  board: z.array(boardMemberSchema).optional(),
  projects: z.array(projectSummarySchema).optional(),
});
export type ClubDetail = z.infer<typeof clubDetailSchema>;

const clubListSchema = z.object({ items: z.array(clubSummarySchema), total: z.number() });

export function fetchClubs(zoneId?: string): Promise<{ items: ClubSummary[]; total: number }> {
  const qs = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : '';
  return apiFetch(`/public/clubs${qs}`, { schema: clubListSchema });
}

export function fetchClub(slug: string, include: ('board' | 'projects')[] = []): Promise<ClubDetail> {
  const qs = include.length ? `?include=${include.join(',')}` : '';
  return apiFetch(`/public/clubs/${encodeURIComponent(slug)}${qs}`, { schema: clubDetailSchema });
}

export function whatsappLink(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

// No public zones endpoint exists yet (only zoneId FKs are exposed), so chip labels are
// positional ("Zone 1", "Zone 2"...) rather than the district's real zone names.
export function zoneChipsFrom(clubs: ClubSummary[]): { id: string; label: string }[] {
  const ids = Array.from(new Set(clubs.map((c) => c.zoneId).filter((id): id is string => !!id))).sort();
  return ids.map((id, i) => ({ id, label: `Zone ${i + 1}` }));
}
