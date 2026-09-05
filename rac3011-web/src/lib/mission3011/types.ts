import { z } from 'zod';

export const campStatusSchema = z.enum(['submitted', 'approved', 'rejected']);
export type CampStatus = z.infer<typeof campStatusSchema>;

export const campClubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable() });
export type CampClubRef = z.infer<typeof campClubRefSchema>;

export const campSchema = z.object({
  id: z.string(),
  leadClub: campClubRefSchema,
  date: z.string(),
  venue: z.string(),
  city: z.string().nullable(),
  unitsCollected: z.number(),
  donorsRegistered: z.number().nullable(),
  partnerBloodBank: z.string().nullable(),
  photos: z.array(z.string()),
  status: campStatusSchema,
  submittedById: z.string(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  participatingClubs: z.array(campClubRefSchema),
  createdAt: z.string(),
});
export type Camp = z.infer<typeof campSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}
