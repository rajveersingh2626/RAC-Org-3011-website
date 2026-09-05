import { useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Table, type Column } from '@/components/ui/Table';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { fetchReports } from '@/lib/reports/api';
import type { Report, ReportStatus } from '@/lib/reports/types';
import { currentRyYear, formatMonthLabel } from '@/lib/reports/month';
import { activitiesOf } from '@/lib/reports/values';
import { OpenRequestsPanel } from './OpenRequestsPanel';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'blue',
  queried: 'amber',
  scored: 'green',
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'queried', label: 'Queried' },
  { value: 'scored', label: 'Scored' },
];

export function ReportHistoryPage() {
  const { me } = useAuth();
  const clubId = me?.profile?.clubId ?? me?.clubs[0]?.id ?? '';
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  useDocumentMeta({ title: "My club's reports" });

  const query = useQuery({
    queryKey: ['reports', 'history', clubId, status],
    queryFn: () =>
      fetchReports({
        clubId,
        ryYear: currentRyYear(),
        status: status ? (status as ReportStatus) : undefined,
        pageSize: 50,
      }),
    enabled: Boolean(clubId),
  });

  const columns: Column<Report>[] = [
    { key: 'month', header: 'Month', cell: (r) => formatMonthLabel(r.month.slice(0, 7)) },
    { key: 'activities', header: 'Activities', cell: (r) => activitiesOf(r.values).length },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status.toUpperCase()}</Badge> },
    {
      key: 'view',
      header: '',
      align: 'right',
      cell: (r) => (
        <Link to={`/portal/reports/${r.id}`} className="font-bold text-accent">
          View
        </Link>
      ),
    },
  ];

  return (
    <Container>
      <Section eyebrow="Own points only, as a trend" title="My club's reports">
        <div className="mb-5">
          <SegmentedControl
            label="Filter by status"
            options={FILTERS}
            value={status}
            onChange={(v) => setParams(v ? { status: v } : {})}
          />
        </div>

        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load your reports" onRetry={() => void query.refetch()} />
        ) : (
          <Table
            columns={columns}
            rows={query.data.items}
            rowKey={(r) => r.id}
            empty="No reports match this filter yet."
          />
        )}

        <div className="mt-8">{clubId && <OpenRequestsPanel clubId={clubId} />}</div>
      </Section>
    </Container>
  );
}
