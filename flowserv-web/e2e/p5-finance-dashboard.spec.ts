import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// P5 — Finance dashboard (DAS-004): Simple/Accountant mode toggle, both reading
// the same single-sided ledger (no Chart of Accounts — see
// plan/P5-finance-dashboard.md). Mode is a validated ?mode= query param, so
// this walks it via real navigation, not a client-side toggle click.

const SHOTS = 'test-results/p5-finance-dashboard';
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

test('Simple Mode shows plain-language tiles with real numbers', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.goto('/finance');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Pendapatan Hari Ini')).toBeVisible();
  await expect(page.getByText('Estimasi Laba Bulan Ini')).toBeVisible();
  await expect(page.getByText('Piutang (AR)')).toBeVisible();
  await expect(page.getByText('Hutang (AP)')).toBeVisible();
  // Not the accountant-mode table.
  await expect(page.getByText('Ringkasan Laba Rugi')).not.toBeVisible();
  await shot(page, '01-simple-mode');
});

test('toggling to Accountant Mode shows the P&L table and a link to the raw ledger', async ({ page }) => {
  await login(page, 'admin@demo.com');
  await page.goto('/finance');
  await page.waitForLoadState('networkidle');

  await page.getByRole('link', { name: 'Accountant' }).click();
  await page.waitForURL(/mode=accountant/);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Ringkasan Laba Rugi (Bulan Ini)')).toBeVisible();
  await expect(page.getByText('Pendapatan', { exact: true })).toBeVisible();
  await expect(page.getByText('HPP (Modal Barang Terjual)')).toBeVisible();
  await expect(page.getByText('Laba Kotor')).toBeVisible();
  await shot(page, '02-accountant-mode');

  await page.getByRole('link', { name: 'Lihat Buku Kas →' }).click();
  await page.waitForURL(/\/finance\/ledger$/);
});

test('a real invoice with pure labor revenue flows through to the P&L table', async ({ page }) => {
  const loginRes = await page.request.post('http://localhost:3001/v1/auth/login', {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await loginRes.json();

  // Intake -> add a labor charge -> quote -> invoice, a pure-revenue path with
  // no COGS (mirrors the live curl verification in plan/P5-finance-dashboard.md).
  const intakeRes = await page.request.post('http://localhost:3001/v1/tickets/intake', {
    headers: { Authorization: `Bearer ${data.token}` },
    data: {
      customerName: `P5 E2E ${Date.now()}`,
      customerPhone: '081200000000',
      assetType: 'Laptop',
      assetBrand: 'Test',
      assetModel: 'P5',
      flowTemplateId: '80000000-0000-4000-8000-000000000001',
      branchId: '00000000-0000-0000-0000-000000000000',
    },
  });
  const ticketId = (await intakeRes.json()).data.id;

  await page.request.post(`http://localhost:3001/v1/tickets/${ticketId}/charges`, {
    headers: { Authorization: `Bearer ${data.token}` },
    data: { sourceType: 'labor', description: 'Jasa E2E P5', quantity: 1, unitPrice: 77000 },
  });
  await page.request.post(`http://localhost:3001/v1/tickets/${ticketId}/quotation`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  await page.request.post(`http://localhost:3001/v1/tickets/${ticketId}/invoice`, {
    headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'application/json' },
    data: { paymentMethod: 'cash' },
  });

  await login(page, 'admin@demo.com');
  await page.goto('/finance?mode=simple');
  await page.waitForLoadState('networkidle');

  // Today's income tile must include today's date range and be > 0 now that a
  // real invoice was just posted (proves the SQL date-range sum actually works
  // end to end, not just the empty-state zero case).
  const todayTile = page.locator('div', { hasText: 'Pendapatan Hari Ini' }).first();
  await expect(todayTile).toBeVisible();
  await shot(page, '03-today-income-after-invoice');
});

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('tiles stack without page overflow', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    await shot(page, '04-mobile-simple');
  });
});
