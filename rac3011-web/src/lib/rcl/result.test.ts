import { describe, expect, it } from 'vitest';
import { computeWinnerTeamId } from './result';

const base = { homeTeamId: 'team_home', awayTeamId: 'team_away' };

describe('computeWinnerTeamId', () => {
  it('matches the acceptance example: 150/5 beats 120/8', () => {
    expect(computeWinnerTeamId({ ...base, status: 'completed', homeRuns: 150, awayRuns: 120 })).toBe('team_home');
  });

  it('picks the away team when it scores more', () => {
    expect(computeWinnerTeamId({ ...base, status: 'completed', homeRuns: 100, awayRuns: 140 })).toBe('team_away');
  });

  it('is a tie when scores are level', () => {
    expect(computeWinnerTeamId({ ...base, status: 'completed', homeRuns: 130, awayRuns: 130 })).toBeNull();
  });

  it('is never a winner when abandoned, even with unequal scores', () => {
    expect(computeWinnerTeamId({ ...base, status: 'abandoned', homeRuns: 90, awayRuns: 10 })).toBeNull();
  });
});
