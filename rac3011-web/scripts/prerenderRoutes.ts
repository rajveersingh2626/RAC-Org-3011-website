// Static main-surface public routes only: excludes unbounded ":slug" detail routes, the auth-gated sister-club form (§4.8), and DRR ComingSoon placeholders.
export const PRERENDER_ROUTES: readonly string[] = [
  '/',
  '/map',
  '/showcase',
  '/heritage',
  '/leadership',
  '/initiatives',
  '/resources',
  '/resources/documents',
  '/resources/guest-kit',
  '/publications',
  '/get-involved/new-club',
  '/get-involved/sponsor',
  '/achievements',
  '/partners',
  '/contact',
  '/calendar',
  '/privacy-policy',
  '/terms-of-service',
];

// "/" -> home.html, not index.html: index.html is the shared SPA shell every hostname (incl. the 5 subdomains) falls back to (see nginx.conf's per-host index map).
export function outputFileFor(route: string): string {
  if (route === '/') return 'home.html';
  return `${route.replace(/^\//, '').replace(/\/$/, '')}.html`;
}
