import { z } from 'zod';

export const drishtiStageSchema = z.enum(['screened', 'scheduled', 'operated', 'followup', 'closed']);
export type DrishtiStage = z.infer<typeof drishtiStageSchema>;

export const DRISHTI_STAGES: DrishtiStage[] = ['screened', 'scheduled', 'operated', 'followup', 'closed'];

export const eyeSchema = z.enum(['left', 'right', 'both']);
export type Eye = z.infer<typeof eyeSchema>;

export const surgerySchema = z.object({
  id: z.string(),
  hospital: z.string(),
  operatedOn: z.string(),
  outcome: z.string().nullable(),
  followupOn: z.string().nullable(),
});
export type Surgery = z.infer<typeof surgerySchema>;

export const beneficiaryClubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable() });
export type BeneficiaryClubRef = z.infer<typeof beneficiaryClubRefSchema>;

export const beneficiarySchema = z.object({
  id: z.string(),
  club: beneficiaryClubRefSchema,
  name: z.string(),
  age: z.number().nullable(),
  gender: z.string().nullable(),
  phone: z.string().nullable(),
  eye: eyeSchema,
  screenedOn: z.string(),
  campLocation: z.string().nullable(),
  stage: drishtiStageSchema,
  notes: z.string().nullable(),
  surgeries: z.array(surgerySchema),
  createdAt: z.string(),
});
export type Beneficiary = z.infer<typeof beneficiarySchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}
