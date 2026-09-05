import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { KeyValue } from '@/components/ui/KeyValue';
import { fetchClub } from '@/lib/clubs';
import { formatMonthLabel, ryYearOf } from '@/lib/reports/month';
import { fetchReports, addReportQuery } from '@/lib/reports/api';
import { fetchClubPoints, patchJudgedPoints } from '@/lib/points/api';
import type { ClubPointsEntry } from '@/lib/points/types';

const RULE_TYPE_LABEL: Record<string, string> = {
  flat: 'flat',
  per_unit: 'per_unit',
  tiered: 'tiered',
  penalty: 'penalty',
};

function describeTrace(entry: ClubPointsEntry): string {
  const trace = entry.trace as { inputs?: Record<string, number>; tierMatched?: { min: number; max: number | null } } | null;
  if (!trace?.inputs) return '';
  const { inputs } = trace;
  if (trace.tierMatched) {
    const { min, max } = trace.tierMatched;
    const bracket = max === null ? `${min}+` : `${min}–${max}`;
    if (inputs.numerator !== undefined) {
      const ratio = inputs.denominator ? Math.round((inputs.numerator / inputs.denominator) * 100) : 0;
      return `${ratio}% — the ${bracket} bracket`;
    }
    return `${inputs.value ?? ''} — the ${bracket} bracket`;
  }
  if (inputs.count !== undefined) return `${inputs.count} × unit(s)`;
  if (inputs.value !== undefined) return `value ${inputs.value}`;
  return '';
}

function RuleTraceRow({ entry }: { entry: ClubPointsEntry }) {
  const [open, setOpen] = useState(false);
  const trace = entry.trace as Record<string, unknown> | null;

  return (
    <div className="border-b border-line-accent py-3 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[13.5px] font-bold text-fg">{entry.ruleLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-fg-3">
            <Badge tone="neutral">{RULE_TYPE_LABEL[entry.ruleType ?? '']} · {entry.rulePeriod}</Badge>
            <span>{describeTrace(entry)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[15px] font-extrabold text-fg">{entry.points}</span>
          <button type="button" className="text-[11.5px] font-bold text-accent" onClick={() => setOpen((o) => !o)}>
            {open ? 'hide' : 'trace'}
          </button>
        </div>
      </div>
      {open && trace && (
        <div className="mt-3 rounded-[10px] border border-line-accent bg-input px-4 py-3">
          <KeyValue
            items={Object.entries(trace.inputs as Record<string, unknown>).map(([k, v]) => ({
              label: k,
              value: String(v),
            }))}
          />
          {Boolean(trace.tierMatched) && (
            <p className="m-0 mt-2 text-[11.5px] text-fg-3">
              Bracket: {JSON.stringify(trace.tierMatched)} → {entry.points} pts
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ScoreMonthPage() {
  const { clubId = '', month = '' } = useParams<{ clubId: string; month: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ryYear = useMemo(() => ryYearOf(new Date(`${month}-01T00:00:00Z`)), [month]);
  const monthLabel = formatMonthLabel(month);

  useDocumentMeta({ title: `Score ${monthLabel}` });

  const [judgedPoints, setJudgedPoints] = useState('');
  const [reason, setReason] = useState('');
  const [queryOpen, setQueryOpen] = useState(false);
  const [question, setQuestion] = useState('');

  const clubQuery = useQuery({ queryKey: ['club', clubId], queryFn: () => fetchClub(clubId), enabled: Boolean(clubId) });
  const pointsQuery = useQuery({
    queryKey: ['club-points', clubId, ryYear, month],
    queryFn: () => fetchClubPoints(clubId, { ryYear, month }),
    enabled: Boolean(clubId && month),
  });
  const reportQuery = useQuery({
    queryKey: ['reports', 'score-month', clubId, month],
    queryFn: () => fetchReports({ clubId, month, pageSize: 1 }),
    enabled: Boolean(clubId && month),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      patchJudgedPoints(clubId, month, {
        judgedPoints: judgedPoints.trim() === '' ? null : Number(judgedPoints),
        reason: reason.trim() || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['club-points', clubId, ryYear, month] });
      navigate('/portal/admin/clubs');
    },
  });

  const queryMutation = useMutation({
    mutationFn: (vars: { id: string; question: string }) => addReportQuery(vars.id, vars.question),
    onSuccess: () => {
      setQueryOpen(false);
      setQuestion('');
      void qc.invalidateQueries({ queryKey: ['reports', 'score-month', clubId, month] });
    },
  });

  if (pointsQuery.isPending || clubQuery.isPending) {
    return (
      <Container width="wide">
        <Skeleton shape="rect" className="h-96" />
      </Container>
    );
  }
  if (pointsQuery.isError || clubQuery.isError) {
    return (
      <Container width="wide">
        <ErrorState title="Couldn't load this club's score" onRetry={() => void pointsQuery.refetch()} />
      </Container>
    );
  }

  const summary = pointsQuery.data;
  const club = clubQuery.data;
  const report = reportQuery.data?.items[0];
  const computedByCategory = new Map<string, { name: string; points: number; entries: ClubPointsEntry[] }>();
  for (const entry of summary.entries) {
    const bucket = computedByCategory.get(entry.categoryId) ?? { name: entry.categoryName, points: 0, entries: [] };
    bucket.points += entry.points;
    bucket.entries.push(entry);
    computedByCategory.set(entry.categoryId, bucket);
  }
  const computedTotal = [...computedByCategory.values()].reduce((sum, c) => sum + c.points, 0);
  const judgedTotal = summary.judged?.points ?? 0;

  return (
    <Container width="wide">
      <Section
        eyebrow={club?.shortName ?? club?.name}
        title={`${club?.name ?? clubId} · ${monthLabel}`}
        description={`${computedTotal} points computed from the rules. One number is yours to set.`}
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[1px] text-accent">Computed — from the points document</p>
        <Card className="mb-6">
          {computedByCategory.size === 0 ? (
            <EmptyState title="Nothing computed yet for this month" body="No submitted report or club fact contributed points for this period." />
          ) : (
            <>
              {[...computedByCategory.values()].map((category) => (
                <div key={category.name} className="border-b border-line-accent pb-2 pt-2 first:pt-0 last:border-0">
                  <p className="m-0 mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-fg-3">{category.name}</p>
                  {category.entries.map((entry) => (
                    <RuleTraceRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-[12.5px] font-bold text-fg-3">Computed subtotal</span>
                <span className="text-[18px] font-extrabold text-fg">{computedTotal}</span>
              </div>
            </>
          )}
        </Card>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[1px] text-accent">Judged — the only field you type in</p>
        <Card className="mb-6">
          <p className="mb-4 text-[13px] text-fg-2">
            For anything the document has no category for — the quality of a collaboration, unusual effort. Leave it at zero unless
            you can say why in the note.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Points">
              <Input
                type="number"
                value={judgedPoints}
                onChange={(e) => setJudgedPoints(e.target.value)}
                placeholder={summary.judged ? String(summary.judged.points) : '0'}
              />
            </Field>
            <Field label="Why" hint="Goes in the audit log with your name">
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={summary.judged?.reason ?? 'Ran the camp jointly with two Rotary clubs...'}
              />
            </Field>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-line-accent bg-surface p-5">
          <div>
            <p className="m-0 text-[18px] font-extrabold text-fg">{computedTotal + judgedTotal} points for {monthLabel}</p>
            <p className="m-0 text-[12px] text-fg-3">
              {computedTotal} computed + {judgedTotal} judged
            </p>
          </div>
          <div className="flex gap-3">
            {report && (
              <Button variant="secondary" onClick={() => setQueryOpen(true)}>
                Query the club
              </Button>
            )}
            <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Save and open the next
            </Button>
          </div>
        </div>
      </Section>

      <Modal
        open={queryOpen}
        onClose={() => setQueryOpen(false)}
        title="Ask a question about this report"
        footer={
          <Button
            disabled={!question.trim()}
            loading={queryMutation.isPending}
            onClick={() => report && queryMutation.mutate({ id: report.id, question })}
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
