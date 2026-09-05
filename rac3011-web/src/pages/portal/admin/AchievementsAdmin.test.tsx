import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { AchievementsAdmin } from './AchievementsAdmin';

mswSetup();

const ACHIEVEMENT = {
  id: 'ach_1',
  type: 'milestone',
  title: '50,000 lives impacted',
  clubId: null,
  date: '2026-07-01',
  certificateUrl: null,
  description: 'Cumulative reach.',
  order: 0,
};

let lastPatchBody: unknown;
let lastPostBody: unknown;

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(null, { status: 401 })),
    http.get('/achievements', () => HttpResponse.json({ items: [ACHIEVEMENT] })),
    http.patch('/achievements/:id', async ({ request }) => {
      lastPatchBody = await request.json();
      return HttpResponse.json({ ...ACHIEVEMENT, title: 'Updated title' });
    }),
    http.post('/achievements', async ({ request }) => {
      lastPostBody = await request.json();
      return HttpResponse.json({ ...ACHIEVEMENT, id: 'ach_2' }, { status: 201 });
    }),
  );
}

describe('AchievementsAdmin', () => {
  it('lists achievements and edits one, sending only writable fields (not id/order)', async () => {
    installHandlers();
    renderPage(<AchievementsAdmin canWrite />);

    expect(await screen.findByText('50,000 lives impacted')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(lastPatchBody).toBeDefined());
    const body = lastPatchBody as Record<string, unknown>;
    expect(body.id).toBeUndefined();
    expect(body.order).toBeUndefined();
    expect(body.title).toBe('50,000 lives impacted');
  });

  it('creates a new achievement without leaking an id field', async () => {
    installHandlers();
    renderPage(<AchievementsAdmin canWrite />);
    await screen.findByText('50,000 lives impacted');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /New achievement/i }));
    await user.type(screen.getByRole('textbox', { name: /^Title/ }), 'New milestone');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(lastPostBody).toBeDefined());
    const body = lastPostBody as Record<string, unknown>;
    expect(body.id).toBeUndefined();
    expect(body.title).toBe('New milestone');
  });

  it('hides write controls when canWrite is false', async () => {
    installHandlers();
    renderPage(<AchievementsAdmin canWrite={false} />);
    await screen.findByText('50,000 lives impacted');

    expect(screen.queryByRole('button', { name: /New achievement/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
