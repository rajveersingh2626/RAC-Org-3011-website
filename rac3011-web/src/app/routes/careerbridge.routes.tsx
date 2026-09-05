import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { SubdomainShell } from '@/components/layout/SubdomainShell';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from '@/app/auth';
import { RequirePermission } from './guards';
import { RequireSubdomainAuth } from './subdomainGuards';
import { SurfaceLoading } from './SurfaceLoading';

const OpportunitiesPage = lazy(() =>
  import('@/pages/careerbridge/OpportunitiesPage').then((m) => ({ default: m.OpportunitiesPage })),
);
const OpportunityDetailPage = lazy(() =>
  import('@/pages/careerbridge/OpportunityDetailPage').then((m) => ({ default: m.OpportunityDetailPage })),
);
const PostOpportunityPage = lazy(() =>
  import('@/pages/careerbridge/PostOpportunityPage').then((m) => ({ default: m.PostOpportunityPage })),
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/careerbridge/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
);
const CareerbridgeAdminPage = lazy(() =>
  import('@/pages/careerbridge/CareerbridgeAdminPage').then((m) => ({ default: m.CareerbridgeAdminPage })),
);

const MANAGE_SCOPE = { type: 'project', id: 'careerbridge' } as const;

function Layout() {
  const { can } = useAuth();
  const nav = [
    { label: 'Opportunities', to: '/opportunities' },
    { label: 'Post an opening', to: '/post' },
    ...(can('subdomain:careerbridge:manage', MANAGE_SCOPE) ? [{ label: 'Admin', to: '/admin' }] : []),
  ];
  return (
    <SubdomainShell surface="careerbridge" title="Career Bridge" nav={nav}>
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
      { index: true, element: <OpportunitiesPage /> },
      { path: '/opportunities', element: <OpportunitiesPage /> },
      { path: '/opportunities/:id', element: <OpportunityDetailPage /> },
      { path: '/post', element: <PostOpportunityPage /> },
      { path: '/verify', element: <VerifyEmailPage /> },
      {
        element: <RequireSubdomainAuth />,
        children: [
          {
            element: <RequirePermission perm="subdomain:careerbridge:manage" scope={MANAGE_SCOPE} />,
            children: [{ path: '/admin', element: <CareerbridgeAdminPage /> }],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createCareerbridgeRouter() {
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
