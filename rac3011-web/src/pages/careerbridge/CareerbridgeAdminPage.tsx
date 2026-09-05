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
import { fetchAdminListings, fetchStats, reviewListing } from '@/lib/careerbridge/api';
import type { AdminListing } from '@/lib/careerbridge/types';
import { ApiError } from '@/lib/api';

const QUEUE_KEY = ['careerbridge', 'admin', 'pending'];
const STATS_KEY = ['careerbridge', 'admin', 'stats'];

function ListingReviewCard({ listing }: { listing: AdminListing }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QUEUE_KEY });
    void qc.invalidateQueries({ queryKey: STATS_KEY });
  };

  const verifyMutation = useMutation({
    mutationFn: () => reviewListing(listing.id, { status: 'verified' }),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not verify this listing.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => reviewListing(listing.id, { status: 'rejected', rejectionReason: reason.trim() }),
    onSuccess: () => {
      setRejecting(false);
      invalidate();
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not reject this listing.'),
  });

  return (
    <div className="rounded-[14px] border border-line-accent p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="pink">{listing.company}</Badge>
        <span className="text-[11.5px] text-fg-3">{listing.location} · {listing.mode}</span>
      </div>
      <p className="m-0 mb-1 text-[15.5px] font-extrabold text-fg">{listing.title}</p>
      <p className="m-0 mb-3 text-[12px] text-fg-3">
        Posted by {listing.postedByName} ({listing.postedByEmail})
      </p>

      {error && (
        <div className="mb-3">
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        </div>
      )}

      <p className="mb-4 whitespace-pre-line text-[13px] text-fg-2">{listing.description}</p>

      <div className="flex gap-2">
        <Button onClick={() => verifyMutation.mutate()} loading={verifyMutation.isPending}>
          Verify
        </Button>
        <Button variant="secondary" onClick={() => setRejecting(true)}>
          Reject
        </Button>
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject this listing"
        footer={
          <Button disabled={!reason.trim()} loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
            Reject with this reason
          </Button>
        }
      >
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Why doesn't this listing meet the posting guidelines?"
          aria-label="Reason"
        />
      </Modal>
    </div>
  );
}

function ManageRow({ listing }: { listing: AdminListing }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['careerbridge', 'admin', 'all'] });
    void qc.invalidateQueries({ queryKey: STATS_KEY });
  };

  const fillMutation = useMutation({
    mutationFn: () => reviewListing(listing.id, { status: 'filled' }),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not update this listing.'),
  });
  const expireMutation = useMutation({
    mutationFn: () => reviewListing(listing.id, { status: 'expired' }),
    onSuccess: invalidate,
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not update this listing.'),
  });

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-accent py-3 last:border-b-0">
      <div>
        <p className="m-0 text-[13.5px] font-bold text-fg">{listing.title}</p>
        <p className="m-0 text-[11.5px] text-fg-3">{listing.company}</p>
        {error ? <p className="m-0 mt-1 text-[11.5px] text-danger-fg">{error}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={listing.status === 'filled' ? 'neutral' : 'green'}>{listing.status}</Badge>
        {listing.status === 'verified' ? (
          <Button size="sm" variant="secondary" onClick={() => fillMutation.mutate()} loading={fillMutation.isPending}>
            Mark filled
          </Button>
        ) : null}
        {listing.status === 'verified' || listing.status === 'filled' ? (
          <Button size="sm" variant="ghost" onClick={() => expireMutation.mutate()} loading={expireMutation.isPending}>
            Expire now
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function CareerbridgeAdminPage() {
  useDocumentMeta({ title: 'Career Bridge admin' });

  const statsQuery = useQuery({ queryKey: STATS_KEY, queryFn: () => fetchStats() });
  const pendingQuery = useQuery({ queryKey: QUEUE_KEY, queryFn: () => fetchAdminListings({ status: 'pending' }) });
  const liveQuery = useQuery({
    queryKey: ['careerbridge', 'admin', 'all'],
    queryFn: () => fetchAdminListings({}),
  });

  const live = (liveQuery.data?.items ?? []).filter((l) => l.status === 'verified' || l.status === 'filled');

  return (
    <Container width="wide">
      <Section
        eyebrow="Verification desk"
        title={pendingQuery.data ? `${pendingQuery.data.total} listing(s) waiting on a decision` : 'Career Bridge admin'}
        description="Verifying a listing makes it public immediately. Rejecting one requires a reason the poster can act on."
      >
        {statsQuery.data ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[12px] border border-line-accent p-3">
              <p className="m-0 text-[11px] text-fg-3">Posted</p>
              <p className="m-0 text-[18px] font-extrabold text-fg">{statsQuery.data.totalPosted}</p>
            </div>
            <div className="rounded-[12px] border border-line-accent p-3">
              <p className="m-0 text-[11px] text-fg-3">Verified & open</p>
              <p className="m-0 text-[18px] font-extrabold text-fg">{statsQuery.data.verified}</p>
            </div>
            <div className="rounded-[12px] border border-line-accent p-3">
              <p className="m-0 text-[11px] text-fg-3">Filled</p>
              <p className="m-0 text-[18px] font-extrabold text-fg">{statsQuery.data.filled}</p>
            </div>
            <div className="rounded-[12px] border border-line-accent p-3">
              <p className="m-0 text-[11px] text-fg-3">Pending</p>
              <p className="m-0 text-[18px] font-extrabold text-fg">{statsQuery.data.pending}</p>
            </div>
          </div>
        ) : null}

        {pendingQuery.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : pendingQuery.isError ? (
          <ErrorState title="Couldn't load the review queue" onRetry={() => void pendingQuery.refetch()} />
        ) : pendingQuery.data.items.length === 0 ? (
          <EmptyState title="Nothing waiting" body="No listings are currently awaiting review." />
        ) : (
          <div className="flex flex-col gap-3.5">
            {pendingQuery.data.items.map((listing) => (
              <ListingReviewCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="Live listings" title="Verified & filled" description="Mark a listing filled, or expire it ahead of its automatic expiry date.">
        {liveQuery.isPending ? (
          <Skeleton shape="rect" className="h-40" />
        ) : liveQuery.isError ? (
          <ErrorState title="Couldn't load listings" onRetry={() => void liveQuery.refetch()} />
        ) : live.length === 0 ? (
          <EmptyState title="No live listings yet" body="Verified listings will appear here." />
        ) : (
          <div>
            {live.map((listing) => (
              <ManageRow key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </Section>
    </Container>
  );
}
