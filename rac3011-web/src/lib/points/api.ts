import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import {
  clubFactsSchema,
  clubPointsSummarySchema,
  pointCategorySchema,
  pointRuleSchema,
  type ClubFacts,
  type ClubPointsSummary,
  type PointCategory,
  type PointRule,
  type RulePeriod,
  type RuleType,
  type SourceType,
  type Tier,
} from './types';

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchPointCategories(): Promise<PointCategory[]> {
  return apiFetch('/point-categories', { schema: z.array(pointCategorySchema) });
}

const ruleList = z.object({ items: z.array(pointRuleSchema) });

export async function fetchPointRules(ryYear: number): Promise<PointRule[]> {
  const res = await apiFetch(`/point-rules${query({ ryYear })}`, { schema: ruleList });
  return res.items;
}

export interface PointRuleInput {
  categoryId: string;
  key: string;
  label: string;
  ruleType: RuleType;
  period: RulePeriod;
  sourceType: SourceType;
  sourceKey: string;
  numeratorKey?: string | null;
  denominatorKey?: string | null;
  points?: number | null;
  perUnitCap?: number | null;
  ryYear: number;
  tiers?: Tier[];
}

export async function createPointRule(input: PointRuleInput): Promise<PointRule> {
  return apiFetch('/point-rules', { method: 'POST', body: input, schema: pointRuleSchema });
}

export type PointRuleUpdate = Partial<Omit<PointRuleInput, 'ryYear'>> & { isActive?: boolean };

export async function updatePointRule(id: string, input: PointRuleUpdate): Promise<PointRule> {
  return apiFetch(`/point-rules/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: pointRuleSchema });
}

export async function fetchClubPoints(clubId: string, params: { ryYear: number; month?: string }): Promise<ClubPointsSummary> {
  const qs = query({ ryYear: params.ryYear, month: params.month });
  return apiFetch(`/clubs/${encodeURIComponent(clubId)}/points${qs}`, { schema: clubPointsSummarySchema });
}

export async function patchJudgedPoints(
  clubId: string,
  month: string,
  input: { judgedPoints: number | null; reason?: string | null },
): Promise<ClubPointsSummary> {
  return apiFetch(`/clubs/${encodeURIComponent(clubId)}/points${query({ month })}`, {
    method: 'PATCH',
    body: input,
    schema: clubPointsSummarySchema,
  });
}

export async function fetchClubFacts(clubId: string, ryYear: number): Promise<ClubFacts | null> {
  return apiFetch(`/clubs/${encodeURIComponent(clubId)}/facts${query({ ryYear })}`, {
    schema: clubFactsSchema.nullable(),
  });
}

export type ClubFactsInput = Partial<Omit<ClubFacts, 'id' | 'clubId'>> & { ryYear: number };

export async function updateClubFacts(clubId: string, input: ClubFactsInput): Promise<ClubFacts> {
  return apiFetch(`/clubs/${encodeURIComponent(clubId)}/facts`, {
    method: 'PATCH',
    body: input,
    schema: clubFactsSchema,
  });
}
