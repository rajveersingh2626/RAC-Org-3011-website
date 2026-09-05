import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { DashboardPage } from './DashboardPage';
import { currentReportMonth } from '@/lib/reports/month';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. President', email: 'p@example.org', twoFactorEnabled: false },
  profile: { clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
  roles: [],
  grants: { 'reports:submit': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

describe('DashboardPage', () => {
  it("prompts to start the report when this month's report doesn't exist yet", async () => {
    server.use(http.get('/me', () => HttpResponse.json(ME)), http.get('/reports', () => HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 1 })));
    renderPage(<DashboardPage />);

    expect(await screen.findByText(/report isn't in yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the report' })).toBeInTheDocument();
  });

  it('shows the current status badge when a report already exists', async () => {
    const month = currentReportMonth();
    server.use(
      http.get('/me', () => HttpResponse.json(ME)),
      http.get('/reports', () =>
        HttpResponse.json({
          items: [{ id: 'rep_1', clubId: 'club_dse', ryYear: 2026, month: `${month}-01`, schemaVersion: 4, status: 'queried', values: {}, notes: null, submittedById: null, submittedAt: null, filedOnTime: null, scoredAt: null }],
          total: 1, page: 1, pageSize: 1,
        }),
      ),
    );
    renderPage(<DashboardPage />);

    expect(await screen.findByText('Needs your reply')).toBeInTheDocument();
  });

  it('shows a neutral message for accounts without reporting permission', async () => {
    server.use(http.get('/me', () => HttpResponse.json({ ...ME, grants: {} })));
    renderPage(<DashboardPage />);

    expect(await screen.findByText('No monthly report for this account')).toBeInTheDocument();
  });
});
