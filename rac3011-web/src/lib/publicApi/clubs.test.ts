import { whatsappLink, zoneChipsFrom, type ClubSummary } from './clubs';

function club(overrides: Partial<ClubSummary>): ClubSummary {
  return {
    id: 'c1',
    name: 'Club',
    shortName: null,
    slug: 'club',
    zoneId: null,
    lat: null,
    lng: null,
    president: null,
    phone: null,
    email: null,
    logoUrl: null,
    memberCount: 0,
    ...overrides,
  };
}

describe('whatsappLink', () => {
  it('strips non-digit characters', () => {
    expect(whatsappLink('+91 98765 43210')).toBe('https://wa.me/919876543210');
  });
});

describe('zoneChipsFrom', () => {
  it('derives one chip per distinct non-null zoneId, sorted', () => {
    const clubs = [club({ zoneId: 'z2' }), club({ zoneId: 'z1' }), club({ zoneId: null }), club({ zoneId: 'z1' })];
    expect(zoneChipsFrom(clubs)).toEqual([
      { id: 'z1', label: 'Zone 1' },
      { id: 'z2', label: 'Zone 2' },
    ]);
  });

  it('returns an empty list when no club has a zone', () => {
    expect(zoneChipsFrom([club({ zoneId: null })])).toEqual([]);
  });
});
