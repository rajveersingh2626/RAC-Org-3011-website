import { z } from 'zod';

export const achievementSchema = z.object({
  id: z.string(),
  type: z.enum(['chartered_club', 'award', 'milestone']),
  title: z.string(),
  clubId: z.string().nullable(),
  date: z.string(),
  certificateUrl: z.string().nullable(),
  description: z.string().nullable(),
  order: z.number(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  tier: z.string(),
  website: z.string().nullable(),
  permissionStatus: z.enum(['pending', 'granted']),
  order: z.number(),
});
export type Partner = z.infer<typeof partnerSchema>;

export const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['directory', 'newsletter']),
  url: z.string(),
  month: z.string(),
  coverUrl: z.string().nullable(),
});
export type Publication = z.infer<typeof publicationSchema>;

export const RESOURCE_CATEGORIES = ['documents', 'forms', 'logos', 'photos', 'guest_kit', 'templates'] as const;
export const resourceSchema = z.object({
  id: z.string(),
  category: z.enum(RESOURCE_CATEGORIES),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  isLocked: z.boolean(),
  requiredPermission: z.string().nullable(),
  comingSoonMonth: z.string().nullable(),
  order: z.number(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const pastDrrSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  terms: z.array(z.string()),
  homeClubId: z.string().nullable(),
  photoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  isLowResPhoto: z.boolean(),
  order: z.number(),
});
export type PastDrr = z.infer<typeof pastDrrSchema>;

export const districtTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  kind: z.enum(['core', 'dsc']),
  photoUrl: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  bio: z.string().nullable(),
  clubId: z.string().nullable(),
  order: z.number(),
  ryYear: z.number(),
});
export type DistrictTeamMember = z.infer<typeof districtTeamMemberSchema>;

export const enquirySchema = z.object({
  id: z.string(),
  kind: z.enum(['new_club', 'sponsor', 'contact']),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  organisation: z.string().nullable(),
  message: z.string(),
  payload: z.unknown().nullable(),
  routedTo: z.string(),
  status: z.string(),
  assignedToId: z.string().nullable(),
  createdAt: z.string(),
});
export type Enquiry = z.infer<typeof enquirySchema>;

export const sisterClubRequestSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  partnerClubName: z.string(),
  partnerDistrict: z.string(),
  country: z.string(),
  contactName: z.string(),
  contactEmail: z.string(),
  status: z.string(),
  signedOn: z.string().nullable(),
  submittedById: z.string().nullable(),
  createdAt: z.string(),
});
export type SisterClubRequest = z.infer<typeof sisterClubRequestSchema>;
