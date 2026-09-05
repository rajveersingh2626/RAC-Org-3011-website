import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = [
  '/portal/dashboard',
  '/portal/reports/new',
  '/portal/reports/history',
  '/portal/reports/rep_queried',
  '/portal/reports/rep_draft/review',
  '/portal/admin/clubs',
  '/portal/admin/report-form',
  '/portal/admin/requests',
  '/portal/admin/requests/new',
];

for (const path of ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await loginAsClubOfficer(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('a president can add an activity and see it in the sidebar list', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/portal/reports/new');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/What did you do\?/).fill('Tree plantation drive');
  await page.getByLabel(/When\?/).fill('2026-08-15');
  await page.getByLabel('Avenue', { exact: false }).selectOption('community');
  await page.getByLabel(/Which area of focus/).selectOption('environment');
  await page.getByLabel('Initiated by', { exact: false }).selectOption('rotaract');
  await page.getByLabel(/Members participated/).fill('15');
  await page.getByRole('button', { name: /Save this activity, add another/ }).click();

  await expect(page.getByText('Tree plantation drive')).toBeVisible();
});

test('the queried report shows the secretariat question and lets the club reply', async ({ page }, testInfo) => {
  // the mock API's report store is shared across all projects; only reply once so the other two projects still see the open query
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/portal/reports/rep_queried');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Is 420 the daily user count or the whole school?')).toBeVisible();
  await page.getByLabel('Reply to the secretariat').fill('It is the daily user count.');
  await page.getByRole('button', { name: 'Send reply and resubmit' }).click();

  await expect(page.getByText('Reply: It is the daily user count.')).toBeVisible();
});
