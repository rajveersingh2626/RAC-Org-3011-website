import { z } from 'zod';

export const ruleTypeSchema = z.enum(['flat', 'per_unit', 'tiered', 'penalty']);
export type RuleType = z.infer<typeof ruleTypeSchema>;

export const rulePeriodSchema = z.enum(['monthly', 'yearly', 'once']);
export type RulePeriod = z.infer<typeof rulePeriodSchema>;

export const sourceTypeSchema = z.enum([
  'report_field',
  'club_fact',
  'event_attendance',
  'project_collaboration',
  'ride_hosting',
  'club_events',
]);
export type SourceType = z.infer<typeof sourceTypeSchema>;

export const tierSchema = z.object({ min: z.number(), max: z.number().nullable(), points: z.number() });
export type Tier = z.infer<typeof tierSchema>;

export const pointCategorySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  order: z.number(),
});
export type PointCategory = z.infer<typeof pointCategorySchema>;

export const pointRuleSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryKey: z.string(),
  key: z.string(),
  label: z.string(),
  ruleType: ruleTypeSchema,
  period: rulePeriodSchema,
  sourceType: sourceTypeSchema,
  sourceKey: z.string(),
  numeratorKey: z.string().nullable(),
  denominatorKey: z.string().nullable(),
  points: z.number().nullable(),
  perUnitCap: z.number().nullable(),
  isActive: z.boolean(),
  ryYear: z.number(),
  tiers: z.array(tierSchema),
});
export type PointRule = z.infer<typeof pointRuleSchema>;

export const clubPointsEntrySchema = z.object({
  id: z.string(),
  ruleId: z.string().nullable(),
  ruleKey: z.string().nullable(),
  ruleLabel: z.string().nullable(),
  ruleType: ruleTypeSchema.nullable(),
  rulePeriod: rulePeriodSchema.nullable(),
  categoryId: z.string(),
  categoryKey: z.string(),
  categoryName: z.string(),
  periodKey: z.string(),
  points: z.number(),
  trace: z.unknown(),
});
export type ClubPointsEntry = z.infer<typeof clubPointsEntrySchema>;

export const clubPointsJudgedSchema = z
  .object({
    points: z.number(),
    reason: z.string().nullable(),
    createdById: z.string().nullable(),
    updatedAt: z.string(),
  })
  .nullable();
export type ClubPointsJudged = z.infer<typeof clubPointsJudgedSchema>;

export const clubPointsSummarySchema = z.object({
  clubId: z.string(),
  ryYear: z.number(),
  total: z.number(),
  byCategory: z.array(
    z.object({ categoryId: z.string(), categoryKey: z.string(), categoryName: z.string(), points: z.number() }),
  ),
  byMonth: z.array(z.object({ periodKey: z.string(), points: z.number() })),
  month: z.string().nullable(),
  entries: z.array(clubPointsEntrySchema),
  judged: clubPointsJudgedSchema,
});
export type ClubPointsSummary = z.infer<typeof clubPointsSummarySchema>;

export const clubFactsSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  ryYear: z.number(),
  duesPaidOn: z.string().nullable(),
  riCitationCompleted: z.boolean(),
  paulHarrisFellows: z.number(),
  dualMembers: z.number(),
  mdioCommitteeMembers: z.number(),
  mdioEventsAttended: z.number(),
  sisterClubSignedOn: z.string().nullable(),
  drrVisitOn: z.string().nullable(),
  vocationalCentreOn: z.string().nullable(),
  activeSocialHandles: z.number(),
  clubMerchandise: z.boolean(),
  clubWebsiteUrl: z.string().nullable(),
  priorYearMemberCount: z.number().nullable(),
});
export type ClubFacts = z.infer<typeof clubFactsSchema>;
