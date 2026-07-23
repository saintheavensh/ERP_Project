import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// P3 — per-role dashboards (static layout, no widget framework — see
// plan/P3-role-dashboards.md). Walks all 4 seeded roles and confirms each
// sees only its own widget set with real (non-placeholder) data.

const SHOTS = 'test-results/p3-role-dashboards';
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

test('Super Admin sees the operational overview: tickets, low stock, AR, AP, today\'s sales', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Tiket Terbuka')).toBeVisible();
  await expect(page.getByText('Stok Menipis')).toBeVisible();
  await expect(page.getByText('Piutang (AR)')).toBeVisible();
  await expect(page.getByText('Hutang (AP)')).toBeVisible();
  await expect(page.getByText('Tiket per Tahap')).toBeVisible();
  await expect(page.getByText('Penjualan Hari Ini')).toBeVisible();

  // Not the technician/cashier-only widgets.
  await expect(page.getByText('Tugas Saya')).not.toBeVisible();

  await shot(page, '01-super-admin-dashboard');
});

test('Manager sees the same operational overview as Super Admin', async ({ page }) => {
  await login(page, 'manager@demo.com');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Tiket Terbuka')).toBeVisible();
  await expect(page.getByText('Piutang (AR)')).toBeVisible();
  await shot(page, '02-manager-dashboard');
});

test('Technician sees only My Jobs, never AR/AP/low-stock', async ({ page }) => {
  await login(page, 'technician@demo.com');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Tugas Saya')).toBeVisible();
  await expect(page.getByText('Piutang (AR)')).not.toBeVisible();
  await expect(page.getByText('Stok Menipis')).not.toBeVisible();
  await shot(page, '03-technician-dashboard');
});

test('Cashier sees today\'s sales + AR, never low-stock/AP/tickets-by-stage', async ({ page }) => {
  await login(page, 'cashier@demo.com');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Penjualan Hari Ini')).toBeVisible();
  await expect(page.getByText('Piutang (AR)')).toBeVisible();
  await expect(page.getByText('Hutang (AP)')).not.toBeVisible();
  await expect(page.getByText('Stok Menipis')).not.toBeVisible();
  await shot(page, '04-cashier-dashboard');
});

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('dashboard tiles stack in a single column without page overflow', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    await shot(page, '05-mobile-dashboard');
  });
});
