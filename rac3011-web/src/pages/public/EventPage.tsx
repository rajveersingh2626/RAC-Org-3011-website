import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { format } from 'date-fns';
import { useDocumentMeta } from '@/lib/meta';
import { fetchEvent } from '@/lib/publicApi/events';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/app/auth';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ImageSlot } from '@/components/ui/ImageSlot';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function EventPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['public', 'events', slug], queryFn: () => fetchEvent(slug) });
  const { status } = useAuth();
  const [rsvpState, setRsvpState] = useState<{ tone: 'action' | 'error'; message: string } | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  useDocumentMeta({ title: data ? data.title : 'Event' });

  const rsvp = async () => {
    if (!data) return;
    setRsvpSubmitting(true);
    setRsvpState(null);
    try {
      await apiFetch(`/events/${data.id}/rsvp`, { method: 'PUT', body: { status: 'going' } });
      setRsvpState({ tone: 'action', message: "You're on the list." });
    } catch (e) {
      setRsvpState({
        tone: 'error',
        message: e instanceof ApiError && e.status === 404 ? 'RSVP isn\'t open for this event yet.' : 'Couldn\'t save your RSVP. Try again later.',
      });
    } finally {
      setRsvpSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton shape="rect" className="h-72" />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="py-10">
        <ErrorState title="This event couldn't be found" onRetry={() => void refetch()} />
      </Container>
    );
  }

  const isPast = new Date(data.endsAt ?? data.startsAt).getTime() < Date.now();

  return (
    <Container className="py-8" width="narrow">
      <Breadcrumbs items={[{ label: 'Calendar', href: '/calendar' }, { label: data.title }]} linkComponent={Link} />
      <ImageSlot src={data.coverUrl} alt={data.title} className="mt-4" prompt="Event photo coming soon" />
      <h1 className="m-0 mt-4 text-[24px] font-extrabold text-fg">{data.title}</h1>
      <p className="mt-1 text-[13px] font-bold text-accent">{format(new Date(data.startsAt), 'EEEE d MMMM yyyy · h:mm a')}</p>
      {data.location ? <p className="mt-1 text-[13px] text-fg-2">{data.location}</p> : null}
      {data.description ? <p className="mt-4 text-[13.5px] leading-relaxed text-fg-2">{data.description}</p> : null}
      {data.capacity ? <Badge tone="neutral" className="mt-2">Capacity {data.capacity}</Badge> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isPast ? (
          <Link to="/portal/feedback" className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent hover:bg-accent-soft">
            Share feedback
          </Link>
        ) : data.rsvpOpen ? (
          status === 'authenticated' ? (
            <Button onClick={() => void rsvp()} loading={rsvpSubmitting}>
              RSVP
            </Button>
          ) : (
            <Link
              to={`/portal/login?next=${encodeURIComponent(`/calendar/${slug}`)}`}
              className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-accent px-5 text-[13.5px] font-bold text-accent hover:bg-accent-soft"
            >
              Sign in to RSVP
            </Link>
          )
        ) : (
          <Badge tone="neutral">RSVP closed</Badge>
        )}
      </div>

      {rsvpState ? (
        <div className="mt-4">
          <Alert tone={rsvpState.tone} title={rsvpState.message} />
        </div>
      ) : null}
    </Container>
  );
}
