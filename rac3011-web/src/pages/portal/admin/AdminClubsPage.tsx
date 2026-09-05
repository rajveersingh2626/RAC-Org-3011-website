import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Stat } from '@/components/ui/Stat';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { fetchReports, addReportQuery } from '@/lib/reports/api';
import type { Report, ReportStatus } from '@/lib/reports/types';
import { fetchPublicClubs, fetchZones } from '@/lib/clubs';
import { currentReportMonth, formatMonthLabel } from '@/lib/reports/month';
import { activitiesOf } from '@/lib/reports/values';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'blue',
  queried: 'amber',
  scored: 'green',
};

export function AdminClubsPage() {
  useDocumentMeta({ title: 'Clubs & reports' });
  const { me } = useAuth();
  const qc = useQueryClient();
  const zrrZoneId = me?.roles.find((r) => r.roleKey === 'zrr')?.scope.id ?? '';
  const [month] = useState(() => currentReportMonth());
  const [zoneId, setZoneId] = useState(zrrZoneId);
  const [queryingId, setQueryingId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: fetchZones });
  const clubsQuery = useQuery({ queryKey: ['public-clubs', zoneId], queryFn: () => fetchPublicClubs(zoneId || undefined) });
  const reportsQuery = useQuery({
    queryKey: ['reports', 'admin-overview', month],
    queryFn: () => fetchReports({ month, include: ['club'], pageSize: 200 }),
  });

  const askMutation = useMutation({
    mutationFn: (vars: { id: string; question: string }) => addReportQuery(vars.id, vars.question),
    onSuccess: () => {
      setQueryingId(null);
      setQuestion('');
      void qc.invalidateQueries({ queryKey: ['reports', 'admin-overview', month] });
    },
  });

  const filedByClub = useMemo(() => {
    const map = new Map<string, Report>();
    for (const r of reportsQuery.data?.items ?? []) map.set(r.clubId, r);
    return map;
  }, [reportsQuery.data]);

  const clubsInZone = (clubsQuery.data ?? []).filter((c) => !zoneId || c.zoneId === zoneId);
  const filedInZone = clubsInZone.filter((c) => filedByClub.has(c.id));
  const notFiled = clubsInZone.filter((c) => !filedByClub.has(c.id));
  const awaitingScore = filedInZone.filter((c) => filedByClub.get(c.id)?.status === 'submitted').length;
  const scored = filedInZone.filter((c) => filedByClub.get(c.id)?.status === 'scored').length;

  const columns: Column<Report>[] = [
    {
      key: 'club',
      header: 'Club',
      cell: (r) => (
        <div>
          <p className="m-0 text-[13px] font-bold text-fg">{r.club?.name ?? r.clubId}</p>
          <p className="m-0 text-[11px] text-fg-3">{r.submittedAt ? `Filed ${new Date(r.submittedAt).toLocaleDateString()}` : 'Draft'}</p>
        </div>
      ),
    },
    { key: 'activities', header: 'Activities', cell: (r) => activitiesOf(r.values).length },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status.toUpperCase()}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-3">
          <Link to={`/portal/reports/${r.id}`} className="font-bold text-accent">
            View
          </Link>
          {r.status === 'submitted' && (
            <button type="button" onClick={() => setQueryingId(r.id)} className="font-bold text-danger-fg">
              Query
            </button>
          )}
        </div>
      ),
    },
  ];

  if (reportsQuery.isError) {
    return (
      <Container>
        <ErrorState title="Couldn't load reports" onRetry={() => void reportsQuery.refetch()} />
      </Container>
    );
  }

  return (
    <Container width="wide">
      <Section
        eyebrow="A tightening of the compliance matrix"
        title="Review reports, assign points"
        description={formatMonthLabel(month)}
      >
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Awaiting a score" value={awaitingScore} />
          <Stat label="Filed this month" value={filedInZone.length} />
          <Stat label="Yet to file" value={notFiled.length} />
          <Stat label="Scored" value={scored} />
        </div>

        <div className="mb-5 max-w-[220px]">
          <Select
            aria-label="Filter by zone"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="All zones"
            options={(zonesQuery.data ?? []).map((z) => ({ value: z.id, label: z.name }))}
          />
        </div>

        {reportsQuery.isPending || clubsQuery.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : (
          <Table
            columns={columns}
            rows={filedInZone.map((c) => filedByClub.get(c.id)!).filter(Boolean)}
            rowKey={(r) => r.id}
            empty="No club in this zone has filed for this month yet."
          />
        )}

        {notFiled.length > 0 && (
          <p className="mt-5 text-[12px] text-fg-3">
            Not yet filed: {notFiled.map((c) => c.shortName ?? c.name).join(', ')}
          </p>
        )}
      </Section>

      <Modal
        open={Boolean(queryingId)}
        onClose={() => setQueryingId(null)}
        title="Ask a question about this report"
        footer={
          <Button
            disabled={!question.trim()}
            loading={askMutation.isPending}
            onClick={() => queryingId && askMutation.mutate({ id: queryingId, question })}
          >
            Send query
          </Button>
        }
      >
        <Textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Question" />
      </Modal>
    </Container>
  );
}
