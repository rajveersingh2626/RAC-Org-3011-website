import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { fetchMyProjects } from '@/lib/showcase/api';
import type { ProjectStatus } from '@/lib/showcase/types';
import { ShowcaseQueueCard } from './ShowcaseQueueCard';

const TABS: { value: ProjectStatus; label: string }[] = [
  { value: 'submitted', label: 'Waiting' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Held back' },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function useQueueCount(status: ProjectStatus) {
  return useQuery({
    queryKey: ['projects', 'queue', 'count', status],
    queryFn: () => fetchMyProjects({ status, pageSize: 1 }),
  });
}

export function AdminShowcasePage() {
  useDocumentMeta({ title: 'Showcase moderation queue' });
  const [status, setStatus] = useState<ProjectStatus>('submitted');

  const waitingCount = useQueueCount('submitted');
  const publishedCount = useQueueCount('published');
  const rejectedCount = useQueueCount('rejected');
  const counts: Record<ProjectStatus, number | undefined> = {
    draft: undefined,
    submitted: waitingCount.data?.total,
    published: publishedCount.data?.total,
    rejected: rejectedCount.data?.total,
  };

  const queryKey = ['projects', 'queue', status];
  const listQuery = useQuery({ queryKey, queryFn: () => fetchMyProjects({ status, pageSize: 50 }) });

  return (
    <Container width="wide">
      <Section
        eyebrow="Edit-then-publish, not approve-or-reject"
        title={
          status === 'submitted'
            ? `${listQuery.data?.total ?? '…'} project(s) waiting to be published`
            : 'Showcase moderation'
        }
        description="Submitted text is shown verbatim so you can see exactly what you're changing before it goes public."
        action={
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Badge key={t.value} tone={status === t.value ? 'pink' : 'neutral'}>
                {t.label} · {counts[t.value] ?? '…'}
              </Badge>
            ))}
          </div>
        }
      >
        <div className="mb-6">
          <SegmentedControl
            label="Filter by status"
            value={status}
            onChange={(v) => setStatus(v as ProjectStatus)}
            options={TABS.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>

        {listQuery.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : listQuery.isError ? (
          <ErrorState title="Couldn't load the queue" onRetry={() => void listQuery.refetch()} />
        ) : listQuery.data.items.length === 0 ? (
          <EmptyState title="Nothing here" body="No submissions currently match this filter." />
        ) : status === 'submitted' ? (
          <div className="flex flex-col gap-3.5">
            {listQuery.data.items.map((p) => (
              <ShowcaseQueueCard key={p.id} project={p} queryKey={queryKey} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listQuery.data.items.map((p) => {
              const lead = p.clubs.find((c) => c.role === 'lead')?.club;
              return (
                <div key={p.id} className="rounded-[12px] border border-line-accent p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone="pink">{p.category.toUpperCase()}</Badge>
                    <span className="text-[11.5px] text-fg-3">
                      {lead?.name ?? 'Unknown club'} · {formatDate(p.date)}
                    </span>
                  </div>
                  <p className="m-0 mb-1 text-[14.5px] font-extrabold text-fg">{p.publishedTitle ?? p.title}</p>
                  <p className="m-0 text-[12.5px] text-fg-2">{p.publishedSummary ?? p.summary}</p>
                  {p.status === 'rejected' && p.rejectionReason ? (
                    <p className="m-0 mt-2 text-[12px] font-semibold text-danger-fg">Held: {p.rejectionReason}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </Container>
  );
}
