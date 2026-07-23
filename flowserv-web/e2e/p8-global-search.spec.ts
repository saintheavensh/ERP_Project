import { test, expect, type Page } from '@playwright/test';

// P8 — Global Search (plan/P7-plus-phase5-completion-plan.md P8.1-P8.3).
// Desktop: inline input + dropdown in the header. Mobile: icon that expands
// into a full-screen overlay. Both hit the same GET /v1/search endpoint.

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test.describe('desktop (1280x800) — inline search', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('typing a known customer name shows grouped results and navigates on click', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await expect(input).toBeVisible();
    await input.fill('budi');

    // Wait for the debounced fetch + dropdown to render a result group.
    await expect(page.getByText('Pelanggan', { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Tiket', { exact: true })).toBeVisible();
    await expect(page.getByText('Budi Santoso', { exact: true }).first()).toBeVisible();

    await page.getByText('Budi Santoso', { exact: true }).first().click();
    await page.waitForURL(/\/customers\//);
    await expect(page.locator('body')).toContainText('Budi Santoso');
  });

  test('typing an inventory SKU finds the item and navigates to its detail page', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('BAT-IPH');

    await expect(page.getByText('Barang', { exact: true })).toBeVisible({ timeout: 5_000 });
    const resultButton = page.locator('button', { hasText: 'Baterai iPhone X' }).first();
    await expect(resultButton).toBeVisible();
    await resultButton.click();
    await page.waitForURL(/\/inventory\//);
  });

  test('a single character shows the "type more" hint, not a network call result', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('b');
    await page.waitForTimeout(400);
    await expect(page.getByText('Tidak ada hasil.')).not.toBeVisible();
  });

  test('clicking outside the dropdown closes it', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('budi');
    await expect(page.getByText('Pelanggan', { exact: true })).toBeVisible({ timeout: 5_000 });

    // Click far outside both the dropdown and the sidebar (which sits above
    // the backdrop, z-index-wise, on the left edge of the page).
    await page.mouse.click(1250, 500);
    await expect(page.getByText('Pelanggan', { exact: true })).not.toBeVisible();
  });
});

test.describe('mobile (375x667) — overlay search', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('search icon opens a full-screen overlay; typing finds a supplier; Batal closes it', async ({ page }) => {
    await login(page);

    // The inline desktop input is hidden below sm; only the icon renders.
    await expect(page.locator('input[placeholder^="Cari pelanggan"]')).toBeHidden();

    await page.getByLabel('Open search').click();
    const overlayInput = page.locator('input[placeholder="Cari..."]');
    await expect(overlayInput).toBeVisible();

    // The overlay itself must never force horizontal scroll.
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);

    await overlayInput.fill('supplier a');
    await expect(page.getByText('Supplier', { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Supplier A (Tunai)').first()).toBeVisible();

    await page.getByText('Batal').click();
    await expect(overlayInput).toBeHidden();
  });

  test('selecting a mobile result navigates and closes the overlay', async ({ page }) => {
    await login(page);

    await page.getByLabel('Open search').click();
    const overlayInput = page.locator('input[placeholder="Cari..."]');
    await overlayInput.fill('budi');
    await expect(page.getByText('Budi Santoso', { exact: true }).first()).toBeVisible({ timeout: 5_000 });

    await page.getByText('Budi Santoso', { exact: true }).first().click();
    await page.waitForURL(/\/customers\//);
    await expect(overlayInput).toBeHidden();
  });
});
