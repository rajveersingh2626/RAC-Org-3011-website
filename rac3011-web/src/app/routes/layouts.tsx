import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PortalShell } from '@/components/layout/PortalShell';
import { AdminShell } from '@/components/layout/AdminShell';
import { useLiveVisits } from '@/lib/publicApi/live';
import { SurfaceLoading } from './SurfaceLoading';

export function PublicLayout() {
  const { data } = useLiveVisits();
  return (
    <>
      <PublicHeader />
      <Outlet />
      <PublicFooter visits={data?.count} />
    </>
  );
}

export function PortalLayout() {
  return (
    <PortalShell>
      <Suspense fallback={<SurfaceLoading />}>
        <Outlet />
      </Suspense>
    </PortalShell>
  );
}

export function AdminLayout() {
  return (
    <AdminShell>
      <Suspense fallback={<SurfaceLoading />}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
}
