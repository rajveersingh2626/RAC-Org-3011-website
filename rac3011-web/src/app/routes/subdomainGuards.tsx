import { Outlet } from 'react-router';
import { useAuth } from '@/app/auth';
import { mainSiteHref } from '@/app/host';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

function AuthCheckSkeleton() {
  return (
    <Container className="py-16">
      <Skeleton shape="rect" className="h-40" />
    </Container>
  );
}

// Subdomains have no `/portal/login` route and LoginPage's `next` never does a cross-origin
// redirect, so there is no automatic bounce-back; send the visitor to sign in and let them return themselves.
export function RequireSubdomainAuth() {
  const { status } = useAuth();

  if (status === 'loading') return <AuthCheckSkeleton />;

  if (status !== 'authenticated') {
    const loginHref = `${new URL(mainSiteHref()).origin}/portal/login`;
    return (
      <Container className="py-16">
        <EmptyState
          title="Sign in required"
          body="This page is part of the club portal. Sign in on the main site, then come back to this page."
          action={
            <Button onClick={() => window.location.assign(loginHref)}>
              Go to sign in
            </Button>
          }
        />
      </Container>
    );
  }

  return <Outlet />;
}
