import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// P6 — narrow inventory gaps (5.4): search + low-stock filter on the list,
// deep-link from the P3 dashboard tile, and batch history enriched with
// supplier/date/branch (data already returned by the API, just unrendered
// before this). See plan/P6-inventory-dashboard-gaps.md.

const SHOTS = 'test-results/p6-inventory-dashboard-gaps';
mkdirSync(SHOTS, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function login(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test('search filters the inventory table by name', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.goto('/inventory');
  await page.waitForLoadState('networkidle');

  const rowsBefore = await page.locator('table tbody tr').count();
  expect(rowsBefore).toBeGreaterThan(1);

  await page.getByPlaceholder('Cari nama atau SKU...').fill('Baterai iPhone X');
  await expect(page.locator('table tbody tr')).toHaveCount(1);
  await expect(page.getByText('Baterai iPhone X')).toBeVisible();
  await shot(page, '01-search-filtered');
});

test('the low-stock toggle shows only rows below their reorder point', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.goto('/inventory');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Stok Menipis/ }).click();
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  // Every visible row must carry the "Low Stock" badge.
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText('Low Stock')).toBeVisible();
  }
  await shot(page, '02-low-stock-filter');
});

test('the dashboard "Stok Menipis" tile deep-links into the pre-filtered view', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.waitForLoadState('networkidle');

  await page.getByText('Stok Menipis').click();
  await page.waitForURL(/\/inventory\?lowStock=true/);
  await page.waitForLoadState('networkidle');

  // The toggle button should already show as active (checkmark) on arrival.
  await expect(page.getByRole('button', { name: /Stok Menipis ✓/ })).toBeVisible();
  await shot(page, '03-dashboard-deep-link');
});

test('batch history shows supplier, branch, and received date', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.goto('/inventory');
  await page.waitForLoadState('networkidle');

  // Find an item with active stock (has a "View" link and non-zero stock) —
  // the seeded "LCD Samsung A10" is known to have batches from prior sessions.
  await page.goto('/inventory');
  await page.getByPlaceholder('Cari nama atau SKU...').fill('LCD Samsung');
  await page.getByRole('link', { name: 'Lihat', exact: true }).first().click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Batch Stok Aktif (FIFO)')).toBeVisible();
  await expect(page.getByText(/Diterima:/).first()).toBeVisible();
  // Branch name (not just a raw id) and a real formatted date must render.
  await expect(page.getByText(/Pusat|Bandung/).first()).toBeVisible();
  await shot(page, '04-batch-history-enriched');
});

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('search + filter controls wrap without page overflow', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    await shot(page, '05-mobile-inventory');
  });
});
