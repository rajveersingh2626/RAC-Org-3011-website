import type { Me, Scope } from './me';

export type PermissionKey = string;

function scopeMatches(grant: Scope, wanted: Scope | undefined, me: Me): boolean {
  if (grant.type === 'none') return true;
  if (!wanted) return false;
  if (grant.type === 'project') return wanted.type === 'project' && wanted.id === grant.id;
  if (wanted.type !== 'club' || !wanted.id) return false;
  if (grant.type === 'club') return grant.id === wanted.id;
  const club = me.clubs.find((c) => c.id === wanted.id);
  return !!club?.zoneId && club.zoneId === grant.id;
}

export function can(me: Me | null | undefined, key: PermissionKey, scope?: Scope): boolean {
  if (!me) return false;
  if (me.roles.some((r) => r.roleKey === 'super_admin')) return true;
  const grants = me.grants[key];
  if (!grants || grants.length === 0) return false;
  if (!scope) return true;
  return grants.some((g) => scopeMatches(g, scope, me));
}
