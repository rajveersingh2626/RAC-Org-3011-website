import { QueryClient } from '@tanstack/react-query';
import { exposeQueryClientForPrerender, hydratePrerenderedState, isPrerendered } from './prerender';

afterEach(() => {
  delete window.__RAC_PRERENDERED__;
  delete window.__RAC_PRERENDERED_STATE__;
  delete window.__RAC_DEHYDRATE__;
});

describe('isPrerendered', () => {
  it('is false when the flag is absent', () => {
    expect(isPrerendered()).toBe(false);
  });

  it('is true once a prerendered page sets the flag', () => {
    window.__RAC_PRERENDERED__ = true;
    expect(isPrerendered()).toBe(true);
  });
});

describe('exposeQueryClientForPrerender', () => {
  it('exposes a dehydrate function filtered by the given predicate', () => {
    const client = new QueryClient();
    client.setQueryData(['public', 'clubs'], { items: [] });
    client.setQueryData(['me'], { id: 'u1' });

    exposeQueryClientForPrerender(client, (query) => query.queryKey[0] === 'public');
    const parsed = JSON.parse(window.__RAC_DEHYDRATE__?.() ?? '{}') as { queries: { queryKey: unknown[] }[] };

    expect(parsed.queries).toHaveLength(1);
    expect(parsed.queries[0].queryKey).toEqual(['public', 'clubs']);
  });
});

describe('hydratePrerenderedState', () => {
  it('does nothing when no prerendered state is present (graceful degradation)', () => {
    const client = new QueryClient();
    expect(() => hydratePrerenderedState(client)).not.toThrow();
    expect(client.getQueryData(['public', 'clubs'])).toBeUndefined();
  });

  it('hydrates the client from window.__RAC_PRERENDERED_STATE__', () => {
    const source = new QueryClient();
    source.setQueryData(['public', 'clubs'], { items: [{ id: 'club_1' }] });
    exposeQueryClientForPrerender(source, () => true);
    window.__RAC_PRERENDERED_STATE__ = JSON.parse(window.__RAC_DEHYDRATE__?.() ?? 'null');

    const client = new QueryClient();
    hydratePrerenderedState(client);

    expect(client.getQueryData(['public', 'clubs'])).toEqual({ items: [{ id: 'club_1' }] });
  });
});
