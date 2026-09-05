import { describe, expect, it } from 'vitest';
import { canAddPlayer, MAX_ROSTER_SIZE, rosterError } from './roster';

describe('canAddPlayer', () => {
  it('allows adding up to the cap', () => {
    expect(canAddPlayer(0)).toBe(true);
    expect(canAddPlayer(14)).toBe(true);
  });

  it('blocks adding at the cap', () => {
    expect(canAddPlayer(15)).toBe(false);
    expect(canAddPlayer(16)).toBe(false);
  });
});

describe('rosterError', () => {
  it('requires at least one named player', () => {
    expect(rosterError([])).toMatch(/at least one/i);
    expect(rosterError([{ name: '' }, { name: '   ' }])).toMatch(/at least one/i);
  });

  it('accepts a valid roster', () => {
    expect(rosterError([{ name: 'Rahul' }, { name: 'Priya' }])).toBeNull();
  });

  it('rejects a roster over the cap', () => {
    const players = Array.from({ length: MAX_ROSTER_SIZE + 1 }, (_, i) => ({ name: `Player ${i}` }));
    expect(rosterError(players)).toMatch(/at most 15/);
  });

  it('rejects a blank row mixed with named ones', () => {
    expect(rosterError([{ name: 'Rahul' }, { name: '' }])).toMatch(/every player row/i);
  });
});
