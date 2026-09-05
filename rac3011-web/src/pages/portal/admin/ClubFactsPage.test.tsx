import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ClubFactsPage } from './ClubFactsPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. DSC', email: 'dsc@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'dsc', scope: { type: 'none' } }],
  grants: { 'club_facts:edit': [{ type: 'none' }] },
  clubs: [],
  theme: 'light',
};

const FACTS = {
  id: 'facts_1',
  clubId: 'club_a',
  ryYear: 2026,
  duesPaidOn: '2026-09-12',
  riCitationCompleted: false,
  paulHarrisFellows: 1,
  dualMembers: 3,
  mdioCommitteeMembers: 2,
  mdioEventsAttended: 1,
  sisterClubSignedOn: null,
  drrVisitOn: null,
  vocationalCentreOn: null,
  activeSocialHandles: 4,
  clubMerchandise: false,
  clubWebsiteUrl: null,
  priorYearMemberCount: 40,
};

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/clubs/club_a', () => HttpResponse.json({ id: 'club_a', name: 'Delhi Rajdhani', shortName: 'DR', zoneId: 'zone_agni' })),
    http.get('/clubs/club_a/facts', () => HttpResponse.json(FACTS)),
    http.patch('/clubs/club_a/facts', () => HttpResponse.json({ ...FACTS, paulHarrisFellows: 2 })),
  );
}

describe('ClubFactsPage', () => {
  it('shows the club facts loaded from the API', async () => {
    installHandlers();
    renderPage(<ClubFactsPage />, { path: '/portal/admin/clubs/:clubId/facts', initialEntries: ['/portal/admin/clubs/club_a/facts'] });

    expect(await screen.findByText(/Delhi Rajdhani/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('saves edits via PATCH /clubs/:id/facts', async () => {
    installHandlers();
    renderPage(<ClubFactsPage />, { path: '/portal/admin/clubs/:clubId/facts', initialEntries: ['/portal/admin/clubs/club_a/facts'] });
    await screen.findByText(/Delhi Rajdhani/);

    const user = userEvent.setup();
    const phf = screen.getByLabelText('Paul Harris Fellows');
    await user.clear(phf);
    await user.type(phf, '2');
    await user.click(screen.getByRole('button', { name: 'Save facts' }));

    await waitFor(() => expect(screen.getByLabelText('Paul Harris Fellows')).toHaveValue(2));
  });
});
