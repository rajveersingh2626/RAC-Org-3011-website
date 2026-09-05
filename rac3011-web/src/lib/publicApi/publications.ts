import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['directory', 'newsletter']),
  url: z.string(),
  month: z.string(),
  coverUrl: z.string().nullable(),
});
export type Publication = z.infer<typeof publicationSchema>;

const listSchema = z.object({ items: z.array(publicationSchema) });

export function fetchPublications(): Promise<{ items: Publication[] }> {
  return apiFetch('/public/publications', { schema: listSchema });
}
