import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchBeneficiaries, updateBeneficiary } from '@/lib/drishti/api';
import { DRISHTI_STAGES, type Beneficiary, type DrishtiStage } from '@/lib/drishti/types';
import { SurgeryMoveModal } from './SurgeryMoveModal';
import { ApiError } from '@/lib/api';

const STAGE_LABEL: Record<DrishtiStage, string> = {
  screened: 'Screened',
  scheduled: 'Scheduled',
  operated: 'Operated',
  followup: 'Follow-up',
  closed: 'Closed',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function nextStageOf(stage: DrishtiStage): DrishtiStage | null {
  const i = DRISHTI_STAGES.indexOf(stage);
  return i >= 0 && i < DRISHTI_STAGES.length - 1 ? DRISHTI_STAGES[i + 1] : null;
}

interface CardProps {
  beneficiary: Beneficiary;
  canManage: boolean;
  onMove: (b: Beneficiary, next: DrishtiStage) => void;
  moving: boolean;
}

function BeneficiaryCard({ beneficiary, canManage, onMove, moving }: CardProps) {
  const next = nextStageOf(beneficiary.stage);
  return (
    <li className="rounded-[12px] border border-line-accent bg-surface p-3.5">
      <p className="m-0 text-[13px] font-bold text-fg">{beneficiary.name}</p>
      <p className="m-0 text-[11px] text-fg-3">
        {beneficiary.club.name} · {formatDate(beneficiary.screenedOn)}
      </p>
      {canManage && next ? (
        <Button
          size="sm"
          variant="secondary"
          className="mt-2.5"
          loading={moving}
          onClick={() => onMove(beneficiary, next)}
        >
          Move to {STAGE_LABEL[next]}
        </Button>
      ) : null}
    </li>
  );
}

export function SurgeriesPage() {
  useDocumentMeta({ title: 'Surgery pipeline' });
  const { can } = useAuth();
  const qc = useQueryClient();
  const canManage = can('subdomain:drishti:manage', { type: 'project', id: 'drishti' });

  const [operatedTarget, setOperatedTarget] = useState<Beneficiary | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['drishti', 'beneficiaries', 'board'],
    queryFn: () => fetchBeneficiaries({ pageSize: 200 }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DrishtiStage }) => updateBeneficiary(id, { stage }),
    onSuccess: () => {
      setMovingId(null);
      void qc.invalidateQueries({ queryKey: ['drishti', 'beneficiaries'] });
    },
    onError: (e: unknown) => {
      setMovingId(null);
      setMoveError(e instanceof ApiError ? e.message : 'Could not move this patient.');
    },
  });

  const onMove = (b: Beneficiary, next: DrishtiStage) => {
    if (next === 'operated') {
      setOperatedTarget(b);
      return;
    }
    setMoveError(null);
    setMovingId(b.id);
    moveMutation.mutate({ id: b.id, stage: next });
  };

  if (query.isPending) {
    return (
      <Container width="wide" className="py-10">
        <Skeleton shape="rect" className="h-64" />
      </Container>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Container width="wide" className="py-10">
        <ErrorState title="Couldn't load the surgery pipeline" onRetry={() => void query.refetch()} />
      </Container>
    );
  }

  const byStage: Record<DrishtiStage, Beneficiary[]> = {
    screened: [],
    scheduled: [],
    operated: [],
    followup: [],
    closed: [],
  };
  for (const b of query.data.items) byStage[b.stage].push(b);

  return (
    <Container width="wide">
      <Section
        eyebrow="Surgery pipeline"
        title="Surgeries"
        description={
          canManage
            ? 'Move patients forward through the pipeline. Moving to operated needs the surgery details.'
            : 'Read-only view of every club’s patients moving through the pipeline.'
        }
      >
        {moveError && (
          <div className="mb-5">
            <ErrorState title="Couldn't move this patient" body={moveError} />
          </div>
        )}

        {query.data.items.length === 0 ? (
          <EmptyState title="No patients yet" body="Screened patients will appear here as clubs log them." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" role="group" aria-label="Surgery pipeline board">
            {DRISHTI_STAGES.map((stage) => (
              <div key={stage} data-state={stage} className="flex flex-col gap-2.5">
                <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-fg-3">
                  {STAGE_LABEL[stage]} · {byStage[stage].length}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {byStage[stage].length === 0 ? (
                    <li className="rounded-[12px] border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-fg-3">
                      None
                    </li>
                  ) : (
                    byStage[stage].map((b) => (
                      <BeneficiaryCard
                        key={b.id}
                        beneficiary={b}
                        canManage={canManage}
                        onMove={onMove}
                        moving={movingId === b.id && moveMutation.isPending}
                      />
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <SurgeryMoveModal beneficiary={operatedTarget} onClose={() => setOperatedTarget(null)} />
    </Container>
  );
}
