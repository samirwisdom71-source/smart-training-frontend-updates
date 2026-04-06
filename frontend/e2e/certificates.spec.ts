import { test, expect } from '@playwright/test';

test.describe('Certificate visibility flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email|e-mail/i }).fill('admin@smarttraining.com');
    await page.getByRole('textbox', { name: /password/i }).fill('Admin@123');
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('can navigate to certificates page', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page).toHaveURL(/\/certificates/);
    await expect(page.getByRole('heading', { level: 1, name: /certificates/i })).toBeVisible({ timeout: 5000 });
  });
});
