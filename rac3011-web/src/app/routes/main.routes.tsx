import { createBrowserRouter, Outlet, ScrollRestoration, type RouteObject, Navigate } from 'react-router';
import { PortalLayout, AdminLayout } from './layouts';
import { RequireAuth } from './guards';
import { LoginPage } from '@/pages/portal/LoginPage';
import { RegisterPage } from '@/pages/portal/RegisterPage';
import { PendingPage } from '@/pages/portal/PendingPage';
import { UiKitPage } from '@/pages/UiKitPage';
import { portalMemberRouteObjects } from './portalMember.routes';
import { portalAdminRouteObjects } from './portalAdmin.routes';
import UserDistrictApp from '@/user_frontend/App';

const routes: RouteObject[] = [
  // Teammate Portal routes (Exact portal structure, authentication, dashboard, admin)
  { path: '/portal/login', element: <LoginPage /> },
  { path: '/portal/register', element: <RegisterPage /> },
  { path: '/portal/pending', element: <PendingPage /> },
  {
    element: <RequireAuth />,
    children: [
      { element: <PortalLayout />, children: portalMemberRouteObjects },
      { element: <AdminLayout />, children: portalAdminRouteObjects },
    ],
  },
  { path: '/portal', element: <Navigate to="/portal/login" replace /> },
  { path: '/__ui', element: <UiKitPage /> },

  // Exact User Frontend for all public district website routes
  { path: '/', element: <UserDistrictApp /> },
  { path: '/directory', element: <UserDistrictApp /> },
  { path: '/map', element: <UserDistrictApp /> },
  { path: '/heritage', element: <UserDistrictApp /> },
  { path: '/heritage/*', element: <UserDistrictApp /> },
  { path: '/initiatives', element: <UserDistrictApp /> },
  { path: '/governance', element: <UserDistrictApp /> },
  { path: '/leadership', element: <UserDistrictApp /> },
  { path: '/leadership/*', element: <UserDistrictApp /> },
  { path: '*', element: <UserDistrictApp /> },
];

export function createMainRouter() {
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
