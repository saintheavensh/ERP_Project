import { test, expect, type Page } from '@playwright/test';

// 6B.2-6B.4 — Cetak flow (plan/phase-6-printer.md). PrintButton fetches the
// real render (6A.4) and shows ThermalPreview (58/80mm) or A4Invoice (A4)
// depending on the resolved paperSize -- never both, per spec rule 2.

const API = 'http://localhost:3001/v1';

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function createInvoice(page: Page, description: string): Promise<string> {
  const loginRes = await page.request.post(`${API}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data: authData } = await loginRes.json();
  const res = await page.request.post(`${API}/pos/invoices`, {
    headers: { Authorization: `Bearer ${authData.token}` },
    data: {
      branchId: 'b0000000-0000-4000-8000-000000000001',
      customerName: 'E2E Print Customer',
      paymentMethod: 'cash',
      discountAmount: 0,
      items: [{ sourceType: 'fee', description, quantity: 1, unitPrice: 275000 }],
    },
  });
  const { data } = await res.json();
  return data.invoiceNumber;
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Cetak Struk shows the thermal preview at the branch\'s assigned paper size', async ({ page }) => {
    const invoiceNumber = await createInvoice(page, 'Jasa Cetak Struk E2E');
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');

    await page.locator('tr', { hasText: invoiceNumber }).click();
    await page.getByRole('button', { name: 'Cetak Struk' }).click();

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute('data-paper-size', '80mm');
    await expect(preview).toContainText('Jasa Cetak Struk E2E');
    await expect(preview).toContainText('275.000');
  });

  test('Cetak Invoice A4 shows the A4 layout, not the thermal blocks', async ({ page }) => {
    const invoiceNumber = await createInvoice(page, 'Jasa Cetak A4 E2E');
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');

    await page.locator('tr', { hasText: invoiceNumber }).click();
    await page.getByRole('button', { name: 'Cetak Invoice A4' }).click();

    await expect(page.getByTestId('a4-invoice')).toBeVisible();
    await expect(page.getByTestId('thermal-preview')).toHaveCount(0);
    await expect(page.getByTestId('a4-invoice')).toContainText('Jasa Cetak A4 E2E');
    await expect(page.getByTestId('a4-invoice')).toContainText('INVOICE');
  });

  test('Kirim ke Printer degrades gracefully when no local agent is running', async ({ page }) => {
    const invoiceNumber = await createInvoice(page, 'Jasa Cetak Offline E2E');
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');

    await page.locator('tr', { hasText: invoiceNumber }).click();
    await page.getByRole('button', { name: 'Cetak Struk' }).click();
    await expect(page.getByTestId('thermal-preview')).toBeVisible();

    await page.getByTestId('send-to-agent').click();
    await expect(page.getByTestId('agent-status')).toContainText('tidak terdeteksi', { timeout: 10_000 });
  });

  test('Cetak (Print Dialog) invokes window.print() for A4', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__printCalled = false;
      window.print = () => { (window as any).__printCalled = true; };
    });

    const invoiceNumber = await createInvoice(page, 'Jasa Print Dialog E2E');
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');

    await page.locator('tr', { hasText: invoiceNumber }).click();
    await page.getByRole('button', { name: 'Cetak Invoice A4' }).click();
    await expect(page.getByTestId('a4-invoice')).toBeVisible();

    await page.getByRole('button', { name: 'Cetak (Print Dialog)' }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__printCalled)).toBe(true);
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('print modal does not overflow', async ({ page }) => {
    const invoiceNumber = await createInvoice(page, 'Jasa Cetak Mobile E2E');
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');

    await page.locator('tr', { hasText: invoiceNumber }).click();
    await page.getByRole('button', { name: 'Cetak Struk' }).click();
    await expect(page.getByTestId('thermal-preview')).toBeVisible();

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
