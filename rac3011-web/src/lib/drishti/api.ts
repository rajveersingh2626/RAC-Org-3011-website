import { apiFetch } from '@/lib/api';
import { beneficiarySchema, paginatedSchema, type Beneficiary, type DrishtiStage, type Eye } from './types';

const beneficiariesPage = paginatedSchema(beneficiarySchema);

export interface BeneficiaryListParams {
  stage?: DrishtiStage;
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

export async function fetchBeneficiaries(params: BeneficiaryListParams = {}) {
  const qs = query({
    'filter[stage]': params.stage,
    'filter[clubId]': params.clubId,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/drishti/beneficiaries${qs}`, { schema: beneficiariesPage });
}

export async function fetchBeneficiary(id: string): Promise<Beneficiary> {
  return apiFetch(`/drishti/beneficiaries/${encodeURIComponent(id)}`, { schema: beneficiarySchema });
}

export interface CreateBeneficiaryInput {
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  eye: Eye;
  screenedOn: string;
  campLocation?: string | null;
  notes?: string | null;
  clubId?: string;
}

export async function createBeneficiary(input: CreateBeneficiaryInput): Promise<Beneficiary> {
  return apiFetch('/drishti/beneficiaries', { method: 'POST', body: input, schema: beneficiarySchema });
}

export interface SurgeryInput {
  hospital: string;
  operatedOn: string;
  outcome?: string | null;
  followupOn?: string | null;
}

export interface UpdateBeneficiaryInput {
  stage?: DrishtiStage;
  notes?: string | null;
  surgery?: SurgeryInput;
}

export async function updateBeneficiary(id: string, input: UpdateBeneficiaryInput): Promise<Beneficiary> {
  return apiFetch(`/drishti/beneficiaries/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: beneficiarySchema });
}
