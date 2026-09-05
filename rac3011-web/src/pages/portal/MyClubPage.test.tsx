import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { MyClubPage } from './MyClubPage';

mswSetup();

describe('MyClubPage', () => {
  it('renders club contact details and current officers', async () => {
    server.use(
      http.get('/me', () =>
        HttpResponse.json({
          user: { id: 'usr_1', name: 'Rtr. Member', email: 'm@example.org', twoFactorEnabled: false },
          profile: null,
          roles: [],
          grants: {},
          clubs: [],
          theme: 'light',
        }),
      ),
      http.get('/me/club', () =>
        HttpResponse.json({
          id: 'club_dse',
          name: 'Rotaract Club of Delhi South East',
          shortName: 'DSE',
          phone: '011-2345-6789',
          email: 'club@example.org',
          meetingInfo: 'Every Saturday, 6pm',
          logoUrl: null,
          memberCount: 38,
          board: [{ id: 'b1', name: 'Rtr. Dhruv Kumar Jha', position: 'President', phone: null, email: null }],
        }),
      ),
    );

    renderPage(<MyClubPage />);

    expect(await screen.findByText('011-2345-6789')).toBeInTheDocument();
    expect(screen.getByText('Rtr. Dhruv Kumar Jha')).toBeInTheDocument();
    expect(screen.getByText('President')).toBeInTheDocument();
  });
});
