import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ReviewSubmitPage } from './ReviewSubmitPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. President', email: 'p@example.org', twoFactorEnabled: false },
  profile: { clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
  roles: [],
  grants: { 'reports:submit': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

function draftReport() {
  return {
    id: 'rep_1', clubId: 'club_dse', ryYear: 2026, month: '2026-08-01', schemaVersion: 4, status: 'draft',
    values: { activities: [{ activity_title: 'Blood camp', activity_date: '2026-08-10', people_reached: 100 }] },
    notes: null, submittedById: null, submittedAt: null, filedOnTime: null, scoredAt: null,
  };
}

function installHandlers(report = draftReport()) {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/reports/:id', () => HttpResponse.json(report)),
    http.get('/report-schemas', () => HttpResponse.json({
      items: [{
        id: 'sc4', version: 4, status: 'active', publishedAt: null,
        fields: [{ id: 'fl1', section: 'Monthly activity log', fieldKey: 'people_reached', label: 'People reached', type: 'number', options: null, required: false, order: 0, helpText: null, perActivity: true, pointSourceKey: null }],
      }],
    })),
    http.patch('/reports/:id', () => HttpResponse.json({ ...report, status: 'submitted', submittedAt: '2026-09-01T00:00:00Z' })),
  );
}

describe('ReviewSubmitPage', () => {
  it('shows a read-only preview of every activity before submitting', async () => {
    installHandlers();
    renderPage(<ReviewSubmitPage />, { path: '/portal/reports/:id/review', initialEntries: ['/portal/reports/rep_1/review'] });

    expect(await screen.findByText('Blood camp')).toBeInTheDocument();
    expect(screen.getByText('1 activities, ready to send')).toBeInTheDocument();
  });

  it('submits the report, moving it to submitted', async () => {
    installHandlers();
    renderPage(<ReviewSubmitPage />, { path: '/portal/reports/:id/review', initialEntries: ['/portal/reports/rep_1/review'] });
    await screen.findByText('Blood camp');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit/ }));

    await waitFor(() => expect(screen.queryByRole('button', { name: /Submit/ })).not.toBeInTheDocument());
  });

  it('allows submitting a nil month with zero activities', async () => {
    const nil = { ...draftReport(), values: { activities: [] } };
    installHandlers(nil);
    renderPage(<ReviewSubmitPage />, { path: '/portal/reports/:id/review', initialEntries: ['/portal/reports/rep_1/review'] });

    expect(await screen.findByText('No activities this month')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/ })).not.toBeDisabled();
  });
});
