import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DateInput } from '@/components/ui/DateInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Alert } from '@/components/ui/Alert';
import {
  createReportRequest,
  updateReportRequest,
  fetchReportRequest,
  type CreateReportRequestInput,
} from '@/lib/reports/api';
import { fetchPublicClubs, fetchZones } from '@/lib/clubs';
import { ApiError } from '@/lib/api';

type AudienceMode = 'all' | 'clubs' | 'zones';

export function NewRequestPage() {
  useDocumentMeta({ title: 'Ask clubs for something else' });
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const existing = useQuery({ queryKey: ['report-requests', editId], queryFn: () => fetchReportRequest(editId!), enabled: Boolean(editId) });
  const clubsQuery = useQuery({ queryKey: ['public-clubs'], queryFn: () => fetchPublicClubs() });
  const zonesQuery = useQuery({ queryKey: ['zones'], queryFn: fetchZones });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [mode, setMode] = useState<AudienceMode>('all');
  const [clubIds, setClubIds] = useState<string[]>([]);
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing.data) return;
    const r = existing.data;
    setTitle(r.title);
    setDescription(r.description ?? '');
    setDueAt(r.dueAt.slice(0, 10));
    setQuestions(r.questions.length > 0 ? r.questions : ['']);
    if (r.audience.all) setMode('all');
    else if (r.audience.zoneIds?.length) {
      setMode('zones');
      setZoneIds(r.audience.zoneIds);
    } else if (r.audience.clubIds?.length) {
      setMode('clubs');
      setClubIds(r.audience.clubIds);
    }
  }, [existing.data]);

  const mutation = useMutation({
    mutationFn: (input: CreateReportRequestInput) => (editId ? updateReportRequest(editId, input) : createReportRequest(input)),
    onSuccess: () => navigate('/portal/admin/requests'),
    onError: (e: unknown) => setError(e instanceof ApiError ? e.message : 'Could not save this request'),
  });

  const submit = () => {
    const trimmedQuestions = questions.map((q) => q.trim()).filter(Boolean);
    if (!title.trim() || !dueAt || trimmedQuestions.length === 0) {
      setError('Give the request a title, a due date, and at least one question.');
      return;
    }
    setError(null);
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      questions: trimmedQuestions,
      audience:
        mode === 'all' ? { all: true } : mode === 'clubs' ? { clubIds } : { zoneIds },
      dueAt: new Date(`${dueAt}T23:59:59.000Z`).toISOString(),
    });
  };

  return (
    <Container>
      <Section
        eyebrow="A one-off return, separate from the monthly report"
        title="Ask clubs for something else"
        description="Four questions, a deadline, and who has to answer."
      >
        {error && (
          <div className="mb-5">
            <Alert tone="error" title="Couldn't save">
              {error}
            </Alert>
          </div>
        )}
        <div className="flex max-w-[640px] flex-col gap-5">
          <Field label="What are you asking for?">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Due by">
              <DateInput value={dueAt} onChange={setDueAt} />
            </Field>
            <Field label="Who must answer">
              <SegmentedControl
                label="Audience"
                value={mode}
                onChange={(v) => setMode(v as AudienceMode)}
                options={[
                  { value: 'all', label: 'All clubs' },
                  { value: 'clubs', label: 'Some clubs' },
                  { value: 'zones', label: 'Some zones' },
                ]}
              />
            </Field>
          </div>
          {mode === 'clubs' && (
            <Field label="Clubs">
              <MultiSelect
                options={(clubsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                values={clubIds}
                onChange={setClubIds}
                placeholder="Search clubs"
              />
            </Field>
          )}
          {mode === 'zones' && (
            <Field label="Zones">
              <MultiSelect
                options={(zonesQuery.data ?? []).map((z) => ({ value: z.id, label: z.name }))}
                values={zoneIds}
                onChange={setZoneIds}
                placeholder="Search zones"
              />
            </Field>
          )}

          <div>
            <p className="m-0 mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent">Questions</p>
            <div className="flex flex-col gap-2.5">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label={`Question ${i + 1}`}
                    value={q}
                    onChange={(e) => setQuestions((qs) => qs.map((x, idx) => (idx === i ? e.target.value : x)))}
                  />
                  <IconButton
                    label={`Remove question ${i + 1}`}
                    onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                    disabled={questions.length === 1}
                  >
                    <Trash2 aria-hidden />
                  </IconButton>
                </div>
              ))}
            </div>
            <Button variant="link" size="sm" className="mt-2.5" onClick={() => setQuestions((qs) => [...qs, ''])}>
              + Add a question
            </Button>
          </div>

          <div className="flex gap-3 border-t border-line pt-5">
            <Button onClick={submit} loading={mutation.isPending}>
              {editId ? 'Save changes' : 'Send request'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/portal/admin/requests')}>
              Cancel
            </Button>
          </div>
        </div>
      </Section>
    </Container>
  );
}
