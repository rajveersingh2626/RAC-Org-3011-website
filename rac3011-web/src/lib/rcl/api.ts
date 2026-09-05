import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import {
  fixtureSchema,
  paginatedSchema,
  standingsRowSchema,
  teamSchema,
  type Fixture,
  type FixtureStatus,
  type StandingsRow,
  type Team,
  type TeamStatus,
} from './types';

const teamsPage = paginatedSchema(teamSchema);
const fixturesPage = paginatedSchema(fixtureSchema);

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export interface PlayerInput {
  memberId?: string | null;
  name: string;
  role?: string | null;
}

export interface TeamListParams {
  clubId?: string;
  season?: number;
  status?: TeamStatus;
  page?: number;
  pageSize?: number;
}

export async function fetchTeams(params: TeamListParams = {}) {
  const qs = query({
    'filter[clubId]': params.clubId,
    'filter[season]': params.season,
    'filter[status]': params.status,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/rcl/teams${qs}`, { schema: teamsPage });
}

export interface CreateTeamInput {
  season: number;
  clubId: string;
  name: string;
  captainName: string;
  captainPhone: string;
  players: PlayerInput[];
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  return apiFetch('/rcl/teams', { method: 'POST', body: input, schema: teamSchema });
}

export interface UpdateTeamInput {
  name?: string;
  captainName?: string;
  captainPhone?: string;
  status?: TeamStatus;
  players?: PlayerInput[];
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  return apiFetch(`/rcl/teams/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, schema: teamSchema });
}

export interface FixtureListParams {
  season?: number;
  status?: FixtureStatus;
  page?: number;
  pageSize?: number;
}

export async function fetchFixtures(params: FixtureListParams = {}) {
  const qs = query({
    'filter[season]': params.season,
    'filter[status]': params.status,
    page: params.page,
    pageSize: params.pageSize,
  });
  return apiFetch(`/rcl/fixtures${qs}`, { schema: fixturesPage });
}

export interface CreateFixtureInput {
  season: number;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: string;
  venue?: string | null;
}

export async function createFixture(input: CreateFixtureInput): Promise<Fixture> {
  return apiFetch('/rcl/fixtures', { method: 'POST', body: input, schema: fixtureSchema });
}

export interface ResultInput {
  homeRuns: number;
  homeWickets: number;
  homeOvers: number;
  awayRuns: number;
  awayWickets: number;
  awayOvers: number;
  winnerTeamId: string | null;
  notes?: string | null;
}

export interface UpdateFixtureInput {
  scheduledAt?: string;
  venue?: string | null;
  status?: FixtureStatus;
  result?: ResultInput;
}

export async function updateFixture(id: string, input: UpdateFixtureInput): Promise<Fixture> {
  return apiFetch(`/rcl/fixtures/${encodeURIComponent(id)}`, { method: 'PUT', body: input, schema: fixtureSchema });
}

export async function fetchPublicStandings(): Promise<StandingsRow[]> {
  return apiFetch('/public/rcl/standings', { schema: z.array(standingsRowSchema) });
}

export async function fetchPublicFixtures(): Promise<Fixture[]> {
  return apiFetch('/public/rcl/fixtures', { schema: z.array(fixtureSchema) });
}
