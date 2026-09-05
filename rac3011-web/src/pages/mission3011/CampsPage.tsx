import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { fetchCamps } from '@/lib/mission3011/api';
import type { Camp, CampStatus } from '@/lib/mission3011/types';
import { CampForm } from './CampForm';

const STATUS_TONE: Record<CampStatus, BadgeTone> = {
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
};

const STATUS_LABEL: Record<CampStatus, string> = {
  submitted: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Held back',
};

const FILTERS: { value: CampStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Awaiting review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Held back' },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CampsPage() {
  useDocumentMeta({ title: 'Camps' });
  const { me, can } = useAuth();
  const qc = useQueryClient();
  const clubId = me?.profile?.clubId ?? null;
  const canLog = clubId ? can('club_events:log', { type: 'club', id: clubId }) : false;

  const [status, setStatus] = useState<CampStatus | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryKey = ['mission3011', 'camps', status];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchCamps({ status: status === 'all' ? undefined : status, pageSize: 100 }),
  });

  const editing = query.data?.items.find((c) => c.id === editingId) ?? null;
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['mission3011', 'camps'] });

  const columns: Column<Camp>[] = [
    {
      key: 'camp',
      header: 'Camp',
      cell: (c) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{c.venue}</p>
          <p className="m-0 text-[11px] text-fg-3">
            {c.leadClub.name} · {formatDate(c.date)}
            {c.city ? ` · ${c.city}` : ''}
          </p>
          {c.status === 'rejected' && c.rejectionReason ? (
            <p className="m-0 mt-1 max-w-[46ch] text-[11.5px] text-danger-fg">{c.rejectionReason}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'units', header: 'Units', align: 'right', numeric: true, cell: (c) => c.unitsCollected.toLocaleString('en-IN') },
    { key: 'status', header: 'Status', cell: (c) => <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => {
        const isOwner = me?.user.id === c.submittedById;
        if (!isOwner || c.status !== 'submitted') return null;
        return (
          <button type="button" className="font-bold text-accent" onClick={() => setEditingId(c.id)}>
            Edit
          </button>
        );
      },
    },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="Blood donation camps"
        title="Camps"
        description="Every camp a club has logged toward the Mission 3011 target, and where it stands in review."
        action={canLog ? <Button onClick={() => setCreating(true)}>Log a camp</Button> : null}
      >
        <div className="mb-6">
          <SegmentedControl
            label="Filter by status"
            value={status}
            onChange={(v) => setStatus(v as CampStatus | 'all')}
            options={FILTERS.map((f) => ({ value: f.value, label: f.label }))}
          />
        </div>

        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load camps" onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="No camps here yet"
            body={canLog ? 'Log the first camp for your club to start tracking units toward the district target.' : 'Camps logged by clubs will show up here.'}
            action={canLog ? <Button onClick={() => setCreating(true)}>Log a camp</Button> : undefined}
          />
        ) : (
          <Table columns={columns} rows={query.data.items} rowKey={(c) => c.id} empty="No camps match this filter." />
        )}
      </Section>

      <Modal open={creating} onClose={() => setCreating(false)} title="Log a camp" size="lg">
        {creating && clubId ? (
          <CampForm
            mode="create"
            clubId={clubId}
            onDone={() => {
              setCreating(false);
              invalidate();
            }}
          />
        ) : null}
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditingId(null)} title="Edit this camp" size="lg">
        {editing && clubId ? (
          <CampForm
            mode="edit"
            clubId={clubId}
            camp={editing}
            onDone={() => {
              setEditingId(null);
              invalidate();
            }}
          />
        ) : null}
      </Modal>
    </Container>
  );
}
