import { test, expect } from '@playwright/test';

test('a user can sign in through the real login form: credentials, then email OTP, then the dashboard', async ({ page }) => {
  await page.goto('/portal/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Rotary ID or email', { exact: false }).fill('president@example.org');
  await page.getByLabel('Password', { exact: false }).fill('Correct-Horse-Battery-1');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Check your email')).toBeVisible();

  await page.getByLabel('6-digit code', { exact: false }).fill('417293');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/portal\/dashboard$/);
  await expect(page.getByText('Sign-in problem')).not.toBeVisible();
});

test('an invalid code is rejected without a 404 (the real second-factor endpoint responds)', async ({ page }) => {
  await page.goto('/portal/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Rotary ID or email', { exact: false }).fill('president@example.org');
  await page.getByLabel('Password', { exact: false }).fill('Correct-Horse-Battery-1');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Check your email')).toBeVisible();

  await page.getByLabel('6-digit code', { exact: false }).fill('000000');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('That code is not right')).toBeVisible();
  await expect(page).toHaveURL(/\/portal\/login$/);
});

test('an authenticator-app account signs in via TOTP, not the email-OTP path', async ({ page }) => {
  await page.goto('/portal/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Rotary ID or email', { exact: false }).fill('totp-user@example.com');
  await page.getByLabel('Password', { exact: false }).fill('Correct-Horse-Battery-1');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Enter your authenticator code')).toBeVisible();
  await expect(page.getByText('Check your email')).not.toBeVisible();
  await expect(page.getByText('Send it again')).not.toBeVisible();

  await page.getByLabel('6-digit code', { exact: false }).fill('654321');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/portal\/dashboard$/);
  await expect(page.getByText('Sign-in problem')).not.toBeVisible();
});
