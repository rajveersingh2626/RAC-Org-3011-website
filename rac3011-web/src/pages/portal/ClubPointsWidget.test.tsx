import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { currentRyYear } from '@/lib/reports/month';
import { ClubPointsWidget } from './ClubPointsWidget';

mswSetup();

describe('ClubPointsWidget', () => {
  it('shows the total, a per-month bar for each scored month, and top categories', async () => {
    server.use(
      http.get('/me', () => HttpResponse.json(null, { status: 401 })),
      http.get(`/clubs/club_dse/points`, () =>
        HttpResponse.json({
          clubId: 'club_dse',
          ryYear: currentRyYear(),
          total: 70,
          byCategory: [
            { categoryId: 'c1', categoryKey: 'club_services', categoryName: 'Club Services', points: 40 },
            { categoryId: 'c2', categoryKey: 'reporting', categoryName: 'Reporting to District', points: 30 },
          ],
          byMonth: [
            { periodKey: '2026-06', points: 28 },
            { periodKey: '2026-07', points: 42 },
          ],
          month: null,
          entries: [],
          judged: null,
        }),
      ),
    );

    renderPage(<ClubPointsWidget clubId="club_dse" />);

    expect(await screen.findByText('70')).toBeInTheDocument();
    expect(screen.getByText('across 2 scored months')).toBeInTheDocument();
    expect(screen.getByText('Club Services')).toBeInTheDocument();
    expect(screen.getByText('Reporting to District')).toBeInTheDocument();
    expect(screen.getByText(/own club's points only/)).toBeInTheDocument();
  });

  it('renders nothing when the request fails', async () => {
    server.use(
      http.get('/me', () => HttpResponse.json(null, { status: 401 })),
      http.get(`/clubs/club_dse/points`, () => HttpResponse.json({ message: 'nope' }, { status: 404 })),
    );
    const { container } = renderPage(<ClubPointsWidget clubId="club_dse" />);
    await waitFor(() => expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(container.textContent).not.toContain('own club');
  });
});
