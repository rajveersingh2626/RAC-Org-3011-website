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
import { fetchBeneficiaries } from '@/lib/drishti/api';
import { DRISHTI_STAGES, type Beneficiary, type DrishtiStage } from '@/lib/drishti/types';
import { BeneficiaryForm } from './BeneficiaryForm';

const STAGE_TONE: Record<DrishtiStage, BadgeTone> = {
  screened: 'neutral',
  scheduled: 'blue',
  operated: 'pink',
  followup: 'amber',
  closed: 'green',
};

const STAGE_LABEL: Record<DrishtiStage, string> = {
  screened: 'Screened',
  scheduled: 'Scheduled',
  operated: 'Operated',
  followup: 'Follow-up',
  closed: 'Closed',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BeneficiariesPage() {
  useDocumentMeta({ title: 'Beneficiaries' });
  const { me, can } = useAuth();
  const qc = useQueryClient();
  const clubId = me?.profile?.clubId ?? null;
  const canManage = can('subdomain:drishti:manage', { type: 'project', id: 'drishti' });
  const canLogOwn = clubId ? can('club_events:log', { type: 'club', id: clubId }) : false;
  const canCreate = canManage || canLogOwn;

  const [stage, setStage] = useState<DrishtiStage | 'all'>('all');
  const [creating, setCreating] = useState(false);

  const queryKey = ['drishti', 'beneficiaries', stage];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchBeneficiaries({ stage: stage === 'all' ? undefined : stage, pageSize: 100 }),
  });

  const columns: Column<Beneficiary>[] = [
    {
      key: 'name',
      header: 'Patient',
      cell: (b) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{b.name}</p>
          <p className="m-0 text-[11px] text-fg-3">
            {b.club.name} · {formatDate(b.screenedOn)}
          </p>
        </div>
      ),
    },
    { key: 'eye', header: 'Eye', cell: (b) => <span className="capitalize">{b.eye}</span> },
    { key: 'phone', header: 'Phone', cell: (b) => b.phone ?? '—' },
    { key: 'stage', header: 'Stage', cell: (b) => <Badge tone={STAGE_TONE[b.stage]}>{STAGE_LABEL[b.stage]}</Badge> },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="Screening and surgery records"
        title="Beneficiaries"
        description="Every patient screened toward the Project Drishti target, and where they stand in the pipeline."
        action={canCreate ? <Button onClick={() => setCreating(true)}>Log a patient</Button> : null}
      >
        <div className="mb-6">
          <SegmentedControl
            label="Filter by stage"
            value={stage}
            onChange={(v) => setStage(v as DrishtiStage | 'all')}
            options={[{ value: 'all', label: 'All' }, ...DRISHTI_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))]}
          />
        </div>

        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load beneficiaries" onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="No patients here yet"
            body={canCreate ? 'Log the first screened patient to start tracking progress toward the target.' : 'Patients logged by clubs will show up here.'}
            action={canCreate ? <Button onClick={() => setCreating(true)}>Log a patient</Button> : undefined}
          />
        ) : (
          <Table columns={columns} rows={query.data.items} rowKey={(b) => b.id} empty="No patients match this filter." />
        )}
      </Section>

      <Modal open={creating} onClose={() => setCreating(false)} title="Log a patient" size="lg">
        {creating ? (
          <BeneficiaryForm
            canPickClub={canManage}
            onDone={() => {
              setCreating(false);
              void qc.invalidateQueries({ queryKey: ['drishti', 'beneficiaries'] });
            }}
          />
        ) : null}
      </Modal>
    </Container>
  );
}
