import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { Providers, createQueryClient } from '@/app/providers';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { RegisterPage } from './RegisterPage';
import { PendingPage } from './PendingPage';

mswSetup();

function renderWithPendingRoute() {
  return render(
    <Providers queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={['/portal/register']}>
        <Routes>
          <Route path="/portal/register" element={<RegisterPage />} />
          <Route path="/portal/pending" element={<PendingPage />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json({ statusCode: 401, error: 'Unauthorized' }, { status: 401 })),
    http.get('/public/clubs', () =>
      HttpResponse.json({
        items: [{ id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', slug: 'dse', zoneId: 'zone_agni' }],
        total: 1,
      }),
    ),
    http.post('/members/register', () => HttpResponse.json({ id: 'mp_new', status: 'pending' }, { status: 201 })),
  );
}

describe('RegisterPage', () => {
  it('submits the form and redirects to the pending screen', async () => {
    installHandlers();
    renderWithPendingRoute();

    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Rotaract Club of Delhi South East' });

    await user.type(screen.getByLabelText(/Full name/), 'Ishita Rao');
    await user.type(screen.getByLabelText(/Email/), 'ishita@example.com');
    await user.type(screen.getByLabelText(/Password/), 'Correct-Horse-1');
    await user.selectOptions(screen.getByLabelText(/Club/), 'club_dse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Almost there')).toBeInTheDocument();
  });

  it('shows a server validation error on a duplicate email', async () => {
    installHandlers();
    server.use(
      http.post('/members/register', () =>
        HttpResponse.json({ statusCode: 409, error: 'Conflict', code: 'ALREADY_EXISTS', message: 'An account already exists for this email' }, { status: 409 }),
      ),
    );
    renderPage(<RegisterPage />, { path: '/portal/register', initialEntries: ['/portal/register'] });

    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Rotaract Club of Delhi South East' });
    await user.type(screen.getByLabelText(/Full name/), 'Ishita Rao');
    await user.type(screen.getByLabelText(/Email/), 'ishita@example.com');
    await user.type(screen.getByLabelText(/Password/), 'Correct-Horse-1');
    await user.selectOptions(screen.getByLabelText(/Club/), 'club_dse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account already exists for this email')).toBeInTheDocument();
  });
});
