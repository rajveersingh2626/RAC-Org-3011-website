import { z } from 'zod';
import { apiFetch, ApiError, onUnauthorized } from './api';

const mockFetch = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('apiFetch', () => {
  it('sends credentials and JSON body', async () => {
    mockFetch.mockResolvedValue(reply(200, { ok: true }));
    await apiFetch('/x', { method: 'POST', body: { a: 1 } });
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('/x');
    expect(init?.credentials).toBe('include');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"a":1}');
  });
  it('parses with the zod schema', async () => {
    mockFetch.mockResolvedValue(reply(200, { n: 1 }));
    const out = await apiFetch('/x', { schema: z.object({ n: z.number() }) });
    expect(out.n).toBe(1);
  });
  it('throws ApiError on schema mismatch', async () => {
    mockFetch.mockResolvedValue(reply(200, { n: 'x' }));
    await expect(apiFetch('/x', { schema: z.object({ n: z.number() }) })).rejects.toBeInstanceOf(ApiError);
  });
  it('throws ApiError with status, code, details', async () => {
    mockFetch.mockResolvedValue(reply(409, { statusCode: 409, message: 'Taken', code: 'SLOT_TAKEN' }));
    const err = await apiFetch('/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).code).toBe('SLOT_TAKEN');
  });
  it('notifies unauthorized listeners on 401', async () => {
    const spy = vi.fn();
    const off = onUnauthorized(spy);
    mockFetch.mockResolvedValue(reply(401, { message: 'Unauthorized' }));
    await expect(apiFetch('/me')).rejects.toBeInstanceOf(ApiError);
    expect(spy).toHaveBeenCalledTimes(1);
    off();
  });
  it('returns undefined for empty 204', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
