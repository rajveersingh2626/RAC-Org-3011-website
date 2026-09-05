import { lazy, type ReactElement } from 'react';
import type { RouteObject } from 'react-router';
import { ComingSoon } from '@/pages/ComingSoon';
import { RequirePermission } from './guards';

const AdminClubsPage = lazy(() => import('@/pages/portal/admin/AdminClubsPage').then((m) => ({ default: m.AdminClubsPage })));
const ScoreMonthPage = lazy(() => import('@/pages/portal/admin/ScoreMonthPage').then((m) => ({ default: m.ScoreMonthPage })));
const ClubFactsPage = lazy(() => import('@/pages/portal/admin/ClubFactsPage').then((m) => ({ default: m.ClubFactsPage })));
const PointRulesPage = lazy(() => import('@/pages/portal/admin/PointRulesPage').then((m) => ({ default: m.PointRulesPage })));
const ReportFormBuilderPage = lazy(() =>
  import('@/pages/portal/admin/ReportFormBuilderPage').then((m) => ({ default: m.ReportFormBuilderPage })),
);
const AdminRequestsPage = lazy(() => import('@/pages/portal/admin/AdminRequestsPage').then((m) => ({ default: m.AdminRequestsPage })));
const NewRequestPage = lazy(() => import('@/pages/portal/admin/NewRequestPage').then((m) => ({ default: m.NewRequestPage })));
const AdminMembersPage = lazy(() => import('@/pages/portal/admin/AdminMembersPage').then((m) => ({ default: m.AdminMembersPage })));
const AdminShowcasePage = lazy(() =>
  import('@/pages/portal/admin/AdminShowcasePage').then((m) => ({ default: m.AdminShowcasePage })),
);
const ContentEditorPage = lazy(() =>
  import('@/pages/portal/ContentEditorPage').then((m) => ({ default: m.ContentEditorPage })),
);
const SettingsPage = lazy(() => import('@/pages/portal/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PublicContentPage = lazy(() =>
  import('@/pages/portal/admin/PublicContentPage').then((m) => ({ default: m.PublicContentPage })),
);

function guarded(perm: string, path: string, element: ReactElement): RouteObject {
  return { element: <RequirePermission perm={perm} />, children: [{ path, element }] };
}

export const portalAdminRouteObjects: RouteObject[] = [
  guarded('reports:review', '/portal/admin/clubs', <AdminClubsPage />),
  guarded('reports:score', '/portal/admin/clubs/:clubId/:month', <ScoreMonthPage />),
  guarded('club_facts:edit', '/portal/admin/clubs/:clubId/facts', <ClubFactsPage />),
  guarded('point_rules:manage', '/portal/admin/point-rules', <PointRulesPage />),
  guarded('requests:manage', '/portal/admin/report-form', <ReportFormBuilderPage />),
  guarded('requests:manage', '/portal/admin/requests/new', <NewRequestPage />),
  guarded('requests:manage', '/portal/admin/requests', <AdminRequestsPage />),
  guarded('content:edit', '/portal/content', <ContentEditorPage />),
  guarded('roles:manage', '/portal/admin/roles', <ComingSoon title="Roles" />),
  guarded('events:checkin', '/portal/admin/events/:slug', <ComingSoon title="Event check-in" />),
  guarded('members:approve', '/portal/members', <AdminMembersPage />),
  guarded('effort:approve', '/portal/admin/effort-log', <ComingSoon title="Effort log" />),
  guarded('announcements:send', '/portal/admin/announcements', <ComingSoon title="Announcements" />),
  guarded('announcements:send', '/portal/admin/announcements/audience', <ComingSoon title="Announcement audience" />),
  guarded('settings:manage', '/portal/admin/settings', <SettingsPage />),
  guarded('feedback:review', '/portal/admin/feedback', <ComingSoon title="Feedback" />),
  guarded('showcase:publish', '/portal/admin/showcase', <AdminShowcasePage />),
  guarded('roles:manage', '/portal/admin/users', <ComingSoon title="Users" />),
  guarded('events:manage', '/portal/admin/events', <ComingSoon title="Events" />),
  guarded('public_content:manage', '/portal/admin/public-content/:kind?', <PublicContentPage />),
  guarded('audit:view', '/portal/admin/audit', <ComingSoon title="Audit log" />),
];
