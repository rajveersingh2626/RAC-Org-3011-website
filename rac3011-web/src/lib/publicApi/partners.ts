import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  tier: z.string(),
  website: z.string().nullable(),
  permissionStatus: z.enum(['pending', 'granted']),
});
export type Partner = z.infer<typeof partnerSchema>;

const listSchema = z.object({ items: z.array(partnerSchema) });

export function fetchPartners(): Promise<{ items: Partner[] }> {
  return apiFetch('/public/partners', { schema: listSchema });
}
