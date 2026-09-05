import { z } from 'zod';
import { apiFetch } from '@/lib/api';

export const publicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  coverUrl: z.string().nullable(),
  rsvpOpen: z.boolean(),
  capacity: z.number().nullable(),
});
export type PublicEvent = z.infer<typeof publicEventSchema>;

const listSchema = z.object({ items: z.array(publicEventSchema) });

export function fetchEvents(from?: Date, to?: Date): Promise<{ items: PublicEvent[] }> {
  const search = new URLSearchParams();
  if (from) search.set('from', from.toISOString());
  if (to) search.set('to', to.toISOString());
  const qs = search.toString();
  return apiFetch(`/public/events${qs ? `?${qs}` : ''}`, { schema: listSchema });
}

export function fetchEvent(slug: string): Promise<PublicEvent> {
  return apiFetch(`/public/events/${encodeURIComponent(slug)}`, { schema: publicEventSchema });
}

export const CALENDAR_ICS_PATH = '/public/calendar.ics';
