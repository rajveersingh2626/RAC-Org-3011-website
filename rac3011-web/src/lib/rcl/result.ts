import type { FixtureStatus } from './types';

export interface WinnerInput {
  status: FixtureStatus;
  homeRuns: number;
  awayRuns: number;
  homeTeamId: string;
  awayTeamId: string;
}

// Both sides face the same allotted overs in this league, so the higher total decides it;
// an abandoned match never has a winner regardless of the scores entered.
export function computeWinnerTeamId({ status, homeRuns, awayRuns, homeTeamId, awayTeamId }: WinnerInput): string | null {
  if (status === 'abandoned') return null;
  if (homeRuns > awayRuns) return homeTeamId;
  if (awayRuns > homeRuns) return awayTeamId;
  return null;
}
