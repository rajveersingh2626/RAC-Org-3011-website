import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { ComingSoon } from '@/pages/ComingSoon';

const DashboardPage = lazy(() => import('@/pages/portal/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const NewReportPage = lazy(() => import('@/pages/portal/reports/NewReportPage').then((m) => ({ default: m.NewReportPage })));
const ReviewSubmitPage = lazy(() => import('@/pages/portal/reports/ReviewSubmitPage').then((m) => ({ default: m.ReviewSubmitPage })));
const ReportHistoryPage = lazy(() => import('@/pages/portal/reports/ReportHistoryPage').then((m) => ({ default: m.ReportHistoryPage })));
const ReportDetailPage = lazy(() => import('@/pages/portal/reports/ReportDetailPage').then((m) => ({ default: m.ReportDetailPage })));
const MyClubPage = lazy(() => import('@/pages/portal/MyClubPage').then((m) => ({ default: m.MyClubPage })));
const DirectoryPage = lazy(() => import('@/pages/portal/DirectoryPage').then((m) => ({ default: m.DirectoryPage })));
const MeOverviewPage = lazy(() => import('@/pages/portal/me/MeOverviewPage').then((m) => ({ default: m.MeOverviewPage })));
const ProfilePage = lazy(() => import('@/pages/portal/me/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/portal/me/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SubmitShowcasePage = lazy(() =>
  import('@/pages/portal/showcase/SubmitShowcasePage').then((m) => ({ default: m.SubmitShowcasePage })),
);
const MyShowcasePage = lazy(() =>
  import('@/pages/portal/showcase/MyShowcasePage').then((m) => ({ default: m.MyShowcasePage })),
);

export const portalMemberRouteObjects: RouteObject[] = [
  { path: '/portal/dashboard', element: <DashboardPage /> },
  { path: '/portal/reports/new', element: <NewReportPage /> },
  { path: '/portal/reports/:id/review', element: <ReviewSubmitPage /> },
  { path: '/portal/reports/history', element: <ReportHistoryPage /> },
  { path: '/portal/reports/:id', element: <ReportDetailPage /> },
  { path: '/portal/announcements', element: <ComingSoon title="Announcements" /> },
  { path: '/portal/resources', element: <ComingSoon title="Resources" /> },
  { path: '/portal/my-club', element: <MyClubPage /> },
  { path: '/portal/events', element: <ComingSoon title="Events" /> },
  { path: '/portal/showcase/submit', element: <SubmitShowcasePage /> },
  { path: '/portal/showcase/mine', element: <MyShowcasePage /> },
  { path: '/portal/me', element: <MeOverviewPage /> },
  { path: '/portal/me/profile', element: <ProfilePage /> },
  { path: '/portal/me/settings', element: <SettingsPage /> },
  { path: '/portal/me/contributions', element: <ComingSoon title="Contributions" /> },
  { path: '/portal/me/certificates', element: <ComingSoon title="Certificates" /> },
  { path: '/portal/directory', element: <DirectoryPage /> },
  { path: '/portal/feedback', element: <ComingSoon title="Feedback" /> },
];
