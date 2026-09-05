import { apiFetch } from '@/lib/api';
import { paginatedSchema, publicListingSchema, type ListingType, type PublicListing } from '@/lib/careerbridge/types';

const listingsPage = paginatedSchema(publicListingSchema);

export interface ListingListParams {
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

export function fetchListings(params: ListingListParams = {}) {
  const qs = query({ 'filter[type]': params.type, page: params.page, pageSize: params.pageSize ?? 100 });
  return apiFetch(`/public/careerbridge/listings${qs}`, { schema: listingsPage });
}

export function fetchListing(id: string): Promise<PublicListing> {
  return apiFetch(`/public/careerbridge/listings/${encodeURIComponent(id)}`, { schema: publicListingSchema });
}

export interface SubmitListingInput {
  title: string;
  company: string;
  type: ListingType;
  location: string;
  mode: string;
  stipend?: string | null;
  description: string;
  applyUrl?: string | null;
  contactEmail: string;
  postedByName: string;
  postedByEmail: string;
  rotaryAffiliation?: string | null;
  // Honeypot: always empty for a human visitor. Never rendered with a visible label.
  website?: string;
}

export function submitListing(input: SubmitListingInput): Promise<{ id: string; status: 'pending_email' }> {
  return apiFetch('/public/careerbridge/listings', { method: 'POST', body: input });
}

export function verifyListing(token: string): Promise<{ id: string; status: 'pending' }> {
  return apiFetch('/public/careerbridge/listings/verify', { method: 'POST', body: { token } });
}
