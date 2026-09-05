import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadEnv, preview, type PreviewServer } from 'vite';
import { chromium, type Browser, type Route } from '@playwright/test';
import { PRERENDER_ROUTES, outputFileFor } from './prerenderRoutes';
import { isDegraded, type ApiResponseEvent } from '../src/lib/prerenderDegradation';

const DIST_DIR = join(process.cwd(), 'dist');
// process.env wins (Docker build ARG); falls back to .env[.mode] files for local/e2e runs, since those never reach the shell's env.
const VITE_ENV = loadEnv(process.env.VITE_MODE ?? 'production', process.cwd(), 'VITE_');
const API_ORIGIN = process.env.VITE_API_ORIGIN ?? VITE_ENV.VITE_API_ORIGIN ?? '';
const NAV_TIMEOUT_MS = 15_000;

async function startPreviewServer(): Promise<{ server: PreviewServer; baseUrl: string }> {
  const server = await preview({ preview: { port: 0 }, logLevel: 'error' });
  const baseUrl = server.resolvedUrls?.local[0];
  if (!baseUrl) throw new Error('vite preview did not resolve a local URL');
  return { server, baseUrl };
}

function injectPrerenderedState(html: string, stateJson: string | null): string {
  const safeState = stateJson ? stateJson.replace(/</g, '\\u003c') : 'null';
  const script = `<script>window.__RAC_PRERENDERED__=true;window.__RAC_PRERENDERED_STATE__=${safeState};</script>`;
  return html.replace('</head>', `${script}</head>`);
}

// The real API's CORS allowlist (WEB_ORIGINS) only trusts the real web hostnames, not vite preview's ephemeral localhost origin, so the crawling browser's own fetch would be CORS-blocked. Proxying through Node's fetch (no CORS enforcement server-side) and adding a permissive ACAO header on the way back is the same trusted-build-tool bypass a real SSR server would have.
async function proxyPastCors(route: Route): Promise<void> {
  const req = route.request();
  // The client sends `credentials: 'include'`; a wildcard ACAO is rejected outright for credentialed
  // requests, so the response must name the page's own origin and allow credentials explicitly.
  const origin = req.headers()['origin'] ?? '*';
  const corsHeaders: Record<string, string> = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
  };
  if (req.method() === 'OPTIONS') {
    return route.fulfill({
      status: 204,
      headers: {
        ...corsHeaders,
        'access-control-allow-methods': 'GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS',
        'access-control-allow-headers': req.headers()['access-control-request-headers'] ?? 'content-type',
      },
      body: '',
    });
  }
  try {
    const res = await fetch(req.url(), {
      method: req.method(),
      headers: req.headers(),
      body: ['GET', 'HEAD'].includes(req.method()) ? undefined : (req.postData() ?? undefined),
    });
    const headers = Object.fromEntries(res.headers.entries());
    Object.assign(headers, corsHeaders);
    delete headers['content-encoding'];
    await route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
  } catch {
    await route.abort();
  }
}

async function prerenderRoute(browser: Browser, baseUrl: string, route: string): Promise<{ ok: true; html: string } | { ok: false }> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    // Lets useSurfaceHref/useMainSiteHref detect the crawl and skip baking in localhost.
    await page.addInitScript(() => {
      (globalThis as unknown as { __RAC_PRERENDER_CRAWL__?: boolean }).__RAC_PRERENDER_CRAWL__ = true;
    });
    const events: ApiResponseEvent[] = [];
    page.on('response', (res) => events.push({ url: res.url(), ok: res.ok() }));
    page.on('requestfailed', (req) => events.push({ url: req.url(), ok: false }));
    if (API_ORIGIN) await page.route(`${API_ORIGIN}/**`, proxyPastCors);
    await page.route('**/public/live', (r) => r.abort());
    await page.route('**/public/visits', (r) => r.abort());

    await page.goto(`${baseUrl.replace(/\/$/, '')}${route}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    await page.waitForLoadState('networkidle', { timeout: NAV_TIMEOUT_MS }).catch(() => undefined);

    if (isDegraded(events, API_ORIGIN)) return { ok: false };

    const stateJson = await page.evaluate(() => {
      const w = globalThis as unknown as { __RAC_DEHYDRATE__?: () => string };
      return w.__RAC_DEHYDRATE__ ? w.__RAC_DEHYDRATE__() : null;
    });
    const html = injectPrerenderedState(await page.content(), stateJson);
    return { ok: true, html };
  } catch {
    return { ok: false };
  } finally {
    await context.close();
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    console.warn('[prerender] dist/index.html not found - run `vite build` first, skipping prerender.');
    return;
  }
  if (!API_ORIGIN) {
    console.warn('[prerender] VITE_API_ORIGIN not set - shipping the plain SPA shell for every public route.');
    return;
  }

  const { server, baseUrl } = await startPreviewServer();
  try {
    const browser = await chromium.launch();
    try {
      let rendered = 0;
      for (const route of PRERENDER_ROUTES) {
        const result = await prerenderRoute(browser, baseUrl, route);
        if (!result.ok) {
          console.warn(`[prerender] ${route}: API data unavailable at build time, shipping the plain SPA shell for this route.`);
          continue;
        }
        const outFile = join(DIST_DIR, outputFileFor(route));
        mkdirSync(dirname(outFile), { recursive: true });
        writeFileSync(outFile, result.html);
        rendered += 1;
      }
      console.log(`[prerender] ${rendered}/${PRERENDER_ROUTES.length} public routes prerendered.`);
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
}

// .finally(exit) is a safety net: a leaked open handle must never hang the whole `npm run build` chain.
main()
  .catch((err: unknown) => {
    console.warn('[prerender] unexpected failure, shipping the plain SPA shell for every public route:', err);
  })
  .finally(() => process.exit(0));
