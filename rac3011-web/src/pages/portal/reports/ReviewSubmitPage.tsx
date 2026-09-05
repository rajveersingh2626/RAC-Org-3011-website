import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stat } from '@/components/ui/Stat';
import { fetchReport, fetchReportSchemaVersion, updateReport } from '@/lib/reports/api';
import { formatMonthLabel } from '@/lib/reports/month';
import { activitiesOf, activitySummaryDetail, activitySummaryLabel, splitFields } from '@/lib/reports/values';
import { ApiError } from '@/lib/api';

export function ReviewSubmitPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  useDocumentMeta({ title: 'Review and submit' });

  const reportQuery = useQuery({ queryKey: ['reports', id], queryFn: () => fetchReport(id, []) });
  const schemaVersion = reportQuery.data?.schemaVersion;
  const schemaQuery = useQuery({
    queryKey: ['report-schema', schemaVersion],
    queryFn: () => fetchReportSchemaVersion(schemaVersion!, true),
    enabled: schemaVersion !== undefined,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => updateReport(id, { status: 'submitted' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reports'] });
      navigate(`/portal/reports/${id}`);
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        const detail = e.details?.map((d) => d.message).join(' ');
        setSubmitError(detail || e.message);
      } else {
        setSubmitError('Something went wrong. Try again.');
      }
    },
  });

  if (reportQuery.isPending || schemaQuery.isPending) {
    return (
      <Container>
        <Section title="Review and submit">
          <Skeleton shape="rect" className="h-80" />
        </Section>
      </Container>
    );
  }

  if (reportQuery.isError || !schemaQuery.data) {
    return (
      <Container>
        <ErrorState title="Couldn't load this report" onRetry={() => void reportQuery.refetch()} />
      </Container>
    );
  }

  const report = reportQuery.data;
  const monthLabel = formatMonthLabel(report.month.slice(0, 7));
  const { topFields } = splitFields(schemaQuery.data.fields);
  const activities = activitiesOf(report.values);
  const alreadySubmitted = report.status !== 'draft' && report.status !== 'queried';
  const reachedField = topFields.find((f) => f.fieldKey === 'people_reached');
  const totalReached = activities.reduce((sum, a) => {
    const v = a.people_reached;
    return sum + (typeof v === 'number' ? v : 0);
  }, 0);
  const withPhoto = activities.filter((a) => {
    const links = a.photo_links;
    return Array.isArray(links) ? links.length > 0 : Boolean(links);
  }).length;

  return (
    <Container>
      <Section
        eyebrow={`Monthly report · ${monthLabel}`}
        title={activities.length > 0 ? `${activities.length} activities, ready to send` : 'A nil month, ready to send'}
        description="Check the dates and the numbers. After you submit, the secretariat can still send it back with a query, but you can't edit it directly."
      >
        {submitError && (
          <div className="mb-5">
            <Alert tone="error" title="Couldn't submit">
              {submitError}
            </Alert>
          </div>
        )}
        {alreadySubmitted && (
          <div className="mb-5">
            <Alert tone="info" title="This report has already been submitted">
              View it on the report detail page.
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            {activities.length === 0 ? (
              <Card tone="dashed" title="No activities this month">
                Submitting with no activities files a valid nil return for {monthLabel}.
              </Card>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 rounded-[12px] border border-line-accent p-4">
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[14.5px] font-extrabold text-fg">{activitySummaryLabel(activity)}</p>
                    <p className="m-0 text-[12px] text-fg-3">{activitySummaryDetail(activity) || 'No detail added'}</p>
                  </div>
                  <Button variant="link" size="sm" onClick={() => navigate('/portal/reports/new')}>
                    Edit
                  </Button>
                </div>
              ))
            )}

            <div className="grid grid-cols-2 gap-5 rounded-[12px] bg-page p-5 sm:grid-cols-3">
              <Stat label="Activities" value={activities.length} />
              {reachedField && <Stat label="People reached" value={totalReached} />}
              <Stat label="Have a photo" value={`${withPhoto} of ${activities.length || 0}`} />
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
              <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending} disabled={alreadySubmitted}>
                Submit {monthLabel}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/portal/reports/new')}>
                Add another activity
              </Button>
            </div>
          </div>

          <Card title="The nil month" tone="plain">
            If the club genuinely did nothing this month, submitting with zero activities is the whole report — a single
            sentence in the compliance record, not a missing one.
          </Card>
        </div>
      </Section>
    </Container>
  );
}
