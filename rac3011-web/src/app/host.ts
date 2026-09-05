import { useEffect, useState } from 'react';

export const SURFACES = ['main', 'mission3011', 'drishti', 'rcl', 'careerbridge', 'ride'] as const;
export type Surface = (typeof SURFACES)[number];

const APEX = 'rotaract3011.org';

const PROJECT_SURFACES = SURFACES.filter((s): s is Exclude<Surface, 'main'> => s !== 'main');

function isSurface(value: string | null): value is Surface {
  return value !== null && (SURFACES as readonly string[]).includes(value);
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
}

// Every deployment is <surface>.rotaract3011.org or testing.<surface>.rotaract3011.org.
function currentEnvPrefix(hostname: string): '' | 'testing.' {
  return hostname === `testing.${APEX}` || hostname.startsWith('testing.') ? 'testing.' : '';
}

export function resolveSurface(hostname: string, search = ''): Surface {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const labels = host.split('.');
  const first = labels[0] ?? '';
  const byPrefix = PROJECT_SURFACES.find((s) => s === first);
  if (byPrefix) return byPrefix;
  // testing.<surface>.rotaract3011.org mirrors testing.rotaract3011.org (main's staging host)
  // for the project subdomains, so each surface gets its own staging URL.
  if (first === 'testing') {
    const byTestingPrefix = PROJECT_SURFACES.find((s) => s === labels[1]);
    if (byTestingPrefix) return byTestingPrefix;
  }
  if (isLocalHost(host)) {
    const q = new URLSearchParams(search).get('surface');
    if (isSurface(q)) return q;
  }
  return 'main';
}

export function mainSiteHref(): string {
  const url = new URL(window.location.href);
  if (isLocalHost(url.hostname)) {
    url.searchParams.delete('surface');
    url.pathname = '/';
    return url.toString();
  }
  const prefix = currentEnvPrefix(url.hostname);
  url.hostname = prefix ? `${prefix}${APEX}` : APEX;
  url.pathname = '/';
  return url.toString();
}

export function surfaceHref(key: Exclude<Surface, 'main'>): string {
  const url = new URL(window.location.href);
  if (isLocalHost(url.hostname)) {
    url.searchParams.set('surface', key);
    url.pathname = '/';
    return url.toString();
  }
  const prefix = currentEnvPrefix(url.hostname);
  url.hostname = `${prefix}${key}.${APEX}`;
  url.pathname = '/';
  url.search = '';
  return url.toString();
}

function isPrerenderCrawl(): boolean {
  return Boolean((window as unknown as { __RAC_PRERENDER_CRAWL__?: boolean }).__RAC_PRERENDER_CRAWL__);
}

// The crawler runs in a real browser genuinely on localhost, so effect timing can't help - it
// skips computing entirely (flagged by scripts/prerender.ts) and lets real hydration fill it in.
export function useMainSiteHref(): string | undefined {
  const [href, setHref] = useState<string>();
  useEffect(() => {
    if (!isPrerenderCrawl()) setHref(mainSiteHref());
  }, []);
  return href;
}

export function useSurfaceHref(key: Exclude<Surface, 'main'>): string | undefined {
  const [href, setHref] = useState<string>();
  useEffect(() => {
    if (!isPrerenderCrawl()) setHref(surfaceHref(key));
  }, [key]);
  return href;
}
