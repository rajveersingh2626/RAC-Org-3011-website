import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { titleCaseSlug } from '@/lib/format';

export const resourceSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  isLocked: z.boolean(),
  comingSoonMonth: z.string().nullable(),
});
export type Resource = z.infer<typeof resourceSchema>;

const listSchema = z.object({ items: z.array(resourceSchema) });

export function fetchResources(): Promise<{ items: Resource[] }> {
  return apiFetch('/public/resources', { schema: listSchema });
}

export const categoryLabel = titleCaseSlug;
