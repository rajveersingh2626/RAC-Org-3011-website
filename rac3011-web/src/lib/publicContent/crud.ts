import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export function makeCrud<T>(path: string, schema: z.ZodType<T>) {
  const listSchema = z.object({ items: z.array(schema) });
  return {
    list: async (): Promise<T[]> => (await apiFetch(path, { schema: listSchema })).items,
    create: (input: unknown): Promise<T> => apiFetch(path, { method: 'POST', body: input, schema }),
    update: (id: string, input: unknown): Promise<T> =>
      apiFetch(`${path}/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema }),
    remove: (id: string): Promise<void> =>
      apiFetch(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    reorder: async (ids: string[]): Promise<T[]> =>
      (await apiFetch(`${path}/reorder`, { method: 'POST', body: { ids }, schema: listSchema })).items,
  };
}
