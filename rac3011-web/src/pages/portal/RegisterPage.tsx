import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { fetchPublicClubs } from '@/lib/clubs';
import { registerMember } from '@/lib/members/api';
import { useDocumentMeta } from '@/lib/meta';
import { Form, useZodForm } from '@/components/ui/Form';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
  clubId: z.string().min(1, 'Choose your club'),
  phone: z.string().trim(),
});

export function RegisterPage() {
  useDocumentMeta({ title: 'Join your club portal' });
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const clubsQuery = useQuery({ queryKey: ['public-clubs', ''], queryFn: () => fetchPublicClubs() });
  const form = useZodForm(registerSchema, { fullName: '', email: '', password: '', clubId: '', phone: '' });

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerMember({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        clubId: values.clubId,
        phone: values.phone || undefined,
      });
      navigate('/portal/pending', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.details) form.setServerErrors(e.details);
      else setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-[460px] rounded-[16px] border border-line-accent bg-surface p-8 shadow-raised">
        <img src="/district-logo.png" alt="Rotaract District Organization 3011" className="mb-6 h-8 w-auto" />
        {formError ? (
          <div className="mb-4">
            <Alert tone="error" title="Couldn't register">
              {formError}
            </Alert>
          </div>
        ) : null}
        <h1 className="m-0 mb-2 text-[22px] font-extrabold tracking-tight text-fg">Join your club</h1>
        <p className="m-0 mb-6 text-[13.5px] text-fg-2">
          Your club&apos;s president or secretary will approve your account before you can sign in.
        </p>
        <Form onSubmit={submit} submitting={form.submitting}>
          <Field label="Full name" error={form.errors.fullName} required>
            <Input
              autoComplete="name"
              value={form.values.fullName}
              onChange={(e) => form.setValue('fullName', e.target.value)}
            />
          </Field>
          <Field label="Email" error={form.errors.email} required>
            <Input
              type="email"
              autoComplete="email"
              value={form.values.email}
              onChange={(e) => form.setValue('email', e.target.value)}
            />
          </Field>
          <Field label="Password" error={form.errors.password} required hint="At least 8 characters">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.values.password}
              onChange={(e) => form.setValue('password', e.target.value)}
            />
          </Field>
          <Field label="Club" error={form.errors.clubId} required>
            <Select
              value={form.values.clubId}
              onChange={(e) => form.setValue('clubId', e.target.value)}
              placeholder={clubsQuery.isPending ? 'Loading clubs…' : 'Choose your club'}
              disabled={clubsQuery.isPending}
              options={(clubsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Phone" error={form.errors.phone} hint="Optional">
            <Input
              type="tel"
              autoComplete="tel"
              value={form.values.phone}
              onChange={(e) => form.setValue('phone', e.target.value)}
            />
          </Field>
          <Button type="submit" block loading={form.submitting}>
            Create account
          </Button>
        </Form>
        <p className="m-0 mt-5 text-center text-[12.5px] text-fg-2">
          Already have an account? <Link to="/portal/login" className="font-bold text-accent">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
