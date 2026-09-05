import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { SponsorPage } from './SponsorPage';

mswSetup();

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SponsorPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SponsorPage', () => {
  it('computes meals/kits/units from the range value using the seeded ratios', async () => {
    server.use(http.get('/public/content/get-involved', () => HttpResponse.json({})));
    renderPage();
    const slider = await screen.findByRole('slider', { name: 'Sponsorship amount in rupees' });
    fireEvent.change(slider, { target: { value: '100000' } });
    expect(screen.getByText('4,000')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('shows a routed confirmation after submitting', async () => {
    server.use(
      http.get('/public/content/get-involved', () => HttpResponse.json({})),
      http.post('/public/enquiries', () => HttpResponse.json({ received: true, routedTo: 'District Secretariat' })),
    );
    renderPage();
    fireEvent.change(await screen.findByLabelText(/Your name/), { target: { value: 'Rahul' } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'rahul@example.com' } });
    fireEvent.change(screen.getByLabelText(/Tell us about your interest/), { target: { value: 'Interested in Mission 3011.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit sponsorship interest' }));
    expect(await screen.findByText(/routed to District Secretariat/)).toBeInTheDocument();
  });
});
