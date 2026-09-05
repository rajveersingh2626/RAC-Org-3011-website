import { z } from 'zod';

export const reportFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'select',
  'multiselect',
  'link',
  'date',
  'boolean',
  'clubs',
]);
export type ReportFieldType = z.infer<typeof reportFieldTypeSchema>;

export const reportFieldSchema = z.object({
  id: z.string(),
  section: z.string(),
  fieldKey: z.string(),
  label: z.string(),
  type: reportFieldTypeSchema,
  options: z.unknown().nullable(),
  required: z.boolean(),
  order: z.number(),
  helpText: z.string().nullable(),
  perActivity: z.boolean(),
  pointSourceKey: z.string().nullable(),
});
export type ReportField = z.infer<typeof reportFieldSchema>;

export const schemaStatusSchema = z.enum(['draft', 'active', 'retired']);
export type SchemaStatus = z.infer<typeof schemaStatusSchema>;

export const reportSchemaSummarySchema = z.object({
  id: z.string(),
  version: z.number(),
  status: schemaStatusSchema,
  publishedAt: z.string().nullable(),
});
export type ReportSchemaSummary = z.infer<typeof reportSchemaSummarySchema>;

export const reportSchemaWithFieldsSchema = reportSchemaSummarySchema.extend({
  fields: z.array(reportFieldSchema),
});
export type ReportSchemaWithFields = z.infer<typeof reportSchemaWithFieldsSchema>;

export const reportStatusSchema = z.enum(['draft', 'submitted', 'queried', 'scored']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportQuerySchema = z.object({
  id: z.string(),
  reportId: z.string(),
  askedById: z.string(),
  question: z.string(),
  reply: z.string().nullable(),
  repliedById: z.string().nullable(),
  repliedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

export const reportClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  zoneId: z.string().nullable(),
});
export type ReportClub = z.infer<typeof reportClubSchema>;

export const reportSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  ryYear: z.number(),
  month: z.string(),
  schemaVersion: z.number(),
  status: reportStatusSchema,
  values: z.record(z.string(), z.unknown()),
  notes: z.string().nullable(),
  submittedById: z.string().nullable(),
  submittedAt: z.string().nullable(),
  filedOnTime: z.boolean().nullable(),
  scoredAt: z.string().nullable(),
  queries: z.array(reportQuerySchema).optional(),
  club: reportClubSchema.optional(),
});
export type Report = z.infer<typeof reportSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}

export const reportRequestAudienceSchema = z.object({
  all: z.boolean().optional(),
  clubIds: z.array(z.string()).optional(),
  zoneIds: z.array(z.string()).optional(),
});
export type ReportRequestAudience = z.infer<typeof reportRequestAudienceSchema>;

export const reportRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(z.string()),
  audience: reportRequestAudienceSchema,
  dueAt: z.string(),
  createdById: z.string(),
});
export type ReportRequest = z.infer<typeof reportRequestSchema>;

export const reportRequestResponseSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  clubId: z.string(),
  answers: z.record(z.string(), z.unknown()),
  submittedById: z.string(),
});
export type ReportRequestResponse = z.infer<typeof reportRequestResponseSchema>;

export const assistResultSchema = z.object({
  summary: z.string(),
  suggestions: z.array(z.object({ fieldKey: z.string().optional(), message: z.string() })),
});
export type AssistResult = z.infer<typeof assistResultSchema>;
