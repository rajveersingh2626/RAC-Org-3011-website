import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Form, useZodForm } from '@/components/ui/Form';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const credentialsSchema = z.object({
  email: z.string().trim().min(1, 'Enter your Rotary ID or email address'),
  password: z.string().min(1, 'Enter your password'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
  rememberDevice: z.boolean(),
});

type SecondFactorMethod = 'email' | 'totp';

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  const start = (from = seconds) => {
    setRemaining(from);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setRemaining((n) => {
        if (n <= 1) {
          clearInterval(timer.current);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  return { remaining, start };
}

export function LoginPage() {
  useDocumentMeta({ title: 'Club portal sign in' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const next = searchParams.get('next') ?? '/portal/dashboard';

  const [step, setStep] = useState<'credentials' | 'second-factor'>('credentials');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<SecondFactorMethod>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const countdown = useCountdown(30);

  const credentials = useZodForm(credentialsSchema, { email: '', password: '' });
  const secondFactor = useZodForm(codeSchema, { code: '', rememberDevice: false });

  const submitCredentials = credentials.handleSubmit(async (values) => {
    setFormError(null);
    try {
      // Better-Auth swaps the response shape entirely once an authenticator app is enrolled.
      const res = await apiFetch<{ twoFactorRedirect?: boolean; twoFactorMethods?: string[] }>('/auth/sign-in/email', {
        method: 'POST',
        body: values,
      });
      const nextMethod: SecondFactorMethod = res.twoFactorRedirect && res.twoFactorMethods?.includes('totp') ? 'totp' : 'email';
      setEmail(values.email);
      setMethod(nextMethod);
      setStep('second-factor');
      if (nextMethod === 'email') {
        countdown.start(30);
        // Automatically dispatch verification code to email
        apiFetch('/second-factor/resend', { method: 'POST' }).catch(() => undefined);
      }
    } catch (e) {
      if (e instanceof ApiError && e.details) credentials.setServerErrors(e.details);
      else setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  const submitCode = secondFactor.handleSubmit(async (values) => {
    setFormError(null);
    try {
      // TOTP has no session yet to attach a "second factor" to (better-auth holds it in a separate
      // challenge cookie), so it must complete through better-auth's own endpoint, not ours.
      if (method === 'totp') {
        await apiFetch('/auth/two-factor/verify-totp', { method: 'POST', body: { code: values.code } });
      } else {
        await apiFetch('/second-factor/verify', {
          method: 'POST',
          body: { method, code: values.code, rememberDevice: values.rememberDevice },
        });
      }
      await refresh();
      navigate(next, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.details) secondFactor.setServerErrors(e.details);
      else setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    }
  });

  const resend = async () => {
    if (countdown.remaining > 0) return;
    try {
      // The API returns {status:'sent'} with no computed retry-after, so reuse the fixed 30s window.
      await apiFetch('/second-factor/resend', { method: 'POST' });
      countdown.start(30);
    } catch {
      countdown.start(30);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[16px] border border-line-accent bg-surface p-8 shadow-raised">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D81B60] via-[#123499] to-[#880E4F]" />
        <img src="/district-logo.png" alt="Rotaract District Organization 3011" className="mb-6 h-8 w-auto dark:brightness-0 dark:invert" />
        {formError ? (
          <div className="mb-4">
            <Alert tone="error" title="Sign-in problem">
              {formError}
            </Alert>
          </div>
        ) : null}
        {step === 'credentials' ? (
          <>
            <p className="m-0 mb-2.5 text-[10.5px] font-bold tracking-[1px] text-accent">STEP 1 OF 2</p>
            <h1 className="m-0 mb-2 text-[22px] font-extrabold tracking-tight text-fg">Club portal</h1>
            <p className="m-0 mb-6 text-[13.5px] text-fg-2">For club presidents, secretaries and district officers.</p>
            <Form onSubmit={submitCredentials} submitting={credentials.submitting}>
              <Field label="Rotary ID or email" error={credentials.errors.email} required>
                <Input
                  type="text"
                  autoComplete="username"
                  value={credentials.values.email}
                  onChange={(e) => credentials.setValue('email', e.target.value)}
                />
              </Field>
              <Field label="Password" error={credentials.errors.password} required>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={credentials.values.password}
                  onChange={(e) => credentials.setValue('password', e.target.value)}
                />
              </Field>
              <Button type="submit" block loading={credentials.submitting}>
                Continue
              </Button>
            </Form>
            <p className="mt-6 text-center text-[13px] text-fg-2">
              Need to set up your account?{' '}
              <Link to="/portal/register" className="font-bold text-accent hover:underline">
                Join your club
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="m-0 mb-6 flex items-center gap-2 text-[12.5px] font-semibold text-fg-2">{email}</p>
            <p className="m-0 mb-2.5 text-[10.5px] font-bold tracking-[1px] text-accent">STEP 2 OF 2</p>
            <h1 className="m-0 mb-2 text-[22px] font-extrabold tracking-tight text-fg">
              {method === 'totp' ? 'Enter your authenticator code' : 'Check your email'}
            </h1>
            <p className="m-0 mb-6 text-[13.5px] text-fg-2">
              {method === 'totp' ? (
                'Open your authenticator app and enter the current 6-digit code.'
              ) : (
                <>
                  We&apos;ve sent a six-digit code to <span className="font-bold text-fg">{email}</span>. It&apos;s valid for ten minutes.
                </>
              )}
            </p>
            <Form onSubmit={submitCode} submitting={secondFactor.submitting}>
              <Field label="6-digit code" error={secondFactor.errors.code} required>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={secondFactor.values.code}
                  onChange={(e) => secondFactor.setValue('code', e.target.value.replace(/\D/g, ''))}
                />
              </Field>
              {method === 'email' ? (
                <p className="m-0 text-[12px] text-fg-2">
                  Didn&apos;t arrive?{' '}
                  <button
                    type="button"
                    onClick={() => void resend()}
                    disabled={countdown.remaining > 0}
                    className="font-bold text-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send it again
                  </button>{' '}
                  {countdown.remaining > 0 ? `in 0:${String(countdown.remaining).padStart(2, '0')}` : null}
                </p>
              ) : null}
              {method === 'email' ? (
                <Checkbox
                  label="Stay signed in on this device for 5 hours"
                  checked={secondFactor.values.rememberDevice}
                  onChange={(e) => secondFactor.setValue('rememberDevice', e.target.checked)}
                />
              ) : null}
              <Button type="submit" block loading={secondFactor.submitting}>
                Sign in
              </Button>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
