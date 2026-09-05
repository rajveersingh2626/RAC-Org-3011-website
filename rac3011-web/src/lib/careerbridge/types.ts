import { z } from 'zod';

export const listingTypeSchema = z.enum(['job', 'internship', 'mentorship']);
export type ListingType = z.infer<typeof listingTypeSchema>;

export const listingModeSchema = z.enum(['remote', 'onsite', 'hybrid']);
export type ListingMode = z.infer<typeof listingModeSchema>;

export const listingStatusSchema = z.enum(['pending_email', 'pending', 'verified', 'filled', 'rejected', 'expired']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const publicListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  type: listingTypeSchema,
  location: z.string(),
  mode: z.string(),
  stipend: z.string().nullable(),
  description: z.string(),
  applyUrl: z.string().nullable(),
  contactEmail: z.string(),
  rotaryAffiliation: z.string().nullable(),
  status: listingStatusSchema,
  createdAt: z.string(),
});
export type PublicListing = z.infer<typeof publicListingSchema>;

export const adminListingSchema = publicListingSchema.extend({
  postedByName: z.string(),
  postedByEmail: z.string(),
  verifiedById: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  filledAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  updatedAt: z.string(),
});
export type AdminListing = z.infer<typeof adminListingSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}

export const statsSchema = z.object({
  pending: z.number(),
  verified: z.number(),
  filled: z.number(),
  rejected: z.number(),
  expired: z.number(),
  totalPosted: z.number(),
});
export type CareerbridgeStats = z.infer<typeof statsSchema>;
