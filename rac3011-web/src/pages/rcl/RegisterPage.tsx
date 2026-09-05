import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { currentRyYear } from '@/lib/reports/month';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchTeams } from '@/lib/rcl/api';
import type { TeamStatus } from '@/lib/rcl/types';
import { TeamForm } from './TeamForm';

const STATUS_TONE: Record<TeamStatus, BadgeTone> = {
  registered: 'blue',
  confirmed: 'green',
  withdrawn: 'neutral',
};

const STATUS_LABEL: Record<TeamStatus, string> = {
  registered: 'Registered',
  confirmed: 'Confirmed',
  withdrawn: 'Withdrawn',
};

export function RegisterPage() {
  useDocumentMeta({ title: 'Register a team' });
  const { me, can } = useAuth();
  const clubId = me?.profile?.clubId ?? null;
  const canRegister = clubId ? can('club_events:log', { type: 'club', id: clubId }) : false;
  const season = currentRyYear();

  const query = useQuery({
    queryKey: ['rcl', 'teams', 'mine', clubId, season],
    queryFn: () => fetchTeams({ clubId: clubId!, season, pageSize: 1 }),
    enabled: Boolean(clubId) && canRegister,
  });

  if (!clubId || !canRegister) {
    return (
      <Container width="narrow" className="py-16">
        <EmptyState
          title="You don't have access to register a team"
          body="Only a club's president or secretary can register a team for the Rotaract Champions League. If that's you, ask the district office to check your permissions."
        />
      </Container>
    );
  }

  const team = query.data?.items[0] ?? null;

  return (
    <Container width="narrow">
      <Section
        eyebrow="Rotaract Champions League"
        title={team ? 'Manage your team' : 'Register a team'}
        description={
          team
            ? `Your club's ${season} season roster. One team per club per season.`
            : `Register your club's team for the ${season} season. Rosters can have up to 15 players.`
        }
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load your team" onRetry={() => void query.refetch()} />
        ) : (
          <>
            {team ? (
              <div className="mb-5 flex items-center gap-2">
                <Badge tone={STATUS_TONE[team.status]}>{STATUS_LABEL[team.status]}</Badge>
              </div>
            ) : null}
            <TeamForm
              key={team?.id ?? 'create'}
              mode={team ? 'edit' : 'create'}
              clubId={clubId}
              season={season}
              team={team ?? undefined}
              onDone={() => void query.refetch()}
            />
          </>
        )}
      </Section>
    </Container>
  );
}
