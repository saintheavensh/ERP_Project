import { test, expect, type Page } from '@playwright/test';

// D2 (go-live tahap-B) — discount limit per role. Pilot rule: only manager/owner
// may apply a discount; a cashier may not. The backend enforces it
// (pos.apply_discount, 403 when discountAmount > 0) — verified live via curl.
// This proves the cart hides the discount field for a cashier and shows it for
// a manager, so a cashier is never shown a control that would 403.

async function login(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('cashier does NOT see the discount field on the POS cart', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    // The cart summary (Subtotal/Total) is always present; the discount row is not.
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByTestId('discount-row')).toHaveCount(0);
  });

  test('manager DOES see the discount field on the POS cart', async ({ page }) => {
    await login(page, 'manager@demo.com');
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('discount-row')).toBeVisible();
  });
});
