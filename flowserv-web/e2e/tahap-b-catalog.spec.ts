import { test, expect, type Page } from '@playwright/test';

// Tahap-B — read-only product catalog for cashier & technician. They only need
// to look up a part's price + stock; they must NOT edit the owner-set price, and
// the heavy admin item-detail page is not needed. This proves both roles can
// reach /catalog, search it, see price + stock, and that the cards are NOT links
// into the admin detail page.

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

  test('cashier can open the catalog from the menu, see price + stock, and it is read-only', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    // The menu link exists for a cashier.
    await expect(page.getByRole('link', { name: 'Katalog Produk' })).toBeVisible();
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Katalog Produk' })).toBeVisible();
    // Seeded parts render with price + stock.
    await expect(page.getByText('Baterai iPhone X')).toBeVisible();
    await expect(page.getByText('LCD Samsung A10')).toBeVisible();
    await expect(page.getByText(/Rp\s?300\.000/).first()).toBeVisible(); // selling price
    await expect(page.getByText(/Stok/).first()).toBeVisible();

    // Read-only: no drill-down link into the admin item-detail page, and no
    // edit/price controls.
    await expect(page.locator('a[href^="/inventory/"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /edit|ubah|simpan|hapus/i })).toHaveCount(0);
  });

  test('catalog search filters by part name', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('catalog-search').fill('Baterai');
    await expect(page.getByText('Baterai iPhone X')).toBeVisible();
    await expect(page.getByText('LCD Samsung A10')).toHaveCount(0);

    await page.getByTestId('catalog-search').fill('zzz-tidak-ada');
    await expect(page.getByText('Tidak ada produk yang cocok')).toBeVisible();
  });

  test('technician also has read-only catalog access', async ({ page }) => {
    await login(page, 'technician@demo.com');
    await expect(page.getByRole('link', { name: 'Katalog Produk' })).toBeVisible();
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Baterai iPhone X')).toBeVisible();
    await expect(page.locator('a[href^="/inventory/"]')).toHaveCount(0);
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('catalog does not overflow on a phone', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Baterai iPhone X')).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
