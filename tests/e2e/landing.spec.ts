import { test, expect } from '@playwright/test';

test('landing page loads with hero and nav', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Projex/);
  await expect(page.getByRole('link', { name: 'Projex' }).first()).toBeVisible();
});

test('unauthenticated visitor to /access is redirected to /login', async ({ page }) => {
  await page.goto('/access');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders sign in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible();
});
