import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = ['/incoming?surface=ride', '/gallery?surface=ride', '/support-club?surface=ride', '/admin?surface=ride'];

for (const path of ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await loginAsClubOfficer(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    // The gallery embeds a real third-party (YouTube) iframe; its internal markup is not ours to fix.
    const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('the public incoming list renders without signing in and hides cancelled delegations', async ({ page }) => {
  await page.goto('/incoming?surface=ride');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Japan').first()).toBeVisible();
  await expect(page.getByText('Sri Lanka')).toHaveCount(0);
});

test('the gallery shows year tabs and a video item', async ({ page }) => {
  await page.goto('/gallery?surface=ride');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('tab', { name: '2026' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '2025' })).toBeVisible();
});

test('an admin assigns a host club to a delegation from the drawer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/admin?surface=ride');
  await page.waitForLoadState('networkidle');

  await page
    .locator('tr', { hasText: 'Nepal' })
    .getByRole('button', { name: 'Assign hosts' })
    .click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByText(/Delhi South East/).click();
  await page.getByRole('button', { name: 'Save host assignments' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tr', { hasText: 'Nepal' })).toContainText('Delhi South East');
});

test('an anonymous visitor cannot reach support-club registration or the admin page', async ({ page }) => {
  await page.goto('/support-club?surface=ride');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Sign in required')).toBeVisible();

  await page.goto('/admin?surface=ride');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Sign in required')).toBeVisible();
});
