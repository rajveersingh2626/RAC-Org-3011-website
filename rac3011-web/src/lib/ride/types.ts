import { z } from 'zod';

export const clubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable() });
export type ClubRef = z.infer<typeof clubRefSchema>;

export const delegationStatusSchema = z.enum(['planned', 'confirmed', 'completed', 'cancelled']);
export type DelegationStatus = z.infer<typeof delegationStatusSchema>;

export const supportClubSchema = z.object({
  id: z.string(),
  ryYear: z.number(),
  club: clubRefSchema,
  capacityDelegates: z.number(),
  homestayAvailable: z.boolean(),
  preferredMonths: z.array(z.number()),
  contactMemberId: z.string().nullable(),
  contactPhone: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SupportClub = z.infer<typeof supportClubSchema>;

export const delegationHostSchema = z.object({
  id: z.string(),
  club: clubRefSchema,
  daysHosted: z.number(),
  membersSent: z.number(),
});
export type DelegationHost = z.infer<typeof delegationHostSchema>;

export const delegationSchema = z.object({
  id: z.string(),
  ryYear: z.number(),
  visitingDistrict: z.string(),
  country: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  headcount: z.number(),
  contactName: z.string(),
  contactEmail: z.string().nullable(),
  status: delegationStatusSchema,
  hosts: z.array(delegationHostSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Delegation = z.infer<typeof delegationSchema>;

export const galleryItemKindSchema = z.enum(['photo', 'video']);
export type GalleryItemKind = z.infer<typeof galleryItemKindSchema>;

export const galleryItemSchema = z.object({
  id: z.string(),
  year: z.number(),
  url: z.string(),
  kind: galleryItemKindSchema,
  caption: z.string().nullable(),
  order: z.number(),
  createdAt: z.string(),
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}
