import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { DirectoryPage } from './DirectoryPage';

mswSetup();

const ME = {
  user: { id: 'usr_member', name: 'Rtr. Member', email: 'member@example.org', twoFactorEnabled: false },
  profile: { id: 'mp_1', clubId: 'club_dse', status: 'approved' },
  roles: [{ roleKey: 'member', scope: { type: 'club', id: 'club_dse' } }],
  grants: { 'directory:view': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

const DIRECTORY_ITEM = {
  id: 'mp_amanv',
  fullName: 'Aman Verma',
  photoUrl: null,
  skills: ['video editing', 'cricket'],
  interests: [],
  club: { id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', zoneId: 'zone_agni', zoneName: 'Zone Agni' },
};

function installBaseHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/zones', () => HttpResponse.json([{ id: 'zone_agni', name: 'Zone Agni', order: 1 }])),
    http.get('/skill-tags', () => HttpResponse.json([{ id: 'st_1', label: 'video editing', kind: 'skill' }])),
  );
}

describe('DirectoryPage', () => {
  it('shows a privacy gate on 409 and reveals the directory after accepting', async () => {
    installBaseHandlers();
    let accepted = false;
    server.use(
      http.get('/directory', () => {
        if (!accepted) {
          return HttpResponse.json(
            { statusCode: 409, error: 'Conflict', code: 'PRIVACY_NOT_ACCEPTED', message: 'Accept first' },
            { status: 409 },
          );
        }
        return HttpResponse.json({ items: [DIRECTORY_ITEM], total: 1, page: 1, pageSize: 25 });
      }),
      http.post('/me/privacy-acceptances', () => {
        accepted = true;
        return HttpResponse.json({ accepted: true });
      }),
    );

    renderPage(<DirectoryPage />, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) });

    expect(await screen.findByText('Read the privacy policy first')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'I accept, show me the directory' }));

    expect(await screen.findByText('Aman Verma')).toBeInTheDocument();
  });

  it('renders directory entries without contact details when already accepted', async () => {
    installBaseHandlers();
    server.use(
      http.get('/directory', () => HttpResponse.json({ items: [DIRECTORY_ITEM], total: 1, page: 1, pageSize: 25 })),
    );

    renderPage(<DirectoryPage />);

    expect(await screen.findByText('Aman Verma')).toBeInTheDocument();
    expect(screen.getAllByText('video editing').length).toBeGreaterThan(0);
    expect(screen.queryByText(/@example/)).not.toBeInTheDocument();
  });

  it('searches by name and refetches', async () => {
    installBaseHandlers();
    const seen: string[] = [];
    server.use(
      http.get('/directory', ({ request }) => {
        const url = new URL(request.url);
        seen.push(url.searchParams.get('q') ?? '');
        return HttpResponse.json({ items: [DIRECTORY_ITEM], total: 1, page: 1, pageSize: 25 });
      }),
    );

    renderPage(<DirectoryPage />);
    await screen.findByText('Aman Verma');

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Search the directory'), 'Aman');

    await waitFor(() => expect(seen).toContain('Aman'));
  });
});
