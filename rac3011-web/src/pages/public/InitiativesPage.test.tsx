import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { InitiativesPage } from './InitiativesPage';

mswSetup();

const ITEMS = [
  { key: 'mission3011', label: 'Mission 3011', description: 'Blood donation drive.', status: 'active', leadClubId: 'club_1', summary: { headline: 'Units collected', value: 1847, target: 3011, unit: 'units', secondary: [{ label: 'Camps', value: 12 }], updatedAt: '2026-08-01T00:00:00.000Z' } },
  { key: 'drishti', label: 'Project Drishti', description: 'Cataract surgeries.', status: 'unreachable', leadClubId: 'club_2' },
  { key: 'rcl', label: 'RCL', description: 'Cricket league.', status: 'unassigned' },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <InitiativesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('InitiativesPage', () => {
  it('renders the active, unreachable and unassigned states from real payload shapes', async () => {
    server.use(http.get('/public/initiatives', () => HttpResponse.json({ items: ITEMS })));
    renderPage();

    expect(await screen.findByText('Units collected')).toBeInTheDocument();
    expect(screen.getByText('Live data temporarily unavailable')).toBeInTheDocument();
    expect(screen.getByText('Open for bidding')).toBeInTheDocument();

    expect(screen.getByText('Mission 3011').closest('a')).toHaveAttribute('href', expect.stringContaining('surface=mission3011'));
    expect(screen.getByText('Project Drishti').closest('a')).toHaveAttribute('href', expect.stringContaining('surface=drishti'));
    expect(screen.getByText('RCL').closest('a')).toHaveAttribute('href', expect.stringContaining('surface=rcl'));
  });
});
