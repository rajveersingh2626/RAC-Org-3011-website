import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ReportHistoryPage } from './ReportHistoryPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. President', email: 'p@example.org', twoFactorEnabled: false },
  profile: { clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
  roles: [],
  grants: { 'reports:submit': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

function report(status: string, month: string) {
  return {
    id: `rep_${month}`, clubId: 'club_dse', ryYear: 2026, month: `${month}-01`, schemaVersion: 4, status,
    values: { activities: [{ a: 1 }] }, notes: null, submittedById: null, submittedAt: null, filedOnTime: null, scoredAt: null,
  };
}

describe('ReportHistoryPage', () => {
  it('lists reports with a status filter and shows the open-requests panel', async () => {
    server.use(
      http.get('/me', () => HttpResponse.json(ME)),
      http.get('/reports', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('filter[status]');
        const items = [report('scored', '2026-06'), report('submitted', '2026-07')].filter((r) => !status || r.status === status);
        return HttpResponse.json({ items, total: items.length, page: 1, pageSize: 50 });
      }),
      http.get('/report-requests', () => HttpResponse.json({ items: [] })),
    );
    renderPage(<ReportHistoryPage />);

    expect(await screen.findByText('June 2026')).toBeInTheDocument();
    expect(screen.getByText('July 2026')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: 'Scored' }));

    await waitFor(() => expect(screen.queryByText('July 2026')).not.toBeInTheDocument());
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });
});
