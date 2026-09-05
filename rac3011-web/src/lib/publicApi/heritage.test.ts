import { groupByPrimaryTerm, groupTermsLabel, primaryTerm, type PastDrr } from './heritage';

function drr(overrides: Partial<PastDrr>): PastDrr {
  return {
    id: 'd1',
    name: 'Name',
    slug: 'name',
    terms: ['2020-21'],
    homeClubId: null,
    photoUrl: null,
    bio: null,
    isLowResPhoto: false,
    ...overrides,
  };
}

describe('groupTermsLabel', () => {
  it('joins non-contiguous terms in ascending order', () => {
    expect(groupTermsLabel(['2018-19', '2015-16'])).toBe('2015-16 · 2018-19');
  });
});

describe('primaryTerm', () => {
  it('picks the most recent of several terms', () => {
    expect(primaryTerm({ terms: ['1989-90', '1990-91'] })).toBe('1990-91');
  });
});

describe('groupByPrimaryTerm', () => {
  it('groups DRRs sharing a most-recent term and orders groups newest first', () => {
    const a = drr({ id: 'a', terms: ['2022-23'] });
    const b = drr({ id: 'b', terms: ['2022-23'] });
    const c = drr({ id: 'c', terms: ['2020-21'] });
    const groups = groupByPrimaryTerm([c, a, b]);
    expect(groups.map(([term]) => term)).toEqual(['2022-23', '2020-21']);
    expect(groups[0]?.[1].map((d) => d.id).sort()).toEqual(['a', 'b']);
  });
});
