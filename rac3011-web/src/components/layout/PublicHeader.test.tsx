import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicHeader } from './PublicHeader';

function renderHeader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PublicHeader', () => {
  it('links Career Bridge to the subdomain, not a same-router path', () => {
    renderHeader();
    const links = screen.getAllByRole('link', { name: 'Career Bridge' });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toMatch(/careerbridge/);
      expect(href).not.toBe('/careerbridge/opportunities');
    }
  });
});
