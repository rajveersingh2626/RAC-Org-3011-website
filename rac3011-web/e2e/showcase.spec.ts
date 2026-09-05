import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsClubOfficer(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = ['/portal/showcase/submit', '/portal/showcase/mine'];

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

test('a member can save a draft, then see it in their own list', async ({ page }, testInfo) => {
  // the mock API's project store is shared across all projects; only create once so the count stays predictable
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');
  await loginAsClubOfficer(page);
  await page.goto('/portal/showcase/submit');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/What did the club do\?/).fill('Digital literacy lab handover');
  await page.getByLabel('When').fill('2026-08-19');
  await page.getByLabel('Area of focus').selectOption('Basic Education');
  await page.getByLabel(/Tell us what happened/).fill('Handed over a refurbished computer lab to a government school.');
  await page.getByRole('button', { name: 'Save a draft' }).click();

  await expect(page).toHaveURL(/\/portal\/showcase\/mine/);
  await expect(page.getByText('Digital literacy lab handover').first()).toBeVisible();
});

test('sending for review without the consent tick is blocked client-side', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/portal/showcase/submit');
  await page.waitForLoadState('networkidle');

  await page.getByLabel(/What did the club do\?/).fill('Yamuna bank clean-up');
  await page.getByLabel('When').fill('2026-08-17');
  await page.getByLabel('Area of focus').selectOption('Environment');
  await page.getByLabel(/Tell us what happened/).fill('A joint clean-up drive along the Yamuna floodplain.');
  await page.getByRole('button', { name: 'Send for review' }).click();

  await expect(page.getByText('Confirm consent before sending for review')).toBeVisible();
  await expect(page).toHaveURL(/\/portal\/showcase\/submit/);
});

test('the moderation queue is unreachable for a member without showcase:publish (control hidden and route forbidden)', async ({ page }) => {
  await loginAsClubOfficer(page);
  await page.goto('/portal/dashboard');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('link', { name: 'Showcase queue' })).toHaveCount(0);

  await page.goto('/portal/admin/showcase');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText("You don't have access to this page")).toBeVisible();
  await expect(page.getByText('projects waiting to be published')).toHaveCount(0);
});
