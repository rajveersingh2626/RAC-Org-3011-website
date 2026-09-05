import { z } from 'zod';
import { apiFetch } from '@/lib/api';

const clubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable() });

const zoneUnitsSchema = z.object({ zoneId: z.string().nullable(), zoneName: z.string(), units: z.number() });
export type ZoneUnits = z.infer<typeof zoneUnitsSchema>;

const clubUnitsSchema = z.object({
  clubId: z.string(),
  clubName: z.string(),
  campsApproved: z.number(),
  unitsCollected: z.number(),
});
export type ClubUnits = z.infer<typeof clubUnitsSchema>;

const latestApprovedCampSchema = z.object({
  id: z.string(),
  date: z.string(),
  venue: z.string(),
  city: z.string().nullable(),
  unitsCollected: z.number(),
  leadClub: clubRefSchema,
});
export type LatestApprovedCamp = z.infer<typeof latestApprovedCampSchema>;

export const mission3011DashboardSchema = z.object({
  totalUnits: z.number(),
  target: z.number(),
  byZone: z.array(zoneUnitsSchema),
  latestApprovedCamps: z.array(latestApprovedCampSchema),
  perClub: z.array(clubUnitsSchema),
  updatedAt: z.string(),
});
export type Mission3011Dashboard = z.infer<typeof mission3011DashboardSchema>;

export function fetchMission3011Dashboard(): Promise<Mission3011Dashboard> {
  return apiFetch('/public/mission3011/dashboard', { schema: mission3011DashboardSchema });
}
