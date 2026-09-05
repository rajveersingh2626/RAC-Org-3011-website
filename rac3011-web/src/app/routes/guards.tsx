import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/app/auth';
import type { Scope } from '@/lib/me';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { Skeleton } from '@/components/ui/Skeleton';

function AuthCheckSkeleton() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-16">
      <Skeleton shape="rect" className="h-40" />
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthCheckSkeleton />;
  if (status !== 'authenticated') {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/portal/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

export interface RequirePermissionProps {
  perm: string;
  scope?: Scope;
}

export function RequirePermission({ perm, scope }: RequirePermissionProps) {
  const { status, can } = useAuth();
  if (status === 'loading') return <AuthCheckSkeleton />;
  if (!can(perm, scope)) return <ForbiddenPage />;
  return <Outlet />;
}
