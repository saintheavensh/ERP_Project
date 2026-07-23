import { test, expect, type Page } from '@playwright/test';

// P10 — Product Catalog (plan/P7-plus-phase5-completion-plan.md P10.1-P10.3).
// Browse-by-category card grid at /inventory/catalog, plus a supplier
// price-comparison table on the item detail page (productSuppliers, seeded
// but previously surfaced nowhere).

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('catalog page groups items by category and links to detail', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/catalog');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Katalog Produk' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'LCD & Touchscreen' })).toBeVisible();

    const card = page.locator('a[href^="/inventory/"]', { hasText: 'LCD Samsung A10' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForURL(/\/inventory\/[0-9a-f-]+$/);
    await expect(page.locator('body')).toContainText('LCD Samsung A10');
  });

  test('search filters the card grid', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/catalog');
    await page.waitForLoadState('networkidle');

    const initialCount = await page.locator('a[href^="/inventory/"]').count();
    await page.getByPlaceholder('Cari nama atau SKU...').fill('LCD Samsung A10');
    await page.waitForTimeout(200);
    const filteredCount = await page.locator('a[href^="/inventory/"]').count();
    expect(filteredCount).toBeLessThan(initialCount);
    await expect(page.getByText('LCD Samsung A10')).toBeVisible();
  });

  test('category dropdown filters to a single group', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/catalog');
    await page.waitForLoadState('networkidle');

    await page.getByRole('combobox').selectOption({ label: 'LCD & Touchscreen' });
    await page.waitForTimeout(200);
    await expect(page.locator('h2', { hasText: 'LCD & Touchscreen' })).toBeVisible();
    // Only the selected category's section should render.
    await expect(page.locator('h2')).toHaveCount(1);
  });

  test('item detail shows both suppliers with the primary one badged', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/30000000-0000-4000-8000-000000000001');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Perbandingan Harga Supplier')).toBeVisible();
    const comparisonSection = page.getByTestId('supplier-comparison');
    await expect(comparisonSection.getByRole('link', { name: 'Supplier A (Tunai)' })).toBeVisible();
    await expect(comparisonSection.getByRole('link', { name: 'Supplier B (Tempo 30 Hari)' })).toBeVisible();
    await expect(comparisonSection.getByText('Rp 150.000')).toBeVisible();
    await expect(comparisonSection.getByText('Rp 165.000')).toBeVisible();
    await expect(comparisonSection.getByText('Utama')).toBeVisible();
  });

  test('list view still links to the catalog view', async ({ page }) => {
    await login(page);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Lihat sebagai Katalog' }).click();
    await page.waitForURL(/\/inventory\/catalog/);
    await expect(page.getByRole('heading', { name: 'Katalog Produk' })).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('catalog page and item detail with supplier table never overflow', async ({ page }) => {
    await login(page);

    await page.goto('/inventory/catalog');
    await page.waitForLoadState('networkidle');
    let bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);

    await page.goto('/inventory/30000000-0000-4000-8000-000000000001');
    await page.waitForLoadState('networkidle');
    bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    await expect(page.getByTestId('supplier-comparison')).toBeVisible();
  });
});
