import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const districtTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  kind: z.enum(['core', 'dsc']),
  photoUrl: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  bio: z.string().nullable(),
  clubId: z.string().nullable(),
});
export type DistrictTeamMember = z.infer<typeof districtTeamMemberSchema>;

const listSchema = z.object({ items: z.array(districtTeamMemberSchema) });

export function fetchDistrictTeam(): Promise<{ items: DistrictTeamMember[] }> {
  return apiFetch('/public/district-team', { schema: listSchema });
}
