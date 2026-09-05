import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = ['/dashboard?surface=mission3011', '/camps?surface=mission3011', '/admin?surface=mission3011'];

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

test('the public dashboard renders without signing in', async ({ page }) => {
  await page.goto('/dashboard?surface=mission3011');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Mission 3011').first()).toBeVisible();
  await expect(page.getByText('1,240').first()).toBeVisible();
});

test('a club officer logs a camp and sees it in the list', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/camps?surface=mission3011');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Log a camp' }).click();
  await page.getByLabel('Date', { exact: false }).fill('2026-08-20');
  await page.getByLabel('Venue', { exact: false }).fill('Rohini Sports Complex');
  await page.getByLabel('Units collected', { exact: false }).fill('72');
  await page.getByRole('button', { name: 'Log this camp' }).click();

  await expect(page.getByText('Rohini Sports Complex')).toBeVisible();
});

test('the approvals desk is unreachable for a club officer without subdomain:mission3011:manage', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/dashboard?surface=mission3011');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);

  await page.goto('/admin?surface=mission3011');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText("You don't have access to this page")).toBeVisible();
  await expect(page.getByText('waiting on a decision')).toHaveCount(0);
});
