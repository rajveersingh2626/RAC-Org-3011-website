import type { ReactNode } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject } from 'react-router';
import { SubdomainShell } from '@/components/layout/SubdomainShell';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequireSubdomainAuth } from './subdomainGuards';
import { StandingsPage } from '@/pages/rcl/StandingsPage';
import { FixturesPage } from '@/pages/rcl/FixturesPage';
import { RegisterPage } from '@/pages/rcl/RegisterPage';

const NAV = [
  { label: 'Standings', to: '/standings' },
  { label: 'Fixtures', to: '/fixtures' },
  { label: 'Register', to: '/register' },
];

function Layout({ children }: { children: ReactNode }) {
  return (
    <SubdomainShell surface="rcl" title="Rotaract Champions League" nav={NAV}>
      {children}
    </SubdomainShell>
  );
}

const routes: RouteObject[] = [
  { index: true, element: <Layout><StandingsPage /></Layout> },
  { path: '/standings', element: <Layout><StandingsPage /></Layout> },
  { path: '/fixtures', element: <Layout><FixturesPage /></Layout> },
  {
    path: '/register',
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [{ element: <RequireSubdomainAuth />, children: [{ index: true, element: <RegisterPage /> }] }],
  },
  { path: '*', element: <Layout><NotFoundPage /></Layout> },
];

export function createRclRouter() {
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
