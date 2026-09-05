import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { server, mswSetup } from '@/test/msw';
import { LIVE_QUERY_KEY, useLiveVisits, useVisitOnce } from './live';

mswSetup();

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => window.sessionStorage.clear());

describe('useLiveVisits', () => {
  it('reads the counter from /public/live when it exists', async () => {
    server.use(http.get('/public/live', () => HttpResponse.json({ year: 2026, count: 42 })));
    const client = new QueryClient();
    const { result } = renderHook(() => useLiveVisits(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ year: 2026, count: 42 });
  });

  it('falls back to /public/home visits when /public/live 404s', async () => {
    server.use(
      http.get('/public/live', () => HttpResponse.json({ message: 'not found' }, { status: 404 })),
      http.get('/public/home', () => HttpResponse.json({ visits: { year: 2026, count: 7 } })),
    );
    const client = new QueryClient();
    const { result } = renderHook(() => useLiveVisits(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ year: 2026, count: 7 });
  });

  it('surfaces a non-404 error from /public/live without falling back', async () => {
    server.use(http.get('/public/live', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useLiveVisits(), { wrapper: wrapper(client) });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useVisitOnce', () => {
  it('posts once per session and writes the returned count into the live query cache', async () => {
    server.use(http.post('/public/visits', () => HttpResponse.json({ year: 2026, count: 101 })));
    const client = new QueryClient();
    renderHook(() => useVisitOnce(), { wrapper: wrapper(client) });
    await waitFor(() => expect(client.getQueryData(LIVE_QUERY_KEY)).toEqual({ year: 2026, count: 101 }));
    expect(window.sessionStorage.getItem('rac3011.visitCounted')).toBe('1');
  });

  it('does not post a second time within the same session', async () => {
    let calls = 0;
    server.use(
      http.post('/public/visits', () => {
        calls += 1;
        return HttpResponse.json({ year: 2026, count: 101 });
      }),
    );
    window.sessionStorage.setItem('rac3011.visitCounted', '1');
    const client = new QueryClient();
    renderHook(() => useVisitOnce(), { wrapper: wrapper(client) });
    await new Promise((r) => setTimeout(r, 10));
    expect(calls).toBe(0);
  });
});
