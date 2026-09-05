export const MAX_ROSTER_SIZE = 15;

export interface RosterPlayerInput {
  name: string;
}

export function canAddPlayer(count: number): boolean {
  return count < MAX_ROSTER_SIZE;
}

export function rosterError(players: RosterPlayerInput[]): string | null {
  if (players.length > MAX_ROSTER_SIZE) return `A roster can have at most ${MAX_ROSTER_SIZE} players`;
  const named = players.filter((p) => p.name.trim());
  if (named.length === 0) return 'Add at least one player to the roster';
  if (named.length !== players.length) return 'Every player row needs a name, or remove the row';
  return null;
}
