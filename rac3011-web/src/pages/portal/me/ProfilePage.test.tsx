import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ProfilePage } from './ProfilePage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Meera Nair', email: 'meera@example.org', twoFactorEnabled: false },
  profile: {
    id: 'mp_1',
    fullName: 'Rtr. Meera Nair',
    email: 'meera@example.org',
    phone: null,
    rotaryId: null,
    clubId: 'club_dse',
    photoUrl: null,
    bio: 'Event management, and the one who remembers the checklist.',
    skills: ['event management'],
    interests: [],
    membershipAnniversary: '2023-07-01',
    status: 'approved',
    directoryOptIn: true,
    isDacMember: false,
    themePreference: 'light',
  },
  roles: [{ roleKey: 'member', scope: { type: 'club', id: 'club_dse' } }],
  grants: { 'profile:edit': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/skill-tags', () =>
      HttpResponse.json([
        { id: 'st_1', label: 'event management', kind: 'skill' },
        { id: 'st_2', label: 'photography', kind: 'skill' },
      ]),
    ),
    http.patch('/me', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ ...ME.profile, ...body });
    }),
  );
}

describe('ProfilePage', () => {
  it('preloads the current profile and saves an edit', async () => {
    installHandlers();
    renderPage(<ProfilePage />);

    const nameInput = await screen.findByDisplayValue('Rtr. Meera Nair');
    const user = userEvent.setup();
    await user.clear(nameInput);
    await user.type(nameInput, 'Rtr. Meera Nair Jr.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.getByText('Profile saved')).toBeInTheDocument());
  });

  it('shows a live directory preview reflecting the form values', async () => {
    installHandlers();
    renderPage(<ProfilePage />);

    await screen.findByDisplayValue('Rtr. Meera Nair');
    expect(screen.getByText('HOW YOU APPEAR IN THE DIRECTORY')).toBeInTheDocument();
    expect(screen.getAllByText('event management').length).toBeGreaterThan(0);
  });
});
