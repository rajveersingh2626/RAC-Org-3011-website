import { writeFileSync } from 'node:fs';
import { PUBLIC_ROUTES } from '../src/app/routes/public-routes';

const SITE_ORIGIN = 'https://rotaract3011.org';

function buildSitemap(routes: string[]): string {
  const urls = routes
    .map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRobots(): string {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

writeFileSync('public/sitemap.xml', buildSitemap(PUBLIC_ROUTES));
writeFileSync('public/robots.txt', buildRobots());
