import { can } from './permissions';
import type { Me } from './me';

const base: Me = {
  user: { id: 'u1', name: 'Dhruv', email: 'd@x.org', twoFactorEnabled: true },
  profile: null,
  roles: [{ roleKey: 'president', scope: { type: 'club', id: 'clubA' } }],
  grants: {
    'reports:submit': [{ type: 'club', id: 'clubA' }],
    'reports:review': [{ type: 'zone', id: 'zonePrithvi' }],
    'settings:manage': [{ type: 'none' }],
    'subdomain:rcl:manage': [{ type: 'project', id: 'rcl' }],
    'members:view': [],
  },
  clubs: [
    { id: 'clubA', name: 'Delhi South', shortName: 'DS', zoneId: 'zonePrithvi' },
    { id: 'clubB', name: 'Saksham', shortName: 'SK', zoneId: 'zoneVayu' },
  ],
  theme: null,
};

describe('can()', () => {
  it('returns false without a session', () => {
    expect(can(null, 'reports:submit')).toBe(false);
    expect(can(undefined, 'reports:submit')).toBe(false);
  });
  it('returns false for missing or empty grants', () => {
    expect(can(base, 'roles:manage')).toBe(false);
    expect(can(base, 'members:view')).toBe(false);
  });
  it('returns true for any non-empty grant when no scope is requested', () => {
    expect(can(base, 'reports:submit')).toBe(true);
    expect(can(base, 'reports:review')).toBe(true);
  });
  it('none scope matches every requested scope', () => {
    expect(can(base, 'settings:manage', { type: 'club', id: 'clubZ' })).toBe(true);
    expect(can(base, 'settings:manage', { type: 'project', id: 'ride' })).toBe(true);
  });
  it('club scope matches only the same club', () => {
    expect(can(base, 'reports:submit', { type: 'club', id: 'clubA' })).toBe(true);
    expect(can(base, 'reports:submit', { type: 'club', id: 'clubB' })).toBe(false);
  });
  it('zone scope matches clubs whose zoneId is in /me.clubs', () => {
    expect(can(base, 'reports:review', { type: 'club', id: 'clubA' })).toBe(true);
    expect(can(base, 'reports:review', { type: 'club', id: 'clubB' })).toBe(false);
    expect(can(base, 'reports:review', { type: 'club', id: 'unknown' })).toBe(false);
  });
  it('project scope matches only the same project', () => {
    expect(can(base, 'subdomain:rcl:manage', { type: 'project', id: 'rcl' })).toBe(true);
    expect(can(base, 'subdomain:rcl:manage', { type: 'project', id: 'ride' })).toBe(false);
    expect(can(base, 'subdomain:rcl:manage', { type: 'club', id: 'clubA' })).toBe(false);
  });
  it('super_admin short-circuits to true', () => {
    const admin: Me = { ...base, roles: [{ roleKey: 'super_admin', scope: { type: 'none' } }], grants: {} };
    expect(can(admin, 'anything:at_all', { type: 'club', id: 'x' })).toBe(true);
  });
});
