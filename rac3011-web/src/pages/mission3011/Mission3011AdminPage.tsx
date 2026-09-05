import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { reviewCamp, fetchCamps } from '@/lib/mission3011/api';
import type { Camp } from '@/lib/mission3011/types';
import { ApiError } from '@/lib/api';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const QUEUE_KEY = ['mission3011', 'admin', 'queue'];

function CampReviewCard({ camp }: { camp: Camp }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: QUEUE_KEY });

  const approveMutation = useMutation({
    mutationFn: () => reviewCamp(camp.id, { status: 'approved' }),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not approve this camp.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => reviewCamp(camp.id, { status: 'rejected', rejectionReason: reason.trim() }),
    onSuccess: () => {
      setRejecting(false);
      invalidate();
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not hold this camp.'),
  });

  return (
    <div className="rounded-[14px] border border-line-accent p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="pink">{camp.leadClub.name}</Badge>
        <span className="text-[11.5px] text-fg-3">{formatDate(camp.date)}</span>
      </div>
      <p className="m-0 mb-1 text-[15.5px] font-extrabold text-fg">{camp.venue}</p>
      {camp.city ? <p className="m-0 mb-3 text-[12px] text-fg-3">{camp.city}</p> : null}

      {error && (
        <div className="mb-3">
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
        <div>
          <p className="m-0 text-fg-3">Units collected</p>
          <p className="m-0 font-bold text-fg">{camp.unitsCollected.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="m-0 text-fg-3">Donors registered</p>
          <p className="m-0 font-bold text-fg">{camp.donorsRegistered ?? '—'}</p>
        </div>
        <div>
          <p className="m-0 text-fg-3">Partner blood bank</p>
          <p className="m-0 font-bold text-fg">{camp.partnerBloodBank ?? '—'}</p>
        </div>
        <div>
          <p className="m-0 text-fg-3">Participating clubs</p>
          <p className="m-0 font-bold text-fg">{camp.participatingClubs.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>
          Approve
        </Button>
        <Button variant="secondary" onClick={() => setRejecting(true)}>
          Hold
        </Button>
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Hold this camp back"
        footer={
          <Button disabled={!reason.trim()} loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
            Hold with this reason
          </Button>
        }
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="What does the club need to fix before this can be approved?"
          aria-label="Reason"
        />
      </Modal>
    </div>
  );
}

export function Mission3011AdminPage() {
  useDocumentMeta({ title: 'Mission 3011 admin' });
  const query = useQuery({ queryKey: QUEUE_KEY, queryFn: () => fetchCamps({ status: 'submitted', pageSize: 100 }) });

  return (
    <Container width="wide">
      <Section
        eyebrow="Approvals desk"
        title={query.data ? `${query.data.total} camp(s) waiting on a decision` : 'Mission 3011 admin'}
        description="Approving a camp adds its units to the district total immediately. Holding one requires a reason the club can act on."
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load the approvals queue" onRetry={() => void query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState title="Nothing waiting" body="No camps are currently awaiting review." />
        ) : (
          <div className="flex flex-col gap-3.5">
            {query.data.items.map((camp) => (
              <CampReviewCard key={camp.id} camp={camp} />
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
