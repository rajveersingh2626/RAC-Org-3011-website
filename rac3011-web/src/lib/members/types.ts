import { z } from 'zod';

export const memberStatusSchema = z.enum(['pending', 'approved', 'suspended']);
export type MemberStatus = z.infer<typeof memberStatusSchema>;

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  rotaryId: z.string().nullable(),
  clubId: z.string(),
  club: z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable() }),
  photoUrl: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  membershipAnniversary: z.string().nullable(),
  status: memberStatusSchema,
  approvedById: z.string().nullable(),
  approvedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  directoryOptIn: z.boolean(),
  isDacMember: z.boolean(),
  createdAt: z.string(),
});
export type Member = z.infer<typeof memberSchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });

export const directoryEntrySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  photoUrl: z.string().nullable(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  club: z.object({
    id: z.string(),
    name: z.string(),
    shortName: z.string().nullable(),
    zoneId: z.string().nullable(),
    zoneName: z.string().nullable(),
  }),
});
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;

export const skillTagSchema = z.object({ id: z.string(), label: z.string(), kind: z.string() });
export type SkillTag = z.infer<typeof skillTagSchema>;

export const memberCardSchema = z.object({
  memberId: z.string(),
  fullName: z.string(),
  cardId: z.string(),
  clubName: z.string(),
  clubShortName: z.string().nullable(),
  memberSince: z.string().nullable(),
  qrToken: z.string(),
});
export type MemberCard = z.infer<typeof memberCardSchema>;

export const myClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  meetingInfo: z.string().nullable(),
  logoUrl: z.string().nullable(),
  memberCount: z.number(),
  board: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        position: z.string(),
        phone: z.string().nullable(),
        email: z.string().nullable(),
      }),
    )
    .optional(),
});
export type MyClub = z.infer<typeof myClubSchema>;

export const importPreviewRowSchema = z.object({
  lineNumber: z.number(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  rotaryId: z.string().nullable(),
  outcome: z.enum(['new', 'duplicate', 'invalid']),
  errors: z.array(z.string()),
});
export type ImportPreviewRow = z.infer<typeof importPreviewRowSchema>;

export const importPreviewSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  rows: z.array(importPreviewRowSchema),
  summary: z.object({ total: z.number(), new: z.number(), duplicate: z.number(), invalid: z.number() }),
});
export type ImportPreview = z.infer<typeof importPreviewSchema>;

export const importCommitResultSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  committed: z.number(),
  skipped: z.number(),
  memberIds: z.array(z.string()),
});
export type ImportCommitResult = z.infer<typeof importCommitResultSchema>;
