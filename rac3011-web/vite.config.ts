import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Mirrors nginx.conf's per-host root mapping (§14.9) for local/e2e parity: `vite preview` has no host-based routing, so "/" is special-cased here the same way.
const servePrerenderedRoot: Plugin = {
  name: 'prerender-root-preview',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const homePath = join(server.config.build.outDir, 'home.html');
      if (req.url === '/' && existsSync(homePath)) {
        res.setHeader('Content-Type', 'text/html');
        res.end(readFileSync(homePath));
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), servePrerenderedRoot],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: true,
    allowedHosts: ['.localhost'],
    proxy: {
      '^/(auth|second-factor|me|public|reports|report-requests|report-schemas|clubs|zones|members|directory|events|resources|publications|projects|content-blocks|partners|enquiries|settings|roles|user-roles|permissions|point-categories|point-rules|trusted-devices|careerbridge|drishti|mission3011|ride|rcl)': {
        target: 'https://api.rotaract3011.org',
        changeOrigin: true,
        secure: true,
        headers: {
          origin: 'https://testing.rotaract3011.org',
          referer: 'https://testing.rotaract3011.org/'
        },
        cookieDomainRewrite: 'localhost',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const cookie = proxyReq.getHeader('cookie');
            if (typeof cookie === 'string') {
              proxyReq.setHeader('cookie', cookie.replace(/\brac3011\.session=/g, '__Secure-rac3011.session='));
            }
          });
          proxy.on('proxyRes', (proxyRes) => {
            const sc = proxyRes.headers['set-cookie'];
            if (sc) {
              proxyRes.headers['set-cookie'] = (Array.isArray(sc) ? sc : [sc]).map((c) =>
                c.replace(/__Secure-/g, '').replace(/;\s*Secure/gi, '')
              );
            }
          });
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
