import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { SubdomainShell } from '@/components/layout/SubdomainShell';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/app/auth';
import { RequirePermission } from './guards';
import { RequireSubdomainAuth } from './subdomainGuards';
import { SurfaceLoading } from './SurfaceLoading';

const RideIncomingPage = lazy(() => import('@/pages/ride/RideIncomingPage').then((m) => ({ default: m.RideIncomingPage })));
const SupportClubPage = lazy(() => import('@/pages/ride/SupportClubPage').then((m) => ({ default: m.SupportClubPage })));
const RideGalleryPage = lazy(() => import('@/pages/ride/RideGalleryPage').then((m) => ({ default: m.RideGalleryPage })));
const RideAdminPage = lazy(() => import('@/pages/ride/RideAdminPage').then((m) => ({ default: m.RideAdminPage })));

const MANAGE_SCOPE = { type: 'project', id: 'ride' } as const;

function Layout() {
  const { can } = useAuth();
  const nav = [
    { label: 'Incoming', to: '/incoming' },
    { label: 'Support club', to: '/support-club' },
    { label: 'Gallery', to: '/gallery' },
    ...(can('subdomain:ride:manage', MANAGE_SCOPE) ? [{ label: 'Admin', to: '/admin' }] : []),
  ];
  return (
    <SubdomainShell surface="ride" title="RIDE" nav={nav}>
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
      { index: true, element: <RideIncomingPage /> },
      { path: '/incoming', element: <RideIncomingPage /> },
      { path: '/gallery', element: <RideGalleryPage /> },
      {
        element: <RequireSubdomainAuth />,
        children: [
          { path: '/support-club', element: <SupportClubPage /> },
          {
            element: <RequirePermission perm="subdomain:ride:manage" scope={MANAGE_SCOPE} />,
            children: [{ path: '/admin', element: <RideAdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createRideRouter() {
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
