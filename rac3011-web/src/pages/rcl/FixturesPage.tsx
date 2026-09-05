import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { currentRyYear } from '@/lib/reports/month';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { fetchPublicFixtures } from '@/lib/rcl/api';
import type { Fixture, FixtureStatus } from '@/lib/rcl/types';
import { FixtureResultModal } from './FixtureResultModal';
import { FixtureForm } from './FixtureForm';

const MANAGE_SCOPE = { type: 'project', id: 'rcl' } as const;

const STATUS_TONE: Record<FixtureStatus, BadgeTone> = {
  scheduled: 'blue',
  completed: 'green',
  abandoned: 'amber',
};

const STATUS_LABEL: Record<FixtureStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function scoreSummary(fixture: Fixture): string | null {
  if (!fixture.result) return null;
  const { homeRuns, homeWickets, homeOvers, awayRuns, awayWickets, awayOvers } = fixture.result;
  return `${fixture.homeTeam.name} ${homeRuns}/${homeWickets} (${homeOvers}) · ${fixture.awayTeam.name} ${awayRuns}/${awayWickets} (${awayOvers})`;
}

function resultLine(fixture: Fixture): string | null {
  if (!fixture.result) return null;
  if (fixture.status === 'abandoned') return 'Match abandoned';
  const winnerId = fixture.result.winnerTeamId;
  if (!winnerId) return 'Match tied';
  const winner = winnerId === fixture.homeTeamId ? fixture.homeTeam.name : fixture.awayTeam.name;
  return `${winner} won`;
}

interface FixtureRowProps {
  fixture: Fixture;
  canManage: boolean;
  onEnterResult: (f: Fixture) => void;
}

function FixtureRow({ fixture, canManage, onEnterResult }: FixtureRowProps) {
  const summary = scoreSummary(fixture);
  const result = resultLine(fixture);
  return (
    <li className="rounded-[14px] border border-line-accent p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[14.5px] font-extrabold text-fg">
          {fixture.homeTeam.name} <span className="text-fg-3">vs</span> {fixture.awayTeam.name}
        </p>
        <Badge tone={STATUS_TONE[fixture.status]}>{STATUS_LABEL[fixture.status]}</Badge>
      </div>
      <p className="m-0 text-[12px] text-fg-3">
        {formatDateTime(fixture.scheduledAt)}
        {fixture.venue ? ` · ${fixture.venue}` : ''}
      </p>
      {summary ? <p className="m-0 mt-2 text-[12.5px] text-fg-2">{summary}</p> : null}
      {result ? <p className="m-0 mt-0.5 text-[12.5px] font-bold text-accent-deep">{result}</p> : null}
      {canManage ? (
        <Button size="sm" variant="secondary" className="mt-3" onClick={() => onEnterResult(fixture)}>
          {fixture.result ? 'Edit result' : 'Enter result'}
        </Button>
      ) : null}
    </li>
  );
}

export function FixturesPage() {
  useDocumentMeta({ title: 'Fixtures' });
  const { can } = useAuth();
  const canManage = can('subdomain:rcl:manage', MANAGE_SCOPE);
  const season = currentRyYear();

  const [resultTarget, setResultTarget] = useState<Fixture | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({ queryKey: ['rcl', 'fixtures', 'public'], queryFn: fetchPublicFixtures });

  const sorted = [...(query.data ?? [])].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <Container width="wide">
      <Section
        eyebrow="Rotaract Champions League"
        title="Fixtures"
        description="The full season schedule. Completed matches show the final score."
        action={canManage ? <Button onClick={() => setCreating(true)}>New fixture</Button> : null}
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load fixtures" onRetry={() => void query.refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No fixtures scheduled yet"
            body={canManage ? 'Create the first fixture once teams have registered.' : 'Fixtures will appear here once the league schedules them.'}
            action={canManage ? <Button onClick={() => setCreating(true)}>New fixture</Button> : undefined}
          />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {sorted.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} canManage={canManage} onEnterResult={setResultTarget} />
            ))}
          </ul>
        )}
      </Section>

      <FixtureResultModal fixture={resultTarget} onClose={() => setResultTarget(null)} />

      <Modal open={creating} onClose={() => setCreating(false)} title="Create a fixture" size="lg">
        {creating ? <FixtureForm season={season} onDone={() => setCreating(false)} /> : null}
      </Modal>
    </Container>
  );
}
