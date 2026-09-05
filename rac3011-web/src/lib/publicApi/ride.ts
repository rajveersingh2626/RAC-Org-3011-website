import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { clubRefSchema, delegationStatusSchema, galleryItemKindSchema } from '@/lib/ride/types';

const publicDelegationSchema = z.object({
  id: z.string(),
  ryYear: z.number(),
  visitingDistrict: z.string(),
  country: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  headcount: z.number(),
  status: delegationStatusSchema,
  hosts: z.array(clubRefSchema),
});
export type PublicDelegation = z.infer<typeof publicDelegationSchema>;

const publicIncomingSchema = z.object({ items: z.array(publicDelegationSchema) });

export async function fetchRideIncoming(): Promise<PublicDelegation[]> {
  const res = await apiFetch('/public/ride/incoming', { schema: publicIncomingSchema });
  return res.items;
}

const publicGalleryItemSchema = z.object({
  id: z.string(),
  year: z.number(),
  url: z.string(),
  kind: galleryItemKindSchema,
  caption: z.string().nullable(),
  order: z.number(),
});
export type PublicGalleryItem = z.infer<typeof publicGalleryItemSchema>;

const publicGallerySchema = z.object({ items: z.array(publicGalleryItemSchema), years: z.array(z.number()) });
export type PublicGallery = z.infer<typeof publicGallerySchema>;

export async function fetchRideGallery(year?: number): Promise<PublicGallery> {
  const qs = year ? `?year=${year}` : '';
  return apiFetch(`/public/ride/gallery${qs}`, { schema: publicGallerySchema });
}
