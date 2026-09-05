import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { MeOverviewPage } from './MeOverviewPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Meera Nair', email: 'meera@example.org', twoFactorEnabled: false },
  profile: { id: 'mp_1', clubId: 'club_dse', photoUrl: null, status: 'approved' },
  roles: [{ roleKey: 'member', scope: { type: 'club', id: 'club_dse' } }],
  grants: {},
  clubs: [{ id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

describe('MeOverviewPage', () => {
  it('renders the membership card with club, member-since and a card id', async () => {
    server.use(
      http.get('/me', () => HttpResponse.json(ME)),
      http.get('/me/card', () =>
        HttpResponse.json({
          memberId: 'mp_1',
          fullName: 'Rtr. Meera Nair',
          cardId: '3011-DSE-0114',
          clubName: 'Rotaract Club of Delhi South East',
          clubShortName: 'DSE',
          memberSince: '2023-07-01',
          qrToken: 'qr_abc123',
        }),
      ),
    );

    renderPage(<MeOverviewPage />);

    expect(await screen.findByText('Rotaract Club of Delhi South East')).toBeInTheDocument();
    expect(screen.getByText('3011-DSE-0114')).toBeInTheDocument();
    expect(screen.getByAltText('Your check-in QR code')).toBeInTheDocument();
  });
});
