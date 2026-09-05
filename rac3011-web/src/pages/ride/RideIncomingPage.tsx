import { useQuery } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchRideIncoming, type PublicDelegation } from '@/lib/publicApi/ride';

const STATUS_TONE: Record<PublicDelegation['status'], BadgeTone> = {
  planned: 'neutral',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const STATUS_LABEL: Record<PublicDelegation['status'], string> = {
  planned: 'Planned',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RideIncomingPage() {
  useDocumentMeta({
    title: 'RIDE — Incoming delegations',
    description: 'Visiting Rotaractors from other districts and countries, and the district clubs hosting them.',
  });

  const query = useQuery({ queryKey: ['public', 'ride', 'incoming'], queryFn: fetchRideIncoming });

  const columns: Column<PublicDelegation>[] = [
    {
      key: 'delegation',
      header: 'Delegation',
      cell: (d) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">
            {d.country} · {d.visitingDistrict}
          </p>
          <p className="m-0 text-[11px] text-fg-3">
            {formatDate(d.startsAt)} – {formatDate(d.endsAt)} · {d.headcount} delegate{d.headcount === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'hosts',
      header: 'Host club(s)',
      cell: (d) =>
        d.hosts.length === 0 ? (
          <span className="text-[12px] text-fg-3">Not yet assigned</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {d.hosts.map((h) => (
              <Badge key={h.id} tone="pink">
                {h.shortName ?? h.name}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>,
    },
  ];

  return (
    <Container width="wide">
      <Section
        eyebrow="RIDE"
        title="Incoming delegations"
        description="Rotaractors visiting District 3011 from other districts and countries, and the clubs stepping up to host them."
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load incoming delegations" onRetry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState title="No incoming delegations yet" body="Confirmed and planned visits will show up here." />
        ) : (
          <Table columns={columns} rows={query.data} rowKey={(d) => d.id} empty="No delegations yet." />
        )}
      </Section>
    </Container>
  );
}
