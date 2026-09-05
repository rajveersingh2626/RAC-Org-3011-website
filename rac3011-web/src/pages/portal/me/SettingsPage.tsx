import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/app/auth';
import { useTheme } from '@/app/theme';
import { apiFetch, ApiError } from '@/lib/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';

type TrustedDevice = { id: string; userAgent: string | null; createdAt: string; expiresAt: string };

function useTrustedDevices() {
  return useQuery({
    queryKey: ['auth', 'trusted-devices'],
    queryFn: () => apiFetch<TrustedDevice[]>('/auth/trusted-devices'),
  });
}

function ThemeSection() {
  const { preference, setPreference } = useTheme();
  return (
    <Card>
      <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">APPEARANCE</p>
      <SegmentedControl
        label="Theme"
        value={preference}
        onChange={(v) => setPreference(v as 'light' | 'dark' | 'system')}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />
    </Card>
  );
}

function TwoFactorSection() {
  const { me, refresh } = useAuth();
  const { toast } = useToast();
  const enabled = me?.user.twoFactorEnabled ?? false;
  const [stage, setStage] = useState<'idle' | 'password' | 'verify' | 'disable-password'>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const enable = useMutation({
    mutationFn: () =>
      apiFetch<{ method: string; totpURI?: string; backupCodes?: string[] }>('/auth/two-factor/enable', {
        method: 'POST',
        body: { password, method: 'totp' },
      }),
    onSuccess: (res) => {
      setError(null);
      setTotpURI(res.totpURI ?? null);
      setBackupCodes(res.backupCodes ?? []);
      setStage('verify');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start setup'),
  });

  const verify = useMutation({
    mutationFn: () => apiFetch('/auth/two-factor/verify-totp', { method: 'POST', body: { code } }),
    onSuccess: async () => {
      await refresh();
      setStage('idle');
      setPassword('');
      setCode('');
      toast({ title: 'Authenticator app enabled', tone: 'success' });
    },
    onError: () => setError('That code did not match. Try again.'),
  });

  const disable = useMutation({
    mutationFn: () => apiFetch('/auth/two-factor/disable', { method: 'POST', body: { password } }),
    onSuccess: async () => {
      await refresh();
      setStage('idle');
      setPassword('');
      toast({ title: 'Authenticator app turned off', tone: 'success' });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not turn it off'),
  });

  return (
    <Card>
      <p className="m-0 mb-1 text-[10.5px] font-bold tracking-[1px] text-fg-3">SECOND FACTOR</p>
      <p className="m-0 mb-3 text-[12.5px] text-fg-2">
        A six-digit code by email reaches you on every new sign-in by default. Add an authenticator app for a
        second, stronger option.
      </p>
      {error ? (
        <div className="mb-3">
          <Alert tone="error" title="Something went wrong">
            {error}
          </Alert>
        </div>
      ) : null}

      {stage === 'idle' && !enabled && (
        <Button variant="secondary" onClick={() => setStage('password')}>
          Set up an authenticator app
        </Button>
      )}
      {stage === 'idle' && enabled && (
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 text-[12.5px] font-bold text-fg">Authenticator app is on</p>
          <Button variant="danger" size="sm" onClick={() => setStage('disable-password')}>
            Turn off
          </Button>
        </div>
      )}

      {stage === 'password' && (
        <div className="flex flex-col gap-3">
          <Field label="Confirm your password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button loading={enable.isPending} onClick={() => enable.mutate()} disabled={!password}>
            Continue
          </Button>
        </div>
      )}

      {stage === 'verify' && (
        <div className="flex flex-col gap-3">
          {totpURI ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="rounded-[8px] border border-line-accent bg-white p-2">
                <QRCodeSVG value={totpURI} size={140} />
              </div>
              {backupCodes.length > 0 && (
                <div>
                  <p className="m-0 mb-1 text-[11px] font-bold text-fg-3">Backup codes &ndash; save these somewhere safe</p>
                  <p className="m-0 font-mono text-[11.5px] text-fg-2">{backupCodes.join(' · ')}</p>
                </div>
              )}
            </div>
          ) : null}
          <Field label="Enter the 6-digit code from your app">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Button loading={verify.isPending} onClick={() => verify.mutate()} disabled={code.length !== 6}>
            Confirm
          </Button>
        </div>
      )}

      {stage === 'disable-password' && (
        <div className="flex flex-col gap-3">
          <Field label="Confirm your password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button variant="danger" loading={disable.isPending} onClick={() => disable.mutate()} disabled={!password}>
            Turn off authenticator app
          </Button>
        </div>
      )}
    </Card>
  );
}

function TrustedDevicesSection() {
  const devicesQuery = useTrustedDevices();
  const qc = useQueryClient();
  const revoke = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/trusted-devices/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'trusted-devices'] }),
  });

  return (
    <Card>
      <p className="m-0 mb-3 text-[10.5px] font-bold tracking-[1px] text-fg-3">DEVICES SIGNED IN NOW</p>
      {devicesQuery.isPending ? (
        <Skeleton shape="rect" className="h-16" />
      ) : (devicesQuery.data ?? []).length === 0 ? (
        <p className="m-0 text-[12.5px] text-fg-3">No remembered devices yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {(devicesQuery.data ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-line-accent px-3 py-2.5">
              <div className="min-w-0">
                <p className="m-0 truncate text-[12.5px] font-bold text-fg">{d.userAgent ?? 'Unknown device'}</p>
                <p className="m-0 text-[11px] text-fg-3">Expires {new Date(d.expiresAt).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" loading={revoke.isPending} onClick={() => revoke.mutate(d.id)}>
                Sign out
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PushPermissionSection() {
  const [status, setStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const request = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setStatus(result);
  };

  return (
    <Card>
      <p className="m-0 mb-1 text-[10.5px] font-bold tracking-[1px] text-fg-3">NOTIFICATIONS ON THIS DEVICE</p>
      <p className="m-0 mb-3 text-[12.5px] text-fg-2">
        Allow browser push so event reminders and announcements can reach you here, not just by email.
      </p>
      {status === 'unsupported' ? (
        <p className="m-0 text-[12px] text-fg-3">This browser doesn&apos;t support push notifications.</p>
      ) : status === 'granted' ? (
        <p className="m-0 text-[12.5px] font-bold text-fg">Push notifications are allowed on this device.</p>
      ) : status === 'denied' ? (
        <p className="m-0 text-[12.5px] text-fg-3">
          Push notifications are blocked. Allow them from your browser&apos;s site settings.
        </p>
      ) : (
        <Button variant="secondary" onClick={() => void request()}>
          Allow push notifications
        </Button>
      )}
    </Card>
  );
}

export function SettingsPage() {
  useDocumentMeta({ title: 'Settings' });
  return (
    <Container width="wide">
      <Section
        eyebrow="Sign-in, devices, and what reaches you"
        title="Settings"
        description="Manage how you sign in and what this device is allowed to do."
      >
        <div className="flex flex-col gap-5">
          <ThemeSection />
          <TwoFactorSection />
          <TrustedDevicesSection />
          <PushPermissionSection />
        </div>
      </Section>
    </Container>
  );
}
