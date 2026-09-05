import { apiFetch } from '@/lib/api';
import {
  delegationSchema,
  galleryItemSchema,
  paginatedSchema,
  supportClubSchema,
  type Delegation,
  type DelegationStatus,
  type GalleryItem,
  type GalleryItemKind,
  type SupportClub,
} from './types';

const supportClubsPage = paginatedSchema(supportClubSchema);
const delegationsPage = paginatedSchema(delegationSchema);
const galleryItemsPage = paginatedSchema(galleryItemSchema);

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export interface SupportClubListParams {
  ryYear?: number;
  clubId?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchSupportClubs(params: SupportClubListParams = {}) {
  const qs = query({
    'filter[ryYear]': params.ryYear,
    'filter[clubId]': params.clubId,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/ride/support-clubs${qs}`, { schema: supportClubsPage });
}

export interface UpsertSupportClubInput {
  clubId?: string;
  ryYear?: number;
  capacityDelegates: number;
  homestayAvailable: boolean;
  preferredMonths?: number[];
  contactMemberId?: string | null;
  contactPhone: string;
  notes?: string | null;
}

export async function upsertSupportClub(input: UpsertSupportClubInput): Promise<SupportClub> {
  return apiFetch('/ride/support-clubs', { method: 'POST', body: input, schema: supportClubSchema });
}

export interface DelegationListParams {
  status?: DelegationStatus;
  ryYear?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchDelegations(params: DelegationListParams = {}) {
  const qs = query({
    'filter[status]': params.status,
    'filter[ryYear]': params.ryYear,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/ride/delegations${qs}`, { schema: delegationsPage });
}

export async function fetchDelegation(id: string): Promise<Delegation> {
  return apiFetch(`/ride/delegations/${encodeURIComponent(id)}`, { schema: delegationSchema });
}

export interface CreateDelegationInput {
  ryYear: number;
  visitingDistrict: string;
  country: string;
  startsAt: string;
  endsAt: string;
  headcount: number;
  contactName: string;
  contactEmail?: string | null;
  status?: DelegationStatus;
}

export async function createDelegation(input: CreateDelegationInput): Promise<Delegation> {
  return apiFetch('/ride/delegations', { method: 'POST', body: input, schema: delegationSchema });
}

export interface UpdateDelegationInput {
  visitingDistrict?: string;
  country?: string;
  startsAt?: string;
  endsAt?: string;
  headcount?: number;
  contactName?: string;
  contactEmail?: string | null;
  status?: DelegationStatus;
}

export async function updateDelegation(id: string, input: UpdateDelegationInput): Promise<Delegation> {
  return apiFetch(`/ride/delegations/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: delegationSchema });
}

export interface HostAssignmentInput {
  clubId: string;
  daysHosted: number;
  membersSent: number;
}

export async function assignHosts(id: string, hosts: HostAssignmentInput[]): Promise<Delegation> {
  return apiFetch(`/ride/delegations/${encodeURIComponent(id)}/hosts`, {
    method: 'PUT',
    body: { hosts },
    schema: delegationSchema,
  });
}

export interface GalleryItemListParams {
  year?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchGalleryItems(params: GalleryItemListParams = {}) {
  const qs = query({ 'filter[year]': params.year, page: params.page, pageSize: params.pageSize });
  return apiFetch(`/ride/gallery-items${qs}`, { schema: galleryItemsPage });
}

export interface CreateGalleryItemInput {
  year: number;
  url: string;
  kind: GalleryItemKind;
  caption?: string | null;
  order?: number;
}

export async function createGalleryItem(input: CreateGalleryItemInput): Promise<GalleryItem> {
  return apiFetch('/ride/gallery-items', { method: 'POST', body: input, schema: galleryItemSchema });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await apiFetch(`/ride/gallery-items/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
