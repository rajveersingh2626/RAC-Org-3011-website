import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { NewRequestPage } from './NewRequestPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Officer', email: 'o@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'dsc', scope: { type: 'none' } }],
  grants: { 'requests:manage': [{ type: 'none' }] },
  clubs: [],
  theme: 'light',
};

describe('NewRequestPage', () => {
  it('validates required fields before submitting', async () => {
    server.use(http.get('/me', () => HttpResponse.json(ME)), http.get('/public/clubs', () => HttpResponse.json({ items: [], total: 0 })), http.get('/zones', () => HttpResponse.json([])));
    renderPage(<NewRequestPage />);
    await screen.findByText('Ask clubs for something else');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Send request' }));

    expect(await screen.findByText(/Give the request a title/)).toBeInTheDocument();
  });

  it('creates a request with the entered title, due date, and questions', async () => {
    let created: Record<string, unknown> | null = null;
    server.use(
      http.get('/me', () => HttpResponse.json(ME)),
      http.get('/public/clubs', () => HttpResponse.json({ items: [], total: 0 })),
      http.get('/zones', () => HttpResponse.json([])),
      http.post('/report-requests', async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'req_new', title: created.title, description: created.description, questions: created.questions, audience: created.audience, dueAt: created.dueAt, createdById: 'usr_1' });
      }),
    );
    renderPage(<NewRequestPage />);
    await screen.findByText('Ask clubs for something else');

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('What are you asking for?'), 'Installation details');
    await user.type(screen.getByLabelText('Due by'), '2026-09-30');
    await user.type(screen.getByLabelText('Question 1'), 'Installation date?');
    await user.click(screen.getByRole('button', { name: 'Send request' }));

    await waitFor(() => expect(created).not.toBeNull());
    expect(created).toMatchObject({ title: 'Installation details', questions: ['Installation date?'], audience: { all: true } });
  });
});
