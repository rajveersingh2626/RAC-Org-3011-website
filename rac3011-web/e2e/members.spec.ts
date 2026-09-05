import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const PUBLIC_ROUTES = ['/portal/register', '/portal/pending'];
const AUTHED_ROUTES = ['/portal/me', '/portal/me/profile', '/portal/me/settings', '/portal/directory', '/portal/my-club', '/portal/members'];

for (const path of PUBLIC_ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

for (const path of AUTHED_ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await loginAsClubOfficer(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('a visitor can register and lands on the pending screen', async ({ page }) => {
  await page.goto('/portal/register');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Full name', { exact: false }).fill('Sana Qureshi');
  await page.getByLabel('Email', { exact: false }).fill(`sana-${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: false }).fill('Correct-Horse-Battery-1');
  await page.getByLabel('Club', { exact: false }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/portal\/pending$/);
  await expect(page.getByText('Almost there')).toBeVisible();
});

test('a president approves a pending member from the admin members screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/portal/members');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('WAITING FOR APPROVAL', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('WAITING FOR APPROVAL', { exact: false })).not.toBeVisible();
  await expect(page.getByText('APPROVED', { exact: false }).first()).toBeVisible();
});

test('the directory shows a privacy gate before revealing opted-in members', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend (privacy acceptance is global here)');
  await loginAsClubOfficer(page);
  await page.goto('/portal/directory');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Read the privacy policy first')).toBeVisible();
  await page.getByRole('button', { name: 'I accept, show me the directory' }).click();
  await expect(page.getByText('Aman Verma')).toBeVisible();
});

test('the membership card and QR render on the Me overview page', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/portal/me');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('3011-DSE-0114')).toBeVisible();
  await expect(page.getByAltText('Your check-in QR code')).toBeVisible();
});
