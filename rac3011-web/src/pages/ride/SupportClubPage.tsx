import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchSupportClubs } from '@/lib/ride/api';
import { SupportClubForm } from './SupportClubForm';

export function SupportClubPage() {
  useDocumentMeta({ title: 'RIDE — Support club registration' });
  const { me, can } = useAuth();
  const clubId = me?.profile?.clubId ?? null;
  const canRegister = clubId ? can('club_events:log', { type: 'club', id: clubId }) : false;

  const query = useQuery({
    queryKey: ['ride', 'support-clubs', 'mine', clubId],
    queryFn: () => fetchSupportClubs({ clubId: clubId!, pageSize: 1 }),
    enabled: Boolean(clubId) && canRegister,
  });

  if (!clubId || !canRegister) {
    return (
      <Container width="narrow" className="py-16">
        <EmptyState
          title="You don't have access to register a support club"
          body="Only a club's president or secretary can register their club to host a RIDE delegation. If that's you, ask the district office to check your permissions."
        />
      </Container>
    );
  }

  const supportClub = query.data?.items[0] ?? null;

  return (
    <Container width="narrow">
      <Section
        eyebrow="RIDE"
        title={supportClub ? 'Manage your support-club registration' : 'Register as a support club'}
        description={
          supportClub
            ? "Your club's current registration for this Rotary year. One registration per club per year — resubmitting updates it in place."
            : "Tell the district office your club is available to host a visiting delegation this Rotary year."
        }
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load your registration" onRetry={() => void query.refetch()} />
        ) : (
          <SupportClubForm
            key={supportClub?.id ?? 'create'}
            clubId={clubId}
            supportClub={supportClub ?? undefined}
            onDone={() => void query.refetch()}
          />
        )}
      </Section>
    </Container>
  );
}
