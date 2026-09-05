import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const createEnquirySchema = z.object({
  kind: z.enum(['new_club', 'sponsor', 'contact']),
  name: z.string().trim().min(1, 'Enter your name').max(200),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  phone: z.string().trim().max(32).optional(),
  organisation: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, 'Tell us more').max(4000),
  payload: z.record(z.string(), z.unknown()).optional(),
  website: z.string().max(200).optional(),
});
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

const responseSchema = z.object({ received: z.boolean(), routedTo: z.string().nullable().optional() });
export type EnquiryResponse = z.infer<typeof responseSchema>;

export function postEnquiry(input: CreateEnquiryInput): Promise<EnquiryResponse> {
  return apiFetch('/public/enquiries', { method: 'POST', body: input, schema: responseSchema });
}

// Seeded default (prisma/seed/settings.ts `sponsor.ratios`); no public settings endpoint exists yet to read this live.
export const SPONSOR_RATIOS = { perThousand: 1000, mealsPerThousand: 40, kitsPerThousand: 8, unitsPerThousand: 2 };
