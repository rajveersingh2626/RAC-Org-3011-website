import { apiFetch } from '@/lib/api';
import { adminListingSchema, paginatedSchema, statsSchema, type AdminListing, type ListingStatus, type ListingType } from './types';

const listingsPage = paginatedSchema(adminListingSchema);

export interface AdminListingListParams {
  status?: ListingStatus;
  type?: ListingType;
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

export function fetchAdminListings(params: AdminListingListParams = {}) {
  const qs = query({
    'filter[status]': params.status,
    'filter[type]': params.type,
    page: params.page,
    pageSize: params.pageSize ?? 100,
  });
  return apiFetch(`/careerbridge/listings${qs}`, { schema: listingsPage });
}

export function fetchAdminListing(id: string): Promise<AdminListing> {
  return apiFetch(`/careerbridge/listings/${encodeURIComponent(id)}`, { schema: adminListingSchema });
}

export function fetchStats() {
  return apiFetch('/careerbridge/listings/stats', { schema: statsSchema });
}

export interface ReviewListingInput {
  status: 'verified' | 'rejected' | 'filled' | 'expired';
  rejectionReason?: string | null;
}

export function reviewListing(id: string, input: ReviewListingInput): Promise<AdminListing> {
  return apiFetch(`/careerbridge/listings/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: adminListingSchema });
}
