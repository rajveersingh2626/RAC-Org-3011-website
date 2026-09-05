import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDocumentMeta } from '@/lib/meta';
import { submitListing } from '@/lib/publicApi/careerbridge';
import type { ListingType } from '@/lib/careerbridge/types';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiError } from '@/lib/api';

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
  { value: 'mentorship', label: 'Mentorship' },
];
const MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function PostOpportunityPage() {
  useDocumentMeta({ title: 'Post an opening' });

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<ListingType>('job');
  const [location, setLocation] = useState('');
  const [mode, setMode] = useState('remote');
  const [stipend, setStipend] = useState('');
  const [description, setDescription] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [postedByName, setPostedByName] = useState('');
  const [postedByEmail, setPostedByEmail] = useState('');
  const [rotaryAffiliation, setRotaryAffiliation] = useState('');
  // Honeypot: real visitors never see this field. A bot that fills every input trips it.
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      submitListing({
        title: title.trim(),
        company: company.trim(),
        type,
        location: location.trim(),
        mode,
        stipend: stipend.trim() || null,
        description: description.trim(),
        applyUrl: applyUrl.trim() || null,
        contactEmail: contactEmail.trim(),
        postedByName: postedByName.trim(),
        postedByEmail: postedByEmail.trim(),
        rotaryAffiliation: rotaryAffiliation.trim() || null,
        website: website || undefined,
      }),
    onError: (e: unknown) => setFormError(e instanceof ApiError ? e.message : 'Could not submit this listing. Try again.'),
  });

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'Give this opening a title';
    if (!company.trim()) next.company = 'Say who is hiring';
    if (!location.trim()) next.location = 'Add a location';
    if (description.trim().length < 20) next.description = 'Describe the role in at least 20 characters';
    if (!/^\S+@\S+\.\S+$/.test(contactEmail.trim())) next.contactEmail = 'Enter a valid contact email';
    if (!postedByName.trim()) next.postedByName = "Enter the poster's name";
    if (!/^\S+@\S+\.\S+$/.test(postedByEmail.trim())) next.postedByEmail = 'Enter a valid email — we send a verification link here';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const onSubmit = () => {
    setFormError(null);
    if (!validate()) return;
    mutation.mutate();
  };

  if (mutation.isSuccess) {
    return (
      <Container width="narrow" className="py-16">
        <EmptyState
          title="Check your email"
          body={`We sent a verification link to ${postedByEmail}. Click it to send this listing to the district's Career Bridge admins for review.`}
        />
      </Container>
    );
  }

  return (
    <Container width="narrow">
      <Section
        eyebrow="Career Bridge"
        title="Post an opening"
        description="Share a job, internship or mentorship opportunity. We'll email you a link to confirm before it goes to review."
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <Alert tone="error" title="Something went wrong">
              {formError}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Title" required error={errors.title}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Marketing Intern" maxLength={200} />
            </Field>
            <Field label="Company / organisation" required error={errors.company}>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={200} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Type" required>
              <Select value={type} onChange={(e) => setType(e.target.value as ListingType)} options={TYPE_OPTIONS} />
            </Field>
            <Field label="Location" required error={errors.location}>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Delhi" maxLength={200} />
            </Field>
            <Field label="Mode" required>
              <Select value={mode} onChange={(e) => setMode(e.target.value)} options={MODE_OPTIONS} />
            </Field>
          </div>

          <Field label="Stipend / compensation" hint="Optional">
            <Input value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="₹15,000/month" maxLength={100} />
          </Field>

          <Field label="Description" required error={errors.description}>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} />
          </Field>

          <Field label="Apply URL" hint="Optional — a form, job post, or careers page">
            <Input type="url" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="https://" />
          </Field>

          <Field label="Contact email" required error={errors.contactEmail} hint="Shown to applicants on the listing">
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>

          <Field label="Rotary / Rotaract affiliation" hint="Optional">
            <Input value={rotaryAffiliation} onChange={(e) => setRotaryAffiliation(e.target.value)} maxLength={200} />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Your name" required error={errors.postedByName}>
              <Input value={postedByName} onChange={(e) => setPostedByName(e.target.value)} />
            </Field>
            <Field label="Your email" required error={errors.postedByEmail} hint="We'll send a verification link here">
              <Input type="email" value={postedByEmail} onChange={(e) => setPostedByEmail(e.target.value)} />
            </Field>
          </div>

          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
          />

          <div>
            <Button onClick={onSubmit} loading={mutation.isPending} disabled={mutation.isPending}>
              Submit for verification
            </Button>
          </div>
        </div>
      </Section>
    </Container>
  );
}
