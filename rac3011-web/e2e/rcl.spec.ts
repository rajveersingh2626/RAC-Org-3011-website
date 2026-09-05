import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = ['/standings?surface=rcl', '/fixtures?surface=rcl', '/register?surface=rcl'];

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

test('the standings table renders rows in exactly the order the server returns, without re-sorting client-side', async ({ page }) => {
  await page.goto('/standings?surface=rcl');
  await page.waitForLoadState('networkidle');

  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(3);
  // Fixture data deliberately lists Saket (2 pts) before Agni (4 pts): a naive client-side
  // resort by points would flip this order, so asserting it stays put proves we trust the server.
  await expect(rows.nth(0)).toContainText('Saket Warriors');
  await expect(rows.nth(1)).toContainText('Agni Strikers');
  await expect(rows.nth(2)).toContainText('Delhi South East Strikers');
  await expect(rows.nth(1)).toContainText('+1.50');
  await expect(rows.nth(2)).toContainText('-1.50');
});

test('the fixtures page shows the schedule without signing in', async ({ page }) => {
  await page.goto('/fixtures?surface=rcl');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Agni Strikers').first()).toBeVisible();
  await expect(page.getByText('Saket Warriors').first()).toBeVisible();
  await expect(page.getByText('Thyagaraj Sports Complex')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter result' })).toHaveCount(0);
});

test('a league admin enters a result for a scheduled fixture', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/fixtures?surface=rcl');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Enter result' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Runs', { exact: false }).first().fill('150');
  await dialog.getByLabel('Wickets', { exact: false }).first().fill('5');
  await dialog.getByLabel('Overs faced', { exact: false }).first().fill('20');
  await dialog.getByLabel('Runs', { exact: false }).nth(1).fill('120');
  await dialog.getByLabel('Wickets', { exact: false }).nth(1).fill('8');
  await dialog.getByLabel('Overs faced', { exact: false }).nth(1).fill('20');
  await page.getByRole('button', { name: 'Save result' }).click();

  await expect(page.getByText('150/5 (20)')).toBeVisible();
  await expect(page.getByText('Agni Strikers won')).toBeVisible();
});

test('the register page shows a create form for a club with no team yet, then registers one', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/register?surface=rcl');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Register a team').first()).toBeVisible();

  await page.getByLabel('Team name', { exact: false }).fill('Delhi South East Strikers');
  await page.getByLabel('Captain name', { exact: false }).fill('Rahul Bansal');
  await page.getByLabel('Captain phone', { exact: false }).fill('+919810000099');
  await page.getByLabel('Player 1 name', { exact: false }).fill('Rahul Bansal');
  await page.getByRole('button', { name: 'Register this team' }).click();

  await expect(page.getByText('Manage your team').first()).toBeVisible();
  await expect(page.getByLabel('Team name', { exact: false })).toHaveValue('Delhi South East Strikers');
});

test('the roster stops accepting new players once it reaches the 15-player cap', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/register?surface=rcl');
  await page.waitForLoadState('networkidle');

  const addButton = page.getByRole('button', { name: 'Add player' });
  for (let i = 0; i < 20; i += 1) {
    if (await addButton.isDisabled()) break;
    await addButton.click();
  }

  await expect(addButton).toBeDisabled();
  await expect(page.getByText(/15 \/ 15/)).toBeVisible();
});
