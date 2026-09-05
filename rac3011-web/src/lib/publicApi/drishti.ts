import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { drishtiStageSchema } from '@/lib/drishti/types';

const pipelineCountsSchema = z.record(drishtiStageSchema, z.number());
export type PipelineCounts = z.infer<typeof pipelineCountsSchema>;

const hospitalSchema = z.object({ hospital: z.string(), surgeries: z.number() });
export type HospitalCount = z.infer<typeof hospitalSchema>;

const perClubSchema = z.object({
  clubId: z.string(),
  clubName: z.string(),
  beneficiaries: z.number(),
  operated: z.number(),
});
export type DrishtiClubCount = z.infer<typeof perClubSchema>;

export const drishtiDashboardSchema = z.object({
  operatedCount: z.number(),
  target: z.number(),
  pipelineCounts: pipelineCountsSchema,
  hospitals: z.array(hospitalSchema),
  perClub: z.array(perClubSchema),
  updatedAt: z.string(),
});
export type DrishtiDashboard = z.infer<typeof drishtiDashboardSchema>;

export function fetchDrishtiDashboard(): Promise<DrishtiDashboard> {
  return apiFetch('/public/drishti/dashboard', { schema: drishtiDashboardSchema });
}
