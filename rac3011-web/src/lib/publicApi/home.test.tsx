import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { server, mswSetup } from '@/test/msw';
import { useHomeQuery } from './home';

mswSetup();

const HOME_BODY = {
  hero: { badge: 'District 3011', title: 'Title', subtitle: null, ctaPrimary: null, ctaSecondary: null },
  footerTagline: null,
  stats: { zones: 4, focusAreas: 7, foundedYear: 1968, ageRange: '18–30' },
  flagship: [],
  latestProjects: [],
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useHomeQuery', () => {
  it('fetches and validates the home payload without a visits field', async () => {
    server.use(http.get('/public/home', () => HttpResponse.json(HOME_BODY)));
    const client = new QueryClient();
    const { result } = renderHook(() => useHomeQuery(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.visits).toBeUndefined();
    expect(result.current.data?.stats.zones).toBe(4);
  });

  it('still accepts a visits field for as long as the API sends one', async () => {
    server.use(http.get('/public/home', () => HttpResponse.json({ ...HOME_BODY, visits: { year: 2026, count: 100 } })));
    const client = new QueryClient();
    const { result } = renderHook(() => useHomeQuery(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.visits).toEqual({ year: 2026, count: 100 });
  });
});
