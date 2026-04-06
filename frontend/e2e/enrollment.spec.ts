import { test, expect } from '@playwright/test';

test.describe('Training enrollment flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email|e-mail/i }).fill('admin@smarttraining.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Admin@123');
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('can navigate to enrollments page', async ({ page }) => {
    await page.goto('/enrollments');
    await expect(page).toHaveURL(/\/enrollments/);
    await expect(page.getByRole('heading', { level: 1, name: /enrollments/i })).toBeVisible({ timeout: 5000 });
  });
});
