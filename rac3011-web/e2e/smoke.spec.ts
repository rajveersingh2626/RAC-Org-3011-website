import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/',
  '/map',
  '/showcase',
  '/showcase/blood-donation-camp',
  '/showcase/clubs/delhi-south-east',
  '/heritage',
  '/heritage/archit-bhatia-2026-27',
  '/leadership',
  '/leadership/clubs/delhi-south-east',
  '/initiatives',
  '/resources',
  '/resources/documents',
  '/resources/branding',
  '/resources/guest-kit',
  '/resources/sister-club',
  '/publications',
  '/get-involved/new-club',
  '/get-involved/sponsor',
  '/achievements',
  '/partners',
  '/contact',
  '/calendar',
  '/calendar/youth-leadership-assembly',
  '/privacy-policy',
  '/terms-of-service',
  '/portal/login',
  '/__ui',
];

for (const path of ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
