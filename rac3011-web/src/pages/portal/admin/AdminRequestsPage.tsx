import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchReportRequests, deleteReportRequest } from '@/lib/reports/api';
import type { ReportRequest } from '@/lib/reports/types';

function audienceLabel(request: ReportRequest): string {
  if (request.audience.all) return 'All clubs';
  const clubs = request.audience.clubIds?.length ?? 0;
  const zones = request.audience.zoneIds?.length ?? 0;
  const parts: string[] = [];
  if (clubs) parts.push(`${clubs} club(s)`);
  if (zones) parts.push(`${zones} zone(s)`);
  return parts.join(', ') || 'Nobody yet';
}

export function AdminRequestsPage() {
  useDocumentMeta({ title: 'Ask clubs for something else' });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['report-requests'], queryFn: fetchReportRequests });

  const deleteMutation = useMutation({
    mutationFn: deleteReportRequest,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['report-requests'] }),
  });

  const columns: Column<ReportRequest>[] = [
    { key: 'title', header: 'Request', cell: (r) => <span className="font-bold text-fg">{r.title}</span> },
    { key: 'due', header: 'Due by', cell: (r) => new Date(r.dueAt).toLocaleDateString() },
    { key: 'audience', header: 'Who must answer', cell: (r) => audienceLabel(r) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-3">
          <Link to={`/portal/admin/requests/new?edit=${r.id}`} className="font-bold text-accent">
            Edit
          </Link>
          <button
            type="button"
            className="font-bold text-danger-fg"
            onClick={() => window.confirm(`Delete "${r.title}"?`) && deleteMutation.mutate(r.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <Section
        eyebrow="What replaces the standing Google Forms"
        title="Open requests"
        action={<Button onClick={() => navigate('/portal/admin/requests/new')}>New request</Button>}
      >
        {query.isPending ? (
          <Skeleton shape="rect" className="h-64" />
        ) : query.isError ? (
          <ErrorState title="Couldn't load requests" onRetry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          <EmptyState title="No open requests" body="Create one for a one-off return separate from the monthly report." />
        ) : (
          <Table columns={columns} rows={query.data} rowKey={(r) => r.id} empty="No requests yet" />
        )}
      </Section>
    </Container>
  );
}
