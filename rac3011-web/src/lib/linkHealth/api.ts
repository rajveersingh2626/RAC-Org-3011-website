import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const assetLinkSchema = z.object({
  id: z.string(),
  url: z.string(),
  kind: z.string(),
  status: z.enum(['unchecked', 'ok', 'broken', 'private']),
  lastCheckedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  ownerUserId: z.string().nullable(),
  resourceType: z.string(),
  resourceId: z.string(),
});
export type AssetLink = z.infer<typeof assetLinkSchema>;

const listSchema = z.object({ items: z.array(assetLinkSchema), total: z.number() });

export async function fetchAssetLinks(status?: AssetLink['status']): Promise<AssetLink[]> {
  const qs = status ? `?${new URLSearchParams({ 'filter[status]': status }).toString()}` : '';
  const res = await apiFetch(`/asset-links${qs}`, { schema: listSchema });
  return res.items;
}

export async function recheckAssetLink(id: string): Promise<AssetLink> {
  return apiFetch(`/asset-links/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { recheck: true },
    schema: assetLinkSchema,
  });
}
