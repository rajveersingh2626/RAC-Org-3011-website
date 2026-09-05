import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { ReportFormBuilderPage } from './ReportFormBuilderPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Officer', email: 'o@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'dsc', scope: { type: 'none' } }],
  grants: { 'requests:manage': [{ type: 'none' }] },
  clubs: [],
  theme: 'light',
};

interface SchemaField {
  id: string;
  section: string;
  fieldKey: string;
  label: string;
  type: string;
  options: unknown;
  required: boolean;
  order: number;
  helpText: string | null;
  perActivity: boolean;
  pointSourceKey: string | null;
}
interface SchemaFixture {
  id: string;
  version: number;
  status: string;
  publishedAt: string | null;
  fields: SchemaField[];
}
interface SchemaSummary {
  id: string;
  version: number;
  status: string;
  publishedAt: string | null;
}

function activeSchema(): SchemaFixture {
  return {
    id: 'sc4',
    version: 4,
    status: 'active',
    publishedAt: '2026-08-01T00:00:00Z',
    fields: [
      { id: 'fl1', section: 'Monthly activity log', fieldKey: 'activity_title', label: 'Activity title', type: 'text', options: null, required: true, order: 0, helpText: null, perActivity: true, pointSourceKey: null },
      { id: 'fl2', section: 'Monthly activity log', fieldKey: 'people_reached', label: 'People reached', type: 'number', options: null, required: false, order: 1, helpText: null, perActivity: true, pointSourceKey: null },
    ],
  };
}

function installHandlers() {
  let schemas: SchemaSummary[] = [{ id: 'sc4', version: 4, status: 'active', publishedAt: '2026-08-01T00:00:00Z' }];
  let full: SchemaFixture = activeSchema();
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/report-schemas', ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get('include') === 'fields') return HttpResponse.json({ items: [full] });
      return HttpResponse.json({ items: schemas });
    }),
    http.post('/report-schemas', () => {
      const draft = { ...full, id: 'sc5', version: 5, status: 'draft' as const, publishedAt: null };
      full = draft;
      schemas = [...schemas, { id: 'sc5', version: 5, status: 'draft', publishedAt: null }];
      return HttpResponse.json(draft);
    }),
    http.patch('/report-schemas/:version', async ({ request, params }) => {
      const body = (await request.json()) as { fields?: unknown[]; status?: string };
      if (body.fields) full = { ...full, fields: body.fields as typeof full.fields };
      if (body.status === 'active') {
        full = { ...full, status: 'active' };
        schemas = schemas.map((s) => ({ ...s, status: s.version === Number(params.version) ? 'active' : 'retired' }));
      }
      return HttpResponse.json(full);
    }),
  );
}

describe('ReportFormBuilderPage', () => {
  it('shows the active version read-only and offers to start a draft', async () => {
    installHandlers();
    renderPage(<ReportFormBuilderPage />);

    expect(await screen.findByText('Activity title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a new draft' })).toBeInTheDocument();
    expect(screen.queryByText('+ Add a field')).not.toBeInTheDocument();
  });

  it('starting a draft makes the field list editable: add, edit, reorder, remove', async () => {
    installHandlers();
    renderPage(<ReportFormBuilderPage />);
    await screen.findByText('Activity title');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Start a new draft' }));

    await screen.findByText('+ Add a field');
    await user.click(screen.getByText('+ Add a field'));

    const modal = screen.getByRole('dialog');
    await user.type(within(modal).getByLabelText('Label'), 'Photo');
    await user.type(within(modal).getByLabelText(/Field key/), 'photo_links');
    await user.click(within(modal).getByRole('button', { name: 'Save field' }));

    expect(await screen.findByText('Photo')).toBeInTheDocument();

    // reorder: move the new field up above "People reached"
    await user.click(screen.getByRole('button', { name: 'Move Photo up' }));

    // remove a field
    await user.click(screen.getByRole('button', { name: 'Remove Photo' }));
    await waitFor(() => expect(screen.queryByText('Photo')).not.toBeInTheDocument());
  });

  it('publishes the draft as the new active version', async () => {
    installHandlers();
    renderPage(<ReportFormBuilderPage />);
    await screen.findByText('Activity title');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Start a new draft' }));

    await user.click(await screen.findByRole('button', { name: 'Publish as version 5' }));
    await waitFor(() => expect(screen.getByText('Version 5 is live.', { exact: false })).toBeInTheDocument());
  });
});
