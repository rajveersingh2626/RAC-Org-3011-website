import { isDegraded } from './prerenderDegradation';

const ORIGIN = 'https://api.rotaract3011.org';

describe('isDegraded', () => {
  it('is false when every /public/* response succeeded', () => {
    expect(isDegraded([{ url: `${ORIGIN}/public/home`, ok: true }], ORIGIN)).toBe(false);
  });

  it('is true when a /public/* response failed', () => {
    expect(isDegraded([{ url: `${ORIGIN}/public/projects`, ok: false }], ORIGIN)).toBe(true);
  });

  it('ignores /public/live and /public/visits failures', () => {
    const events = [
      { url: `${ORIGIN}/public/live`, ok: false },
      { url: `${ORIGIN}/public/visits`, ok: false },
    ];
    expect(isDegraded(events, ORIGIN)).toBe(false);
  });

  it('ignores non-API responses', () => {
    expect(isDegraded([{ url: 'http://localhost:4173/assets/index.js', ok: false }], ORIGIN)).toBe(false);
  });

  it('is false for an empty event list', () => {
    expect(isDegraded([], ORIGIN)).toBe(false);
  });
});
