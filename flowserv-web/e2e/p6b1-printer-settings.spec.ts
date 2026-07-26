import { test, expect, type Page } from '@playwright/test';

// 6B.1 — Printer Settings tab (plan/phase-6-printer.md). Devices CRUD,
// read-only template list (WYSIWYG editor is a Phase 7 task), and the
// assignment matrix over the real /v1/printer/* endpoints built in 6A.3/6A.4.

const BRANCH_CABANG = 'b0000000-0000-4000-8000-000000000002';

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

  test('printers tab: shows seeded devices and templates', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=printers');
    await page.waitForLoadState('networkidle');

    const devicesTable = page.getByTestId('printer-devices-table');
    await expect(devicesTable.getByText('Epson TM-T82 - Kasir Pusat')).toBeVisible();
    await expect(devicesTable.getByText('Epson TM-T20 - Kasir Cabang')).toBeVisible();
    await expect(devicesTable.getByText('Printer Kantor (OS) - Pusat')).toBeVisible();

    const templatesTable = page.getByTestId('printer-templates-table');
    await expect(templatesTable.getByText('Struk Default 80mm')).toBeVisible();
    await expect(templatesTable.getByText('Invoice Resmi A4')).toBeVisible();
  });

  test('assignment matrix: Pusat receipt is assigned; Cabang invoice_a4 is not (seed asymmetry)', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=printers');
    await page.waitForLoadState('networkidle');

    const cabangInvoiceA4Cell = page.getByTestId(`assign-cell-${BRANCH_CABANG}-invoice_a4`);
    await expect(cabangInvoiceA4Cell.getByText('Belum diatur')).toBeVisible();

    const matrix = page.getByTestId('printer-assignment-matrix');
    const pusatRow = matrix.locator('tr', { hasText: 'Pusat (Headquarter)' });
    await expect(pusatRow.getByText('Epson TM-T82 - Kasir Pusat')).toBeVisible();
  });

  test('devices: creates a printer, then edits its name', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=printers');
    await page.waitForLoadState('networkidle');

    const deviceName = `E2E Test Printer ${Date.now()}`;
    await page.getByRole('button', { name: '+ Tambah Printer' }).click();
    await page.locator('#device-name').fill(deviceName);
    await page.locator('#device-connection').selectOption('network');
    await page.locator('#device-address').fill('192.168.1.99');
    await page.locator('#device-paper').selectOption('80mm');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    const devicesTable = page.getByTestId('printer-devices-table');
    let row = devicesTable.locator('tr', { hasText: deviceName });
    await expect(row).toBeVisible();
    await expect(row.getByText('Jaringan')).toBeVisible();

    const updatedName = `${deviceName} (Diperbarui)`;
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#edit-device-name').fill(updatedName);
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await page.waitForLoadState('networkidle');

    row = devicesTable.locator('tr', { hasText: updatedName });
    await expect(row).toBeVisible();
  });

  test('assignment matrix: sets Cabang invoice_a4 from "Belum diatur" to a real assignment', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=printers');
    await page.waitForLoadState('networkidle');

    // Cabang has no A4-capable device in the seed -- create one first.
    const deviceName = `E2E A4 Cabang ${Date.now()}`;
    await page.getByRole('button', { name: '+ Tambah Printer' }).click();
    await page.locator('#device-branch').selectOption({ label: 'Cabang Bandung' });
    await page.locator('#device-name').fill(deviceName);
    await page.locator('#device-connection').selectOption('os_printer');
    await page.locator('#device-paper').selectOption('A4');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    const cell = page.getByTestId(`assign-cell-${BRANCH_CABANG}-invoice_a4`);
    await expect(cell.getByText('Belum diatur')).toBeVisible();
    await cell.getByRole('button', { name: 'Atur' }).click();

    await page.locator('#assign-device').selectOption({ label: `${deviceName} (A4)` });
    // Template dropdown auto-filters to invoice_a4 + A4 -- only one option seeded.
    await page.locator('#assign-template').selectOption({ label: 'Invoice Resmi A4' });
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId(`assign-cell-${BRANCH_CABANG}-invoice_a4`).getByText(deviceName)).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('printers tab does not overflow', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=printers');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
