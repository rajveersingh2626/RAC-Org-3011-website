import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ReportDetailPage } from './ReportDetailPage';

mswSetup();

const SCHEMA_FIELDS = [
  { id: 'fl1', section: 'Club', fieldKey: 'physical_meetings', label: 'Physical meetings', type: 'number', options: null, required: true, order: 0, helpText: null, perActivity: false, pointSourceKey: 'physical_meetings' },
  { id: 'fl2', section: 'Monthly activity log', fieldKey: 'activity_title', label: 'What did you do?', type: 'text', options: null, required: true, order: 1, helpText: null, perActivity: true, pointSourceKey: null },
];

function meWith(grants: Record<string, { type: string; id?: string }[]>) {
  return {
    user: { id: 'usr_1', name: 'Rtr. Someone', email: 'x@example.org', twoFactorEnabled: false },
    profile: { clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
    roles: [],
    grants,
    clubs: [{ id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
    theme: 'light',
  };
}

interface QueryFixture {
  id: string;
  reportId: string;
  askedById: string;
  question: string;
  reply: string | null;
  repliedById: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface ReportFixture {
  id: string;
  clubId: string;
  ryYear: number;
  month: string;
  schemaVersion: number;
  status: string;
  values: Record<string, unknown>;
  notes: string | null;
  submittedById: string | null;
  submittedAt: string | null;
  filedOnTime: boolean | null;
  scoredAt: string | null;
  queries: QueryFixture[];
  club: { id: string; name: string; shortName: string; zoneId: string };
}

function queriedReport(): ReportFixture {
  return {
    id: 'rep_1',
    clubId: 'club_dse',
    ryYear: 2026,
    month: '2026-08-01',
    schemaVersion: 4,
    status: 'queried',
    values: { physical_meetings: 2, activities: [{ activity_title: 'Blood camp' }] },
    notes: null,
    submittedById: 'usr_2',
    submittedAt: '2026-09-02T10:00:00.000Z',
    filedOnTime: true,
    scoredAt: null,
    queries: [
      { id: 'q1', reportId: 'rep_1', askedById: 'usr_officer', question: 'Is the photo the original?', reply: null, repliedById: null, repliedAt: null, createdAt: '2026-09-03T10:00:00.000Z' },
    ],
    club: { id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' },
  };
}

function installHandlers(report: ReturnType<typeof queriedReport>, me: ReturnType<typeof meWith>) {
  let current = report;
  server.use(
    http.get('/me', () => HttpResponse.json(me)),
    http.get('/reports/:id', () => HttpResponse.json(current)),
    http.get('/report-schemas', () => HttpResponse.json({ items: [{ id: 'sc4', version: 4, status: 'active', publishedAt: null, fields: SCHEMA_FIELDS }] })),
    http.patch('/reports/:id/queries/:queryId', async ({ request }) => {
      const body = (await request.json()) as { reply: string };
      current = {
        ...current,
        status: 'submitted',
        queries: current.queries.map((q) => (q.id === 'q1' ? { ...q, reply: body.reply, repliedById: 'usr_1', repliedAt: '2026-09-04T00:00:00Z' } : q)),
      };
      return HttpResponse.json(current);
    }),
    http.post('/reports/:id/queries', async ({ request }) => {
      const body = (await request.json()) as { question: string };
      current = { ...current, status: 'queried', queries: [...current.queries, { id: 'q2', reportId: 'rep_1', askedById: 'usr_officer', question: body.question, reply: null, repliedById: null, repliedAt: null, createdAt: '2026-09-05T00:00:00Z' }] };
      return HttpResponse.json(current);
    }),
  );
  return () => current;
}

describe('ReportDetailPage', () => {
  it('shows the queried status and lets the club reply, which resubmits it', async () => {
    installHandlers(queriedReport(), meWith({ 'reports:submit': [{ type: 'club', id: 'club_dse' }] }));
    renderPage(<ReportDetailPage />, { path: '/portal/reports/:id', initialEntries: ['/portal/reports/rep_1'] });

    expect(await screen.findByText('QUERIED')).toBeInTheDocument();
    expect(screen.getByText('Is the photo the original?')).toBeInTheDocument();
    expect(screen.getByText('Awaiting a reply')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Reply to the secretariat'), 'Yes, resending the original.');
    await user.click(screen.getByRole('button', { name: 'Send reply and resubmit' }));

    await waitFor(() => expect(screen.getByText('Reply: Yes, resending the original.')).toBeInTheDocument());
  });

  it('lets an officer with reports:review ask a question on a submitted report', async () => {
    const submitted = { ...queriedReport(), status: 'submitted' as const, queries: [] };
    installHandlers(submitted, meWith({ 'reports:review': [{ type: 'zone', id: 'zone_agni' }] }));
    renderPage(<ReportDetailPage />, { path: '/portal/reports/:id', initialEntries: ['/portal/reports/rep_1'] });

    await screen.findByText('SUBMITTED');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Ask the club a question'), 'Can you confirm the venue?');
    await user.click(screen.getByRole('button', { name: 'Send query' }));

    await waitFor(() => expect(screen.getByText('Can you confirm the venue?')).toBeInTheDocument());
  });

  it('renders full field values grouped by section, using the schema for the report version', async () => {
    installHandlers(queriedReport(), meWith({ 'reports:submit': [{ type: 'club', id: 'club_dse' }] }));
    renderPage(<ReportDetailPage />, { path: '/portal/reports/:id', initialEntries: ['/portal/reports/rep_1'] });

    expect(await screen.findByText('Physical meetings')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Blood camp')).toBeInTheDocument();
  });
});
