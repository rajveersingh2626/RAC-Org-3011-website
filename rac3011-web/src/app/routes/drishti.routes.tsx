import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { SubdomainShell } from '@/components/layout/SubdomainShell';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequireSubdomainAuth } from './subdomainGuards';
import { SurfaceLoading } from './SurfaceLoading';

const DrishtiDashboardPage = lazy(() =>
  import('@/pages/drishti/DrishtiDashboardPage').then((m) => ({ default: m.DrishtiDashboardPage })),
);
const BeneficiariesPage = lazy(() =>
  import('@/pages/drishti/BeneficiariesPage').then((m) => ({ default: m.BeneficiariesPage })),
);
const SurgeriesPage = lazy(() => import('@/pages/drishti/SurgeriesPage').then((m) => ({ default: m.SurgeriesPage })));

const NAV = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Beneficiaries', to: '/beneficiaries' },
  { label: 'Surgeries', to: '/surgeries' },
];

function Layout() {
  return (
    <SubdomainShell surface="drishti" title="Project Drishti" nav={NAV}>
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
      { index: true, element: <DrishtiDashboardPage /> },
      { path: '/dashboard', element: <DrishtiDashboardPage /> },
      {
        element: <RequireSubdomainAuth />,
        children: [
          { path: '/beneficiaries', element: <BeneficiariesPage /> },
          { path: '/surgeries', element: <SurgeriesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createDrishtiRouter() {
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
