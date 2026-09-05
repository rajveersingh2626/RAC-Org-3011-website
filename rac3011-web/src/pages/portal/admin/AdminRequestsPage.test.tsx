import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { AdminRequestsPage } from './AdminRequestsPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Officer', email: 'o@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'dsc', scope: { type: 'none' } }],
  grants: { 'requests:manage': [{ type: 'none' }] },
  clubs: [],
  theme: 'light',
};

function requests() {
  return [
    { id: 'req_1', title: 'Installation details', description: null, questions: ['Date?'], audience: { all: true }, dueAt: '2026-09-30T00:00:00Z', createdById: 'usr_1' },
  ];
}

describe('AdminRequestsPage', () => {
  it('lists requests with their audience and lets you delete one', async () => {
    let current = requests();
    server.use(
      http.get('/me', () => HttpResponse.json(ME)),
      http.get('/report-requests', () => HttpResponse.json({ items: current })),
      http.delete('/report-requests/:id', () => {
        current = [];
        return HttpResponse.json({ ok: true });
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<AdminRequestsPage />);

    expect(await screen.findByText('Installation details')).toBeInTheDocument();
    expect(screen.getByText('All clubs')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText('No open requests')).toBeInTheDocument());
  });
});
