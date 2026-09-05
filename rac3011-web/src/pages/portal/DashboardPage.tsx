import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchReports } from '@/lib/reports/api';
import type { ReportStatus } from '@/lib/reports/types';
import { currentReportMonth, formatMonthLabel } from '@/lib/reports/month';
import { ClubPointsWidget } from './ClubPointsWidget';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'blue',
  queried: 'amber',
  scored: 'green',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  draft: 'In progress',
  submitted: 'Submitted',
  queried: 'Needs your reply',
  scored: 'Scored',
};

function ReportStatusWidget({ clubId }: { clubId: string }) {
  const navigate = useNavigate();
  const month = currentReportMonth();
  const monthLabel = formatMonthLabel(month);
  const query = useQuery({
    queryKey: ['reports', 'draft', clubId, month],
    queryFn: () => fetchReports({ clubId, month, pageSize: 1 }),
  });

  if (query.isPending) return <Skeleton shape="rect" className="h-40" />;
  if (query.isError) return null;

  const report = query.data.items[0];

  if (!report) {
    return (
      <Card tone="action" eyebrow={`Due for ${monthLabel}`} title={`${monthLabel} report isn't in yet`}>
        <p className="mb-4">Add each activity from the month. Most presidents finish in under five minutes.</p>
        <Button onClick={() => navigate('/portal/reports/new')}>Start the report</Button>
      </Card>
    );
  }

  const nextHref =
    report.status === 'draft' ? `/portal/reports/${report.id}/review` : `/portal/reports/${report.id}`;

  return (
    <Card eyebrow={monthLabel} title="This month's report">
      <div className="mb-4 flex items-center gap-3">
        <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
      </div>
      <Button variant="secondary" onClick={() => navigate(nextHref)}>
        {report.status === 'draft' ? 'Continue the report' : 'View the report'}
      </Button>
    </Card>
  );
}

export function DashboardPage() {
  useDocumentMeta({ title: 'Dashboard' });
  const { me, can } = useAuth();
  const clubId = me?.profile?.clubId ?? me?.clubs[0]?.id ?? null;
  const canReport = Boolean(clubId) && can('reports:submit', { type: 'club', id: clubId ?? undefined });
  const canViewPoints = Boolean(clubId) && can('clubs:view', { type: 'club', id: clubId ?? undefined });

  return (
    <Container>
      <Section eyebrow="Overview" title={`Welcome, ${me?.user.name ?? ''}`}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {canReport && clubId ? (
            <ReportStatusWidget clubId={clubId} />
          ) : !canViewPoints ? (
            <EmptyState
              title="No monthly report for this account"
              body="Reporting applies to club presidents and secretaries."
            />
          ) : null}
          {canViewPoints && clubId && <ClubPointsWidget clubId={clubId} />}
        </div>
      </Section>
    </Container>
  );
}
