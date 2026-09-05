import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ScoreMonthPage } from './ScoreMonthPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. DSC', email: 'dsc@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'dsc', scope: { type: 'none' } }],
  grants: { 'reports:score': [{ type: 'none' }] },
  clubs: [],
  theme: 'light',
};

const POINTS_SUMMARY = {
  clubId: 'club_a',
  ryYear: 2026,
  total: 95,
  byCategory: [{ categoryId: 'c1', categoryKey: 'club_services', categoryName: 'Club Services', points: 24 }],
  byMonth: [{ periodKey: '2026-08', points: 89 }],
  month: '2026-08',
  entries: [
    {
      id: 'e1',
      ruleId: 'r1',
      ruleKey: 'club_physical_meetings',
      ruleLabel: 'Physical club meetings',
      ruleType: 'per_unit',
      rulePeriod: 'monthly',
      categoryId: 'c1',
      categoryKey: 'club_services',
      categoryName: 'Club Services',
      periodKey: '2026-08',
      points: 24,
      trace: { ruleId: 'r1', ruleKey: 'club_physical_meetings', label: 'Physical club meetings', categoryKey: 'club_services', inputs: { count: 3 }, points: 24 },
    },
  ],
  judged: { points: 6, reason: 'Ran the camp jointly', createdById: 'usr_1', updatedAt: '2026-08-20T00:00:00Z' },
};

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/clubs/club_a', () => HttpResponse.json({ id: 'club_a', name: 'Delhi Rajdhani', shortName: 'DR', zoneId: 'zone_agni' })),
    http.get('/clubs/club_a/points', () => HttpResponse.json(POINTS_SUMMARY)),
    http.get('/reports', () =>
      HttpResponse.json({
        items: [{ id: 'rep_a', clubId: 'club_a', ryYear: 2026, month: '2026-08-01', schemaVersion: 4, status: 'submitted', values: { activities: [] }, notes: null, submittedById: 'u1', submittedAt: '2026-09-01T00:00:00Z', filedOnTime: true, scoredAt: null }],
        total: 1,
        page: 1,
        pageSize: 1,
      }),
    ),
    http.patch('/clubs/club_a/points', () => HttpResponse.json({ ...POINTS_SUMMARY, judged: { ...POINTS_SUMMARY.judged, points: 10 } })),
    http.post('/reports/:id/queries', () =>
      HttpResponse.json({ id: 'rep_a', clubId: 'club_a', ryYear: 2026, month: '2026-08-01', schemaVersion: 4, status: 'queried', values: { activities: [] }, notes: null, submittedById: 'u1', submittedAt: '2026-09-01T00:00:00Z', filedOnTime: true, scoredAt: null }),
    ),
  );
}

describe('ScoreMonthPage', () => {
  it('shows computed rows with an expandable trace, the judged entry, and the total', async () => {
    installHandlers();
    renderPage(<ScoreMonthPage />, {
      path: '/portal/admin/clubs/:clubId/:month',
      initialEntries: ['/portal/admin/clubs/club_a/2026-08'],
    });

    expect(await screen.findByText('Physical club meetings')).toBeInTheDocument();
    expect(screen.getByText('Computed subtotal')).toBeInTheDocument();
    expect(screen.getByText(/points for August 2026/)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'trace' }));
    expect(screen.getByText('count')).toBeInTheDocument();
  });

  it('never puts an input next to a computed number, only next to the judged one', async () => {
    installHandlers();
    renderPage(<ScoreMonthPage />, {
      path: '/portal/admin/clubs/:clubId/:month',
      initialEntries: ['/portal/admin/clubs/club_a/2026-08'],
    });
    await screen.findByText('Physical club meetings');

    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    expect(screen.getByLabelText('Points')).toBeInTheDocument();
  });

  it('saving the judged score PATCHes the club points endpoint', async () => {
    installHandlers();
    renderPage(<ScoreMonthPage />, {
      path: '/portal/admin/clubs/:clubId/:month',
      initialEntries: ['/portal/admin/clubs/club_a/2026-08'],
    });
    await screen.findByText('Physical club meetings');

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Points'), '10');
    await user.type(screen.getByLabelText('Why'), 'Joint camp with two Rotary clubs');
    await user.click(screen.getByRole('button', { name: 'Save and open the next' }));

    await waitFor(() => expect(screen.queryByText('Physical club meetings')).not.toBeInTheDocument());
  });

  it('opens the query modal and sends a question to the club', async () => {
    installHandlers();
    renderPage(<ScoreMonthPage />, {
      path: '/portal/admin/clubs/:clubId/:month',
      initialEntries: ['/portal/admin/clubs/club_a/2026-08'],
    });
    await screen.findByText('Physical club meetings');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Query the club' }));
    await user.type(screen.getByLabelText('Question'), 'Please confirm attendance');
    await user.click(screen.getByRole('button', { name: 'Send query' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
