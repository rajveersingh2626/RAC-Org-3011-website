import { surfaceHref, type Surface } from '@/app/host';

export interface NavItem {
  key: string;
  label: string;
  to: string;
  perm?: string;
  external?: boolean;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
  perm?: string;
}

function safeSurfaceHref(key: Exclude<Surface, 'main'>): string {
  if (typeof window === 'undefined') return `/?surface=${key}`;
  return surfaceHref(key);
}

export const PORTAL_NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', to: '/portal/dashboard' },
      { key: 'announcements', label: 'Announcements', to: '/portal/announcements' },
      { key: 'resources', label: 'Resources', to: '/portal/resources' },
    ],
  },
  {
    key: 'reporting',
    label: 'Reporting',
    perm: 'reports:submit',
    items: [
      { key: 'new-report', label: 'New report', to: '/portal/reports/new' },
      { key: 'report-history', label: 'History', to: '/portal/reports/history' },
    ],
  },
  {
    key: 'club',
    label: 'Club',
    items: [
      { key: 'my-club', label: 'My club', to: '/portal/my-club' },
      { key: 'events', label: 'Events', to: '/portal/events', perm: 'club_events:log' },
      { key: 'showcase', label: 'Showcase', to: '/portal/showcase/mine', perm: 'showcase:submit' },
      { key: 'directory', label: 'Directory', to: '/portal/directory', perm: 'directory:view' },
    ],
  },
  {
    key: 'initiatives',
    label: 'District Initiatives',
    items: [
      { key: 'drishti', label: 'Project Drishti', to: safeSurfaceHref('drishti'), external: true },
      { key: 'mission3011', label: 'Mission 3011', to: safeSurfaceHref('mission3011'), external: true },
      { key: 'careerbridge', label: 'Career Bridge', to: safeSurfaceHref('careerbridge'), external: true },
      { key: 'rcl', label: 'Cricket League (RCL)', to: safeSurfaceHref('rcl'), external: true },
      { key: 'ride', label: 'RIDE Youth Exchange', to: safeSurfaceHref('ride'), external: true },
    ],
  },
  {
    key: 'me',
    label: 'Me',
    items: [
      { key: 'me-overview', label: 'Overview', to: '/portal/me' },
      { key: 'profile', label: 'Profile', to: '/portal/me/profile' },
      { key: 'contributions', label: 'Contributions', to: '/portal/me/contributions' },
      { key: 'certificates', label: 'Certificates', to: '/portal/me/certificates' },
      { key: 'settings', label: 'Settings', to: '/portal/me/settings' },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    items: [
      { key: 'admin-clubs', label: 'Clubs', to: '/portal/admin/clubs', perm: 'reports:review' },
      { key: 'admin-point-rules', label: 'Point rules', to: '/portal/admin/point-rules', perm: 'point_rules:manage' },
      { key: 'admin-report-form', label: 'Report form', to: '/portal/admin/report-form', perm: 'requests:manage' },
      { key: 'admin-requests', label: 'Requests', to: '/portal/admin/requests', perm: 'requests:manage' },
      { key: 'admin-showcase', label: 'Showcase queue', to: '/portal/admin/showcase', perm: 'showcase:publish' },
      { key: 'admin-members', label: 'Members', to: '/portal/members', perm: 'members:approve' },
      { key: 'admin-effort-log', label: 'Effort log', to: '/portal/admin/effort-log', perm: 'effort:approve' },
      { key: 'admin-events', label: 'Events', to: '/portal/admin/events', perm: 'events:manage' },
      { key: 'admin-feedback', label: 'Feedback', to: '/portal/admin/feedback', perm: 'feedback:review' },
      { key: 'admin-content', label: 'Content', to: '/portal/content', perm: 'content:edit' },
      { key: 'admin-roles', label: 'Roles', to: '/portal/admin/roles', perm: 'roles:manage' },
      { key: 'admin-users', label: 'Users', to: '/portal/admin/users', perm: 'roles:manage' },
      { key: 'admin-announcements', label: 'Announcements', to: '/portal/admin/announcements', perm: 'announcements:send' },
      { key: 'admin-public-content', label: 'Public content', to: '/portal/admin/public-content', perm: 'public_content:manage' },
      { key: 'admin-settings', label: 'Settings', to: '/portal/admin/settings', perm: 'settings:manage' },
      { key: 'admin-audit', label: 'Audit', to: '/portal/admin/audit', perm: 'audit:view' },
    ],
  },
];
