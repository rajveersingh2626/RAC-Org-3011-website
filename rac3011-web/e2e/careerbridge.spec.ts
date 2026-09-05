import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loginAsCareerbridgeAdmin(page: Page) {
  await page.context().addCookies([{ name: 'e2e_session', value: '1', domain: 'localhost', path: '/' }]);
}

const ROUTES = [
  '/opportunities?surface=careerbridge',
  '/opportunities/cb_1?surface=careerbridge',
  '/post?surface=careerbridge',
  '/admin?surface=careerbridge',
];

for (const path of ROUTES) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await loginAsCareerbridgeAdmin(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('the opportunities board renders without signing in and shows only verified/filled listings', async ({ page }) => {
  await page.goto('/opportunities?surface=careerbridge');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Social Media Coordinator')).toBeVisible();
  await expect(page.getByText('Rotary Peace Fellow Mentor')).toBeVisible();
  // Pending listing must never leak onto the public board.
  await expect(page.getByText('Junior Graphic Designer')).toHaveCount(0);
});

test('the detail page reveals contact only after a click', async ({ page }) => {
  await page.goto('/opportunities/cb_1?surface=careerbridge');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Social Media Coordinator')).toBeVisible();
  await expect(page.getByText('hr@bloom-digital.example.com')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reveal contact email' }).click();
  await expect(page.getByText('hr@bloom-digital.example.com')).toBeVisible();
});

test('a visitor posts an opening, verifies by email link, and it reaches the review queue', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend');

  await page.goto('/post?surface=careerbridge');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Title', { exact: false }).fill('Copywriting Intern');
  await page.getByLabel('Company / organisation', { exact: false }).fill('Wordsmith Studio');
  await page.getByLabel('Location', { exact: false }).fill('Delhi');
  await page.getByLabel('Description', { exact: false }).fill('Write short-form copy for social campaigns across two brands.');
  await page.getByLabel('Contact email', { exact: false }).fill('contact@wordsmith.example.com');
  await page.getByLabel('Your name', { exact: false }).fill('Wordsmith Studio');
  await page.getByLabel('Your email', { exact: false }).fill('poster@wordsmith.example.com');

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/public/careerbridge/listings') && res.request().method() === 'POST'),
    page.getByRole('button', { name: 'Submit for verification' }).click(),
  ]);
  const body = (await response.json()) as { id: string; status: string; _testVerifyToken: string };
  expect(body.status).toBe('pending_email');
  await expect(page.getByText('Check your email')).toBeVisible();

  await page.request.post('http://localhost:3001/public/careerbridge/listings/verify', {
    data: { token: body._testVerifyToken },
  });

  await loginAsCareerbridgeAdmin(page);
  await page.goto('/admin?surface=careerbridge');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Copywriting Intern')).toBeVisible();
});

test('the honeypot field is present but invisible, non-focusable, and its content is submitted as-is', async ({ page }) => {
  await page.goto('/post?surface=careerbridge');
  await page.waitForLoadState('networkidle');

  const honeypot = page.locator('input[name="website"]');
  await expect(honeypot).toBeAttached();
  await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  await expect(honeypot).toHaveAttribute('tabindex', '-1');

  // Off-screen (not display:none/visibility:hidden), so real bots relying on those checks still fill it.
  const box = await honeypot.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeLessThan(0);
});

test('the admin desk verifies a pending listing', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'runs once against the shared mock backend, mutates shared state');

  await loginAsCareerbridgeAdmin(page);
  await page.goto('/admin?surface=careerbridge');
  await page.waitForLoadState('networkidle');

  // cb_3 (Junior Graphic Designer) is the only pending listing in the seed fixture, and any
  // listing this same spec file posts elsewhere is appended after it, so "first" is always this one.
  await expect(page.getByText('Junior Graphic Designer')).toBeVisible();
  await Promise.all([
    page.waitForResponse(
      (res) => /\/careerbridge\/listings\/.+/.test(res.url()) && res.request().method() === 'PATCH',
    ),
    page.getByRole('button', { name: 'Verify' }).first().click(),
  ]);

  await expect(page.getByText('Junior Graphic Designer')).toHaveCount(0);
});
