import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const projectKeySchema = z.enum(['mission3011', 'drishti', 'rcl', 'careerbridge', 'ride']);
export type ProjectKey = z.infer<typeof projectKeySchema>;

const projectSummarySchema = z.object({
  headline: z.string(),
  value: z.number(),
  target: z.number().optional(),
  unit: z.string(),
  secondary: z.array(z.object({ label: z.string(), value: z.union([z.number(), z.string()]) })),
  updatedAt: z.string(),
});

const baseCardSchema = { key: projectKeySchema, label: z.string(), description: z.string() };

export const initiativeCardSchema = z.discriminatedUnion('status', [
  z.object({ ...baseCardSchema, status: z.literal('unassigned') }),
  z.object({ ...baseCardSchema, status: z.literal('unreachable'), leadClubId: z.string() }),
  z.object({ ...baseCardSchema, status: z.literal('active'), leadClubId: z.string(), summary: projectSummarySchema }),
]);
export type InitiativeCard = z.infer<typeof initiativeCardSchema>;

const listSchema = z.object({ items: z.array(initiativeCardSchema) });

export function fetchInitiatives(): Promise<{ items: InitiativeCard[] }> {
  return apiFetch('/public/initiatives', { schema: listSchema });
}
