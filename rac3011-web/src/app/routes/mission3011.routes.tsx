import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { SubdomainShell } from '@/components/layout/SubdomainShell';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/app/auth';
import { RequirePermission } from './guards';
import { RequireSubdomainAuth } from './subdomainGuards';
import { SurfaceLoading } from './SurfaceLoading';

const Mission3011DashboardPage = lazy(() =>
  import('@/pages/mission3011/Mission3011DashboardPage').then((m) => ({ default: m.Mission3011DashboardPage })),
);
const CampsPage = lazy(() => import('@/pages/mission3011/CampsPage').then((m) => ({ default: m.CampsPage })));
const Mission3011AdminPage = lazy(() =>
  import('@/pages/mission3011/Mission3011AdminPage').then((m) => ({ default: m.Mission3011AdminPage })),
);

const MANAGE_SCOPE = { type: 'project', id: 'mission3011' } as const;

function Layout() {
  const { can } = useAuth();
  const nav = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Camps', to: '/camps' },
    ...(can('subdomain:mission3011:manage', MANAGE_SCOPE) ? [{ label: 'Admin', to: '/admin' }] : []),
  ];
  return (
    <SubdomainShell surface="mission3011" title="Mission 3011" nav={nav}>
      <Suspense fallback={<SurfaceLoading />}>
        <Outlet />
      </Suspense>
    </SubdomainShell>
  );
}

const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Mission3011DashboardPage /> },
      { path: '/dashboard', element: <Mission3011DashboardPage /> },
      {
        element: <RequireSubdomainAuth />,
        children: [
          { path: '/camps', element: <CampsPage /> },
          {
            element: <RequirePermission perm="subdomain:mission3011:manage" scope={MANAGE_SCOPE} />,
            children: [{ path: '/admin', element: <Mission3011AdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createMission3011Router() {
  return createBrowserRouter([
    {
      element: (
        <>
          <ScrollRestoration />
          <Outlet />
        </>
      ),
      children: routes,
    },
  ]);
}
