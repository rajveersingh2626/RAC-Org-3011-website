import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { useDocumentMeta } from '@/lib/meta';
import { verifyListing } from '@/lib/publicApi/careerbridge';
import { Container } from '@/components/ui/Container';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export function VerifyEmailPage() {
  useDocumentMeta({ title: 'Verify your listing' });
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const mutation = useMutation({ mutationFn: () => verifyListing(token) });
  const { mutate } = mutation;

  useEffect(() => {
    if (token) mutate();
  }, [token, mutate]);

  if (!token) {
    return (
      <Container width="narrow" className="py-16">
        <ErrorState title="Missing verification link" body="This page needs a verification token from your email link." />
      </Container>
    );
  }

  if (mutation.isPending || mutation.isIdle) {
    return (
      <Container width="narrow" className="py-16">
        <Skeleton shape="rect" className="h-32" />
      </Container>
    );
  }

  if (mutation.isError) {
    return (
      <Container width="narrow" className="py-16">
        <ErrorState
          title="This link is invalid or already used"
          body="Verification links can only be used once. If you posted more than once, check your inbox for the most recent email."
        />
      </Container>
    );
  }

  return (
    <Container width="narrow" className="py-16">
      <EmptyState
        title="Email verified"
        body="Your listing has been sent to the Career Bridge admins for review. You'll hear back once it's approved."
        action={
          <Link to="/opportunities" className="font-bold text-accent">
            Browse opportunities
          </Link>
        }
      />
    </Container>
  );
}
