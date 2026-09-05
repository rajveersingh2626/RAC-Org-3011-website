import { z } from 'zod';

export const teamStatusSchema = z.enum(['registered', 'confirmed', 'withdrawn']);
export type TeamStatus = z.infer<typeof teamStatusSchema>;

export const rclClubRefSchema = z.object({ id: z.string(), name: z.string(), shortName: z.string().nullable().optional() });
export type RclClubRef = z.infer<typeof rclClubRefSchema>;

export const playerSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  memberId: z.string().nullable(),
  name: z.string(),
  role: z.string().nullable(),
});
export type Player = z.infer<typeof playerSchema>;

export const teamSchema = z.object({
  id: z.string(),
  season: z.number(),
  clubId: z.string(),
  club: rclClubRefSchema,
  name: z.string(),
  captainName: z.string(),
  captainPhone: z.string(),
  status: teamStatusSchema,
  players: z.array(playerSchema),
  createdById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Team = z.infer<typeof teamSchema>;

export const fixtureStatusSchema = z.enum(['scheduled', 'completed', 'abandoned']);
export type FixtureStatus = z.infer<typeof fixtureStatusSchema>;

export const fixtureTeamRefSchema = z.object({ id: z.string(), name: z.string(), clubId: z.string() });
export type FixtureTeamRef = z.infer<typeof fixtureTeamRefSchema>;

export const resultSchema = z.object({
  fixtureId: z.string(),
  homeRuns: z.number(),
  homeWickets: z.number(),
  homeOvers: z.number(),
  awayRuns: z.number(),
  awayWickets: z.number(),
  awayOvers: z.number(),
  winnerTeamId: z.string().nullable(),
  notes: z.string().nullable(),
  enteredById: z.string(),
});
export type Result = z.infer<typeof resultSchema>;

export const fixtureSchema = z.object({
  id: z.string(),
  season: z.number(),
  homeTeamId: z.string(),
  homeTeam: fixtureTeamRefSchema,
  awayTeamId: z.string(),
  awayTeam: fixtureTeamRefSchema,
  scheduledAt: z.string(),
  venue: z.string().nullable(),
  status: fixtureStatusSchema,
  result: resultSchema.nullable(),
});
export type Fixture = z.infer<typeof fixtureSchema>;

export const standingsRowSchema = z
  .object({
    teamId: z.string(),
    teamName: z.string(),
    clubName: z.string(),
    played: z.number(),
    won: z.number(),
    lost: z.number(),
    tied: z.number(),
    points: z.number(),
    nrr: z.number(),
  })
  .passthrough();
export type StandingsRow = z.infer<typeof standingsRowSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), total: z.number(), page: z.number(), pageSize: z.number() });
}
