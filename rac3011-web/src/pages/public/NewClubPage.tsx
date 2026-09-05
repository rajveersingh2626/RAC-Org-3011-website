import { useState } from 'react';
import { z } from 'zod';
import { useDocumentMeta } from '@/lib/meta';
import { useContentQuery, richTextOf } from '@/lib/publicApi/content';
import { postEnquiry } from '@/lib/publicApi/enquiries';
import { ApiError } from '@/lib/api';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { RichText } from '@/components/public/RichText';
import { Form, useZodForm } from '@/components/ui/Form';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  phone: z.string().trim(),
  organisation: z.string().trim().min(1, 'Enter the college or organisation'),
  message: z.string().trim().min(1, 'Tell us about your group'),
  website: z.string(),
});

export function NewClubPage() {
  useDocumentMeta({ title: 'Start a new club', description: 'Charter a Rotaract club in your college or community.' });
  const content = useContentQuery('get-involved');
  const [routedTo, setRoutedTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useZodForm(schema, { name: '', email: '', phone: '', organisation: '', message: '', website: '' });

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await postEnquiry({ kind: 'new_club', ...values });
      setRoutedTo(res.routedTo ?? 'the district secretariat');
      form.reset();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  const intro = richTextOf(content.data, 'new_club_intro');

  return (
    <Container className="py-8" width="narrow">
      <Section eyebrow="Get involved" title="Start a new club">
        {content.isPending ? <Skeleton lines={2} className="mb-6" /> : intro ? <div className="mb-6"><RichText html={intro} /></div> : null}

        {routedTo ? (
          <Alert tone="action" title="Thanks — we've got it">
            Your request has been routed to {routedTo}. They'll reach out with next steps for chartering your club.
          </Alert>
        ) : (
          <Form onSubmit={submit} submitting={form.submitting}>
            {formError ? (
              <Alert tone="error" title="Couldn't send that">
                {formError}
              </Alert>
            ) : null}
            <Field label="Your name" error={form.errors.name} required>
              <Input value={form.values.name} onChange={(e) => form.setValue('name', e.target.value)} />
            </Field>
            <Field label="Email" error={form.errors.email} required>
              <Input type="email" value={form.values.email} onChange={(e) => form.setValue('email', e.target.value)} />
            </Field>
            <Field label="Phone" hint="Optional">
              <Input type="tel" value={form.values.phone} onChange={(e) => form.setValue('phone', e.target.value)} />
            </Field>
            <Field label="College or organisation" error={form.errors.organisation} required>
              <Input value={form.values.organisation} onChange={(e) => form.setValue('organisation', e.target.value)} />
            </Field>
            <Field label="Tell us about your group" error={form.errors.message} required>
              <Textarea rows={5} value={form.values.message} onChange={(e) => form.setValue('message', e.target.value)} />
            </Field>
            <input
              type="text"
              name="website"
              value={form.values.website}
              onChange={(e) => form.setValue('website', e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="sr-only"
              aria-hidden
            />
            <Button type="submit" loading={form.submitting}>
              Submit request
            </Button>
          </Form>
        )}
      </Section>
    </Container>
  );
}
