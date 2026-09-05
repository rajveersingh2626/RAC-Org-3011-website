import { useState } from 'react';
import { z } from 'zod';
import { useDocumentMeta } from '@/lib/meta';
import { useContentQuery, richTextOf } from '@/lib/publicApi/content';
import { postEnquiry, SPONSOR_RATIOS } from '@/lib/publicApi/enquiries';
import { ApiError } from '@/lib/api';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { RichText } from '@/components/public/RichText';
import { RangeInput } from '@/components/ui/RangeInput';
import { Stat } from '@/components/ui/Stat';
import { Form, useZodForm } from '@/components/ui/Form';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';

const MIN_AMOUNT = 5000;
const MAX_AMOUNT = 500000;

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  organisation: z.string().trim(),
  message: z.string().trim().min(1, 'Tell us about your interest'),
  website: z.string(),
});

function computedImpact(amount: number) {
  const factor = amount / 1000;
  return {
    meals: Math.round(factor * SPONSOR_RATIOS.mealsPerThousand),
    kits: Math.round(factor * SPONSOR_RATIOS.kitsPerThousand),
    units: Math.round(factor * SPONSOR_RATIOS.unitsPerThousand),
  };
}

export function SponsorPage() {
  useDocumentMeta({ title: 'Sponsor a project', description: 'Fund a district project and see the impact, rupee for rupee.' });
  const content = useContentQuery('get-involved');
  const [amount, setAmount] = useState(50000);
  const [routedTo, setRoutedTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useZodForm(schema, { name: '', email: '', organisation: '', message: '', website: '' });
  const impact = computedImpact(amount);

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await postEnquiry({ kind: 'sponsor', ...values, payload: { amount } });
      setRoutedTo(res.routedTo ?? 'the district secretariat');
      form.reset();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  const intro = richTextOf(content.data, 'sponsor_intro');

  return (
    <Container className="py-8" width="narrow">
      <Section eyebrow="Get involved" title="Sponsor a project">
        {content.isPending ? <Skeleton lines={2} className="mb-6" /> : intro ? <div className="mb-6"><RichText html={intro} /></div> : null}

        <div className="mb-8 rounded-[16px] border border-line-accent bg-surface p-5">
          <RangeInput
            aria-label="Sponsorship amount in rupees"
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={1000}
            value={amount}
            onChange={setAmount}
            formatValue={(v) => `₹${v.toLocaleString('en-IN')}`}
          />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Stat label="Meals" value={impact.meals.toLocaleString('en-IN')} />
            <Stat label="Kits" value={impact.kits.toLocaleString('en-IN')} />
            <Stat label="Blood units" value={impact.units.toLocaleString('en-IN')} />
          </div>
        </div>

        {routedTo ? (
          <Alert tone="action" title="Thanks — we've got it">
            Your sponsorship interest has been routed to {routedTo}, who'll follow up with details.
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
            <Field label="Organisation" hint="Optional">
              <Input value={form.values.organisation} onChange={(e) => form.setValue('organisation', e.target.value)} />
            </Field>
            <Field label="Tell us about your interest" error={form.errors.message} required>
              <Textarea rows={4} value={form.values.message} onChange={(e) => form.setValue('message', e.target.value)} />
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
              Submit sponsorship interest
            </Button>
          </Form>
        )}
      </Section>
    </Container>
  );
}
