import { apiFetch } from '@/lib/api';
import { campSchema, paginatedSchema, type Camp, type CampStatus } from './types';

const campsPage = paginatedSchema(campSchema);

export interface CampListParams {
  status?: CampStatus;
  clubId?: string;
  page?: number;
  pageSize?: number;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchCamps(params: CampListParams = {}) {
  const qs = query({
    'filter[status]': params.status,
    'filter[clubId]': params.clubId,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/mission3011/camps${qs}`, { schema: campsPage });
}

export async function fetchCamp(id: string): Promise<Camp> {
  return apiFetch(`/mission3011/camps/${encodeURIComponent(id)}`, { schema: campSchema });
}

export interface CreateCampInput {
  date: string;
  venue: string;
  city?: string | null;
  unitsCollected: number;
  donorsRegistered?: number | null;
  partnerBloodBank?: string | null;
  photos?: string[];
  participatingClubIds?: string[];
}

export async function createCamp(input: CreateCampInput): Promise<Camp> {
  return apiFetch('/mission3011/camps', { method: 'POST', body: input, schema: campSchema });
}

export interface EditCampInput {
  date?: string;
  venue?: string;
  city?: string | null;
  unitsCollected?: number;
  donorsRegistered?: number | null;
  partnerBloodBank?: string | null;
  photos?: string[];
  participatingClubIds?: string[];
}

export async function updateCamp(id: string, input: EditCampInput): Promise<Camp> {
  return apiFetch(`/mission3011/camps/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: campSchema });
}

export interface ReviewCampInput {
  status: 'approved' | 'rejected';
  rejectionReason?: string | null;
}

export async function reviewCamp(id: string, input: ReviewCampInput): Promise<Camp> {
  return apiFetch(`/mission3011/camps/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: campSchema });
}
