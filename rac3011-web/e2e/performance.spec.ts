import { test, expect } from '@playwright/test';

const HERO_TITLE = 'Service above self, across Delhi NCR';
const ARTIFICIAL_DELAY_MS = 3_000;

test('home page hero renders without waiting on the live-visits or visit-counter requests', async ({ page }) => {
  await page.route('**/public/live', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
    await route.fulfill({ json: { year: 2026, count: 12480 } });
  });
  await page.route('**/public/visits', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
    await route.fulfill({ json: { year: 2026, count: 12481 } });
  });

  const start = Date.now();
  await page.goto('/');
  await page.getByText(HERO_TITLE).waitFor();
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(ARTIFICIAL_DELAY_MS);
});
