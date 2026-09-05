import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DateInput } from '@/components/ui/DateInput';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { FileUpload, type FileUploadValue } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Timeline } from '@/components/ui/Timeline';
import { fetchPublicClubs } from '@/lib/clubs';
import { createProject, updateProject } from '@/lib/showcase/api';
import { SHOWCASE_CATEGORIES } from '@/lib/showcase/types';
import { ApiError } from '@/lib/api';

const PHOTO_SLOTS = 4;

function urlOf(value: FileUploadValue | null): string | null {
  if (!value) return null;
  return value.kind === 'file' ? value.file.url : value.url;
}

export function SubmitShowcasePage() {
  useDocumentMeta({ title: 'Put a project on the showcase' });
  const navigate = useNavigate();
  const { me } = useAuth();
  const clubId = me?.profile?.clubId ?? me?.clubs[0]?.id ?? '';

  const clubsQuery = useQuery({ queryKey: ['public-clubs'], queryFn: () => fetchPublicClubs() });
  const clubOptions = (clubsQuery.data ?? [])
    .filter((c) => c.id !== clubId)
    .map((c) => ({ value: c.id, label: c.name }));

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [photos, setPhotos] = useState<(FileUploadValue | null)[]>(Array(PHOTO_SLOTS).fill(null));
  const [summary, setSummary] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [collaboratingClubIds, setCollaboratingClubIds] = useState<string[]>([]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const buildPayload = () => ({
    title: title.trim(),
    category,
    date,
    summary: summary.trim(),
    beneficiaries: beneficiaries ? Number(beneficiaries) : null,
    photos: photos.map(urlOf).filter((u): u is string => Boolean(u)),
    collaboratingClubIds,
    consentConfirmed,
  });

  function validate(requireConsent: boolean): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Say what the club did';
    if (!category) next.category = 'Pick an area of focus';
    if (!date) next.date = 'Pick a date';
    if (!summary.trim()) next.summary = 'Tell us what happened';
    if (requireConsent && !consentConfirmed) next.consent = 'Confirm consent before sending for review';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const saveDraftMutation = useMutation({
    mutationFn: () => createProject(buildPayload()),
    onSuccess: () => navigate('/portal/showcase/mine'),
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not save the draft. Try again.'),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const created = await createProject(buildPayload());
      return updateProject(created.id, { status: 'submitted' });
    },
    onSuccess: () => navigate('/portal/showcase/mine'),
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not send this for review. Try again.'),
  });

  const onSaveDraft = () => {
    setFormError(null);
    if (!validate(false)) return;
    saveDraftMutation.mutate();
  };

  const onSendForReview = () => {
    setFormError(null);
    if (!validate(true)) return;
    submitMutation.mutate();
  };

  const setPhoto = (index: number, value: FileUploadValue | null) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const busy = saveDraftMutation.isPending || submitMutation.isPending;

  return (
    <Container width="wide">
      <Section
        title="Put a project on the showcase"
        description="You ran it, so you write it. A district officer checks it and publishes — usually within a week."
      >
        {formError && (
          <div className="mb-5">
            <Alert tone="error" title="Something went wrong">
              {formError}
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex max-w-[600px] flex-col gap-5">
            <Field label="What did the club do?" required error={errors.title}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blood donation camp" maxLength={200} />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="When" required error={errors.date}>
                <DateInput value={date} onChange={setDate} />
              </Field>
              <Field label="Area of focus" required error={errors.category}>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Choose one"
                  options={SHOWCASE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </Field>
            </div>

            <Field
              label="Photographs"
              hint="One is enough, four is plenty. Upload files, or paste a Drive/Photos link. Landscape works best in the grid."
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {photos.map((value, i) => (
                  <FileUpload
                    key={i}
                    tier="dynamic"
                    resourceType="project_photo"
                    resourceId={clubId || undefined}
                    value={value}
                    onChange={(v) => setPhoto(i, v)}
                    label={i === 0 ? 'Lead photo' : `Photo ${i + 1}`}
                  />
                ))}
              </div>
            </Field>

            <Field label="Tell us what happened" required hint="Four or five lines. What you did, who it was for, and anything that surprised you." error={errors.summary}>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} maxLength={3000} />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Roughly how many people did it reach">
                <Input
                  type="number"
                  min={0}
                  value={beneficiaries}
                  onChange={(e) => setBeneficiaries(e.target.value)}
                  placeholder="120"
                />
              </Field>
              <Field label="Other clubs or organisations" hint="Optional">
                <MultiSelect
                  options={clubOptions}
                  values={collaboratingClubIds}
                  onChange={setCollaboratingClubIds}
                  placeholder="Search clubs…"
                />
              </Field>
            </div>

            <Card tone="action" className="border-[1.5px]">
              <Checkbox
                label="Everyone identifiable in these photographs is happy to appear on a public page. Where the project involved children or patients, that permission was taken in person."
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
              />
              {errors.consent && <p className="mt-1 text-[11px] font-semibold text-danger-fg">{errors.consent}</p>}
            </Card>

            <div className="flex flex-wrap gap-2.5">
              <Button onClick={onSendForReview} loading={submitMutation.isPending} disabled={busy}>
                Send for review
              </Button>
              <Button variant="secondary" onClick={onSaveDraft} loading={saveDraftMutation.isPending} disabled={busy}>
                Save a draft
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <p className="m-0 mb-3.5 text-[10.5px] font-bold uppercase tracking-[0.9px] text-accent">What happens next</p>
              <Timeline
                items={[
                  { title: 'You send it', meta: 'Now', state: 'current' },
                  {
                    title: 'Your president is told',
                    meta: 'Not asked to approve — just told, so nothing is submitted behind their back',
                  },
                  {
                    title: 'An officer edits and publishes',
                    meta: 'Within about a week. They may tighten the wording; they will not change what you claim',
                  },
                  { title: 'It appears on the showcase', meta: 'With your club named' },
                ]}
              />
            </Card>
            <Card tone="plain">
              <p className="m-0 mb-2 text-[13px] font-extrabold text-fg">Why a member submits, not the president</p>
              <p className="m-0 text-[12px] leading-relaxed text-fg-2">
                The avenue directors run the projects. Routing every entry through the president makes one person the
                bottleneck for everyone else&apos;s work, and the write-up would come from somebody who wasn&apos;t there.
                Publishing still needs an officer, so the approval gate the district asked for is intact.
              </p>
            </Card>
            <Card tone="plain">
              <p className="m-0 mb-2 text-[13px] font-extrabold text-fg">The consent tick is not boilerplate</p>
              <p className="m-0 text-[12px] leading-relaxed text-fg-2">
                It is the one thing a member can confirm and a district officer cannot. An officer approving a photo of a
                school handover has no way to know whether those parents agreed; the person who was in the room does.
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </Container>
  );
}
