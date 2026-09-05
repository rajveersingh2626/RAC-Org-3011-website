import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const achievementSchema = z.object({
  id: z.string(),
  type: z.enum(['chartered_club', 'award', 'milestone']),
  title: z.string(),
  clubId: z.string().nullable(),
  date: z.string(),
  certificateUrl: z.string().nullable(),
  description: z.string().nullable(),
});
export type Achievement = z.infer<typeof achievementSchema>;

const listSchema = z.object({ items: z.array(achievementSchema) });

export function fetchAchievements(): Promise<{ items: Achievement[] }> {
  return apiFetch('/public/achievements', { schema: listSchema });
}
