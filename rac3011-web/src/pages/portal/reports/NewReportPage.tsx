import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { fetchActiveReportSchema, fetchReports, createReport, updateReport } from '@/lib/reports/api';
import { fetchPublicClubs } from '@/lib/clubs';
import { currentReportMonth, formatMonthLabel } from '@/lib/reports/month';
import { emptyActivity, splitFields } from '@/lib/reports/values';
import { ApiError } from '@/lib/api';
import { ActivityForm } from './ActivityForm';
import { ActivityList } from './ActivityList';
import { ReportFieldControl } from './ReportFieldControl';
import { useAutosave, type AutosaveStatus } from './useAutosave';

async function ensureDraftReport(clubId: string, month: string) {
  const existing = await fetchReports({ clubId, month, pageSize: 1 });
  if (existing.items[0]) return existing.items[0];
  try {
    return await createReport({ clubId, month });
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      const retry = await fetchReports({ clubId, month, pageSize: 1 });
      if (retry.items[0]) return retry.items[0];
    }
    throw e;
  }
}

function statusMessage(status: AutosaveStatus): string {
  switch (status) {
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved as you type';
    case 'error':
      return 'Could not save — check your connection';
    case 'pending':
      return 'Unsaved changes';
    default:
      return 'Nothing to save yet';
  }
}

export function NewReportPage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clubId = me?.profile?.clubId ?? me?.clubs[0]?.id ?? '';
  const month = useMemo(() => currentReportMonth(), []);
  const monthLabel = formatMonthLabel(month);
  useDocumentMeta({ title: `Monthly report · ${monthLabel}` });

  const schemaQuery = useQuery({ queryKey: ['report-schema', 'active'], queryFn: fetchActiveReportSchema });
  const reportQuery = useQuery({
    queryKey: ['reports', 'draft', clubId, month],
    queryFn: () => ensureDraftReport(clubId, month),
    enabled: Boolean(clubId),
  });
  const clubsQuery = useQuery({ queryKey: ['public-clubs'], queryFn: () => fetchPublicClubs() });

  const [values, setValues] = useState<Record<string, unknown>>({ activities: [] });
  const [notes, setNotes] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (reportQuery.data) {
      setValues((reportQuery.data.values as Record<string, unknown>) ?? { activities: [] });
      setNotes(reportQuery.data.notes ?? '');
    }
  }, [reportQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: { values: Record<string, unknown>; notes: string }) => {
      if (!reportQuery.data) return Promise.resolve(null);
      return updateReport(reportQuery.data.id, { values: payload.values, notes: payload.notes });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'draft', clubId, month] }),
  });

  const autosavePayload = useMemo(() => ({ values, notes }), [values, notes]);
  const autosave = useAutosave(autosavePayload, (p) => saveMutation.mutateAsync(p), Boolean(reportQuery.data));

  if (!clubId) {
    return (
      <Container>
        <ErrorState title="No club on your profile" body="Your account isn't linked to a club yet, so a report can't be filed." />
      </Container>
    );
  }

  if (schemaQuery.isPending || reportQuery.isPending || clubsQuery.isPending) {
    return (
      <Container>
        <Section title="Monthly report">
          <Skeleton shape="rect" className="h-96" />
        </Section>
      </Container>
    );
  }

  if (schemaQuery.isError || reportQuery.isError) {
    return (
      <Container>
        <ErrorState
          title="Couldn't load the report"
          body={(schemaQuery.error ?? reportQuery.error) instanceof Error ? (schemaQuery.error ?? reportQuery.error)?.message : undefined}
          onRetry={() => { void schemaQuery.refetch(); void reportQuery.refetch(); }}
        />
      </Container>
    );
  }

  const report = reportQuery.data!;
  const schema = schemaQuery.data!;
  const { topFields, activityFields } = splitFields(schema.fields);
  const activities = Array.isArray(values.activities) ? (values.activities as Record<string, unknown>[]) : [];
  const clubOptions = (clubsQuery.data ?? []).filter((c) => c.id !== clubId).map((c) => ({ value: c.id, label: c.name }));

  const setTopField = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));

  const saveActivity = (activity: Record<string, unknown>) => {
    setValues((v) => {
      const next = [...activities];
      if (editingIndex !== null) next[editingIndex] = activity;
      else next.push(activity);
      return { ...v, activities: next };
    });
    setEditingIndex(null);
  };

  const removeActivity = (index: number) => {
    setValues((v) => ({ ...v, activities: activities.filter((_, i) => i !== index) }));
    if (editingIndex === index) setEditingIndex(null);
  };

  const draftActivity = editingIndex !== null ? activities[editingIndex] : emptyActivity(activityFields);

  return (
    <Container>
      <Section
        eyebrow={`Monthly report · ${monthLabel}`}
        title="Everything the club did this month"
        description="Add each activity as you remember it. You submit the month once, at the end."
        action={
          <Button variant="secondary" onClick={() => navigate(`/portal/reports/${report.id}/review`)}>
            Review and submit →
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            {topFields.length > 0 && (
              <div className="rounded-[16px] border border-line-accent bg-surface p-5">
                <p className="m-0 mb-4 text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent">This month at the club</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {topFields.map((field) => (
                    <ReportFieldControl
                      key={field.id}
                      field={field}
                      value={values[field.fieldKey]}
                      onChange={(v) => setTopField(field.fieldKey, v)}
                      onBlur={autosave.flush}
                      clubOptions={clubOptions}
                    />
                  ))}
                </div>
              </div>
            )}

            <ActivityForm
              key={editingIndex ?? 'new'}
              fields={activityFields}
              activity={draftActivity}
              index={editingIndex ?? activities.length}
              clubOptions={clubOptions}
              onSave={saveActivity}
              onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
            />

            <Field label="Notes for the district" hint="Anything you'd like the secretariat to know while reviewing this month.">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={autosave.flush} maxLength={5000} rows={4} />
            </Field>

            <p
              role="status"
              className={autosave.status === 'error' ? 'm-0 text-[12px] font-semibold text-danger-fg' : 'm-0 text-[12px] text-fg-3'}
            >
              {statusMessage(autosave.status)}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ActivityList activities={activities} monthLabel={monthLabel} onEdit={setEditingIndex} onRemove={removeActivity} />
          </div>
        </div>
      </Section>
    </Container>
  );
}
