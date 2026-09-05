import { useState } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { KeyValue } from '@/components/ui/KeyValue';
import { fetchReport, fetchReportSchemaVersion, addReportQuery, replyReportQuery, fetchReportAssist } from '@/lib/reports/api';
import type { Report, ReportStatus } from '@/lib/reports/types';
import { formatMonthLabel } from '@/lib/reports/month';
import { activitiesOf, formatFieldValue, splitFields } from '@/lib/reports/values';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  draft: 'neutral',
  submitted: 'blue',
  queried: 'amber',
  scored: 'green',
};

function AssistPanel({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ['reports', reportId, 'assist'], queryFn: () => fetchReportAssist(reportId), enabled: open });

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Get AI suggestions
      </Button>
    );
  }

  return (
    <Card eyebrow="ASSIST" title="Suggestions before you score this month">
      {query.isPending ? (
        <Skeleton shape="text" lines={3} />
      ) : query.isError ? (
        <p className="m-0 text-danger-fg">Couldn't load suggestions.</p>
      ) : !query.data.summary ? (
        <p className="m-0">No suggestions available. The assist service isn't configured on the server yet.</p>
      ) : (
        <>
          <p className="m-0 mb-3 whitespace-pre-wrap">{query.data.summary}</p>
          {query.data.suggestions.length > 0 && (
            <ul className="m-0 list-disc pl-5">
              {query.data.suggestions.map((s, i) => (
                <li key={i}>{s.message}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

function QueryThread({ reportId, queries, canReply, canAsk }: {
  reportId: string;
  queries: Report['queries'];
  canReply: boolean;
  canAsk: boolean;
}) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');

  const askMutation = useMutation({
    mutationFn: () => addReportQuery(reportId, question),
    onSuccess: () => {
      setQuestion('');
      void qc.invalidateQueries({ queryKey: ['reports', reportId] });
    },
  });
  const replyMutation = useMutation({
    mutationFn: (queryId: string) => replyReportQuery(reportId, queryId, reply),
    onSuccess: () => {
      setReply('');
      void qc.invalidateQueries({ queryKey: ['reports', reportId] });
    },
  });

  const list = queries ?? [];
  const openQuery = list.find((q) => !q.reply);

  return (
    <Card eyebrow="SECRETARIAT THREAD" title="Questions and replies">
      {list.length === 0 ? (
        <p className="m-0">No questions have been asked about this report.</p>
      ) : (
        <ul className="m-0 mb-4 flex list-none flex-col gap-3 p-0">
          {list.map((q) => (
            <li key={q.id} className="rounded-[10px] bg-page p-3.5">
              <p className="m-0 text-[12.5px] font-semibold text-fg">{q.question}</p>
              {q.reply ? (
                <p className="m-0 mt-2 text-[12.5px] text-fg-2">Reply: {q.reply}</p>
              ) : (
                <p className="m-0 mt-2 text-[11.5px] font-bold text-danger-fg">Awaiting a reply</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canReply && openQuery && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-fg">Reply to the secretariat</span>
            <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
          </label>
          <Button
            size="sm"
            className="self-start"
            disabled={!reply.trim()}
            loading={replyMutation.isPending}
            onClick={() => replyMutation.mutate(openQuery.id)}
          >
            Send reply and resubmit
          </Button>
        </div>
      )}

      {canAsk && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-fg">Ask the club a question</span>
            <Textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
          </label>
          <Button
            size="sm"
            className="self-start"
            disabled={!question.trim()}
            loading={askMutation.isPending}
            onClick={() => askMutation.mutate()}
          >
            Send query
          </Button>
        </div>
      )}
    </Card>
  );
}

export function ReportDetailPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  useDocumentMeta({ title: 'Report detail' });

  const reportQuery = useQuery({ queryKey: ['reports', id], queryFn: () => fetchReport(id, ['queries', 'club']) });
  const schemaVersion = reportQuery.data?.schemaVersion;
  const schemaQuery = useQuery({
    queryKey: ['report-schema', schemaVersion],
    queryFn: () => fetchReportSchemaVersion(schemaVersion!, true),
    enabled: schemaVersion !== undefined,
  });

  if (reportQuery.isPending || schemaQuery.isPending) {
    return (
      <Container>
        <Section title="Report">
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
  const { topFields, activityFields } = splitFields(schemaQuery.data.fields);
  const activities = activitiesOf(report.values);

  return (
    <Container>
      <Section
        eyebrow={report.club?.name ?? monthLabel}
        title={`${monthLabel} report`}
        description={report.status === 'queried' ? 'This month was sent back with a query. Reply below to resubmit it.' : undefined}
        action={<Badge tone={STATUS_TONE[report.status]}>{report.status.toUpperCase()}</Badge>}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-6">
            {topFields.length > 0 && (
              <Card eyebrow="THIS MONTH AT THE CLUB">
                <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {topFields.map((field) => (
                    <div key={field.id}>
                      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg-3">{field.label}</dt>
                      <dd className="m-0 text-[13px] text-fg">{formatFieldValue(field, report.values[field.fieldKey])}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            <Card eyebrow={`ACTIVITIES · ${activities.length}`}>
              {activities.length === 0 ? (
                <p className="m-0">No activities were reported this month.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="rounded-[10px] border border-line p-4">
                      <dl className="m-0 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {activityFields.map((field) => (
                          <div key={field.id}>
                            <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-fg-3">{field.label}</dt>
                            <dd className="m-0 text-[13px] text-fg">{formatFieldValue(field, activity[field.fieldKey])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {report.notes && (
              <Card eyebrow="NOTES FOR THE DISTRICT">
                <p className="m-0 whitespace-pre-wrap">{report.notes}</p>
              </Card>
            )}

            <QueryThread
              reportId={report.id}
              queries={report.queries}
              canReply={can('reports:submit', { type: 'club', id: report.clubId })}
              canAsk={can('reports:review') && report.status === 'submitted'}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Card eyebrow="STATUS">
              <KeyValue
                items={[
                  { label: 'Submitted', value: report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '—' },
                  { label: 'Filed on time', value: report.filedOnTime === null ? '—' : report.filedOnTime ? 'Yes' : 'No' },
                  { label: 'Scored', value: report.scoredAt ? new Date(report.scoredAt).toLocaleDateString() : 'Not yet' },
                ]}
              />
            </Card>
            {can('reports:score', { type: 'club', id: report.clubId }) && <AssistPanel reportId={report.id} />}
          </div>
        </div>
      </Section>
    </Container>
  );
}
