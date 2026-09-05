import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { NewReportPage } from './NewReportPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. President', email: 'p@example.org', twoFactorEnabled: false },
  profile: { clubId: 'club_dse', photoUrl: null, themePreference: 'light' },
  roles: [{ roleKey: 'president', scope: { type: 'club', id: 'club_dse' } }],
  grants: { 'reports:submit': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

const SCHEMA_FIELDS = [
  { id: 'fl1', section: 'Club', fieldKey: 'physical_meetings', label: 'Physical meetings', type: 'number', options: null, required: true, order: 0, helpText: null, perActivity: false, pointSourceKey: 'physical_meetings' },
  { id: 'fl2', section: 'Monthly activity log', fieldKey: 'activity_title', label: 'What did you do?', type: 'text', options: null, required: true, order: 1, helpText: null, perActivity: true, pointSourceKey: null },
  { id: 'fl3', section: 'Monthly activity log', fieldKey: 'activity_date', label: 'When?', type: 'date', options: null, required: true, order: 2, helpText: null, perActivity: true, pointSourceKey: null },
  { id: 'fl4', section: 'Monthly activity log', fieldKey: 'collaborating_clubs', label: 'Anyone else involved?', type: 'clubs', options: null, required: false, order: 3, helpText: null, perActivity: true, pointSourceKey: null },
];

function draftReport(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'rep_1',
    clubId: 'club_dse',
    ryYear: 2026,
    month: '2026-08-01',
    schemaVersion: 4,
    status: 'draft',
    values: { activities: [] },
    notes: null,
    submittedById: null,
    submittedAt: null,
    filedOnTime: null,
    scoredAt: null,
    ...overrides,
  };
}

function installHandlers(report = draftReport()) {
  let current = report;
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/report-schemas', () => HttpResponse.json({ items: [{ id: 'sc4', version: 4, status: 'active', publishedAt: '2026-08-01', fields: SCHEMA_FIELDS }] })),
    http.get('/reports', () => HttpResponse.json({ items: [current], total: 1, page: 1, pageSize: 1 })),
    http.patch('/reports/:id', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      current = { ...current, ...body };
      return HttpResponse.json(current);
    }),
    http.get('/public/clubs', () => HttpResponse.json({ items: [{ id: 'club_other', name: 'Other Club', shortName: 'OC', slug: 'other', zoneId: 'zone_agni' }], total: 1 })),
  );
  return () => current;
}

describe('NewReportPage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('renders the fields from the live active schema, grouped by section', async () => {
    installHandlers();
    renderPage(<NewReportPage />);

    expect(await screen.findByText('This month at the club')).toBeInTheDocument();
    expect(screen.getByLabelText(/Physical meetings/)).toBeInTheDocument();
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByLabelText(/What did you do\?/)).toBeInTheDocument();
  });

  it('shows a validation error when saving an activity without a required field', async () => {
    installHandlers();
    renderPage(<NewReportPage />);
    await screen.findByText('Activity 1');

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /Save this activity, add another/ }));

    expect(await screen.findByText('What did you do? is required')).toBeInTheDocument();
  });

  it('adds an activity to the sidebar list once required fields are filled', async () => {
    installHandlers();
    renderPage(<NewReportPage />);
    await screen.findByText('Activity 1');

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByLabelText(/What did you do\?/), 'Blood donation camp');
    await user.type(screen.getByLabelText(/When\?/), '2026-08-10');
    await user.click(screen.getByRole('button', { name: /Save this activity, add another/ }));

    expect(await screen.findByText('Blood donation camp')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
  });

  it('marks the draft unsaved after a change, then autosaves without an explicit save click', async () => {
    const getCurrent = installHandlers();
    vi.useRealTimers();
    renderPage(<NewReportPage />);
    await screen.findByLabelText(/Physical meetings/);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Physical meetings/), '3');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Saved as you type')).toBeInTheDocument(), { timeout: 11_000 });
    expect((getCurrent().values as { physical_meetings?: number }).physical_meetings).toBe(3);
  }, 15_000);

  it('flushes the autosave immediately on blur', async () => {
    const getCurrent = installHandlers();
    renderPage(<NewReportPage />);
    await screen.findByLabelText(/Physical meetings/);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const input = screen.getByLabelText(/Physical meetings/);
    await user.type(input, '5');
    await user.tab();

    await waitFor(() => expect((getCurrent().values as { physical_meetings?: number }).physical_meetings).toBe(5));
  });
});
