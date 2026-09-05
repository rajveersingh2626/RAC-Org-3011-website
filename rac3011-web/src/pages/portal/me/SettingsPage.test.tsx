import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { SettingsPage } from './SettingsPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Meera Nair', email: 'meera@example.org', twoFactorEnabled: false },
  profile: { id: 'mp_1', clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
  roles: [{ roleKey: 'member', scope: { type: 'club', id: 'club_dse' } }],
  grants: {},
  clubs: [],
  theme: 'light',
};

function installHandlers() {
  let devices = [
    { id: 'td_1', userAgent: 'Chrome on Android', createdAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T05:00:00Z' },
  ];
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/auth/trusted-devices', () => HttpResponse.json(devices)),
    http.delete('/auth/trusted-devices/:id', ({ params }) => {
      devices = devices.filter((d) => d.id !== params.id);
      return HttpResponse.json({});
    }),
    http.post('/auth/two-factor/enable', () =>
      HttpResponse.json({ method: 'totp', totpURI: 'otpauth://totp/Rotaract:meera@example.org?secret=ABC', backupCodes: ['aaa111', 'bbb222'] }),
    ),
    http.post('/auth/two-factor/verify-totp', () => HttpResponse.json({ token: 'x' })),
    http.post('/auth/two-factor/disable', () => HttpResponse.json({})),
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    (globalThis as { Notification?: unknown }).Notification = {
      permission: 'default',
      requestPermission: async () => 'granted',
    };
  });

  it('lists a trusted device and revokes it', async () => {
    installHandlers();
    renderPage(<SettingsPage />);

    expect(await screen.findByText('Chrome on Android')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(screen.queryByText('Chrome on Android')).not.toBeInTheDocument());
  });

  it('walks through setting up an authenticator app', async () => {
    installHandlers();
    renderPage(<SettingsPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Set up an authenticator app' }));
    await user.type(screen.getByLabelText(/Confirm your password/), 'Correct-Horse-1');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(/Backup codes/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Enter the 6-digit code/), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByText('Authenticator app enabled')).toBeInTheDocument());
  });

  it('requests browser push permission from this screen', async () => {
    installHandlers();
    renderPage(<SettingsPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Allow push notifications' }));

    expect(await screen.findByText('Push notifications are allowed on this device.')).toBeInTheDocument();
  });
});
