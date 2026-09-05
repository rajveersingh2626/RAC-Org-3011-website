import { renderHook } from '@testing-library/react';
import { mainSiteHref, resolveSurface, surfaceHref, useMainSiteHref, useSurfaceHref } from './host';

function withLocation(href: string, run: () => void) {
  const original = window.location.href;
  Object.defineProperty(window, 'location', { value: new URL(href), writable: true });
  try {
    run();
  } finally {
    Object.defineProperty(window, 'location', { value: new URL(original), writable: true });
  }
}

describe('resolveSurface', () => {
  it.each([
    ['rotaract3011.org', 'main'],
    ['www.rotaract3011.org', 'main'],
    ['mission3011.rotaract3011.org', 'mission3011'],
    ['drishti.rotaract3011.org', 'drishti'],
    ['rcl.rotaract3011.org', 'rcl'],
    ['careerbridge.rotaract3011.org', 'careerbridge'],
    ['ride.rotaract3011.org', 'ride'],
    ['RIDE.rotaract3011.org', 'ride'],
    ['mission3011.rotaract3011.org.', 'mission3011'],
    ['mission3011.localhost', 'mission3011'],
    ['drishti.localhost', 'drishti'],
    ['localhost', 'main'],
    ['127.0.0.1', 'main'],
    ['staging.rotaract3011.org', 'main'],
    ['testing.rotaract3011.org', 'main'],
    ['testing.drishti.rotaract3011.org', 'drishti'],
    ['testing.mission3011.rotaract3011.org', 'mission3011'],
    ['testing.rcl.rotaract3011.org', 'rcl'],
    ['testing.bogus.rotaract3011.org', 'main'],
    ['evil.com', 'main'],
  ])('%s → %s', (host, expected) => {
    expect(resolveSurface(host)).toBe(expected);
  });

  it('honours ?surface= on localhost only', () => {
    expect(resolveSurface('localhost', '?surface=rcl')).toBe('rcl');
    expect(resolveSurface('127.0.0.1', '?surface=ride')).toBe('ride');
    expect(resolveSurface('localhost', '?surface=bogus')).toBe('main');
    expect(resolveSurface('rotaract3011.org', '?surface=rcl')).toBe('main');
  });

  it('prefers hostname prefix over query', () => {
    expect(resolveSurface('drishti.localhost', '?surface=rcl')).toBe('drishti');
  });
});

describe('surfaceHref / mainSiteHref', () => {
  it('surfaceHref adds the testing. prefix only when already on a testing host', () => {
    withLocation('https://rotaract3011.org/', () => {
      expect(surfaceHref('drishti')).toBe('https://drishti.rotaract3011.org/');
    });
    withLocation('https://testing.rotaract3011.org/some/page', () => {
      expect(surfaceHref('drishti')).toBe('https://testing.drishti.rotaract3011.org/');
    });
  });

  it('mainSiteHref strips exactly the surface label, keeping any testing. prefix', () => {
    withLocation('https://drishti.rotaract3011.org/beneficiaries', () => {
      expect(mainSiteHref()).toBe('https://rotaract3011.org/');
    });
    withLocation('https://testing.drishti.rotaract3011.org/beneficiaries', () => {
      expect(mainSiteHref()).toBe('https://testing.rotaract3011.org/');
    });
  });

  it('both use the ?surface= query param on localhost, landing on /', () => {
    withLocation('http://localhost:5173/dashboard', () => {
      expect(surfaceHref('rcl')).toBe('http://localhost:5173/?surface=rcl');
      expect(mainSiteHref()).toBe('http://localhost:5173/');
    });
  });
});

describe('useSurfaceHref / useMainSiteHref (prerender safety)', () => {
  // Computed in useEffect, not inline at render: prerendering only captures the first synchronous
  // render (before effects run), so a plain function call here would bake whatever host the
  // prerender crawler happens to be running against (localhost) into every visitor's static HTML.
  it('resolves via useEffect to the same value the pure function would compute', () => {
    withLocation('https://rotaract3011.org/', () => {
      const { result: surface } = renderHook(() => useSurfaceHref('drishti'));
      expect(surface.current).toBe(surfaceHref('drishti'));
    });
    withLocation('https://testing.drishti.rotaract3011.org/beneficiaries', () => {
      const { result: main } = renderHook(() => useMainSiteHref());
      expect(main.current).toBe(mainSiteHref());
      expect(main.current).toBe('https://testing.rotaract3011.org/');
    });
  });
});
