import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = ['/dashboard?surface=drishti', '/beneficiaries?surface=drishti', '/surgeries?surface=drishti'];

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

test('the public dashboard renders without signing in and never shows patient names', async ({ page }) => {
  await page.goto('/dashboard?surface=drishti');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Project Drishti').first()).toBeVisible();
  await expect(page.getByText('Shroff Eye Hospital')).toBeVisible();
  await expect(page.getByText('Kamla Devi')).toHaveCount(0);
});

test('the beneficiaries list renders whatever phone string the API sends, never a client-side reveal', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/beneficiaries?surface=drishti');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Kamla Devi')).toBeVisible();
  await expect(page.getByText('•••1234')).toBeVisible();
  await expect(page.getByRole('button', { name: /reveal/i })).toHaveCount(0);
});

test('a district officer moves a patient to operated, entering surgery details', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/surgeries?surface=drishti');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Move to Operated' }).click();
  await page.getByLabel('Hospital', { exact: false }).fill('Centre for Sight');
  await page.getByLabel('Operated on', { exact: false }).fill('2026-08-25');
  await page.getByRole('button', { name: 'Confirm surgery and move' }).click();

  await expect(page.getByText('Operated · 2')).toBeVisible();
});
