import { test, expect, type Page } from '@playwright/test';

// Printer scan-and-pick (6C follow-up, requested after 6C shipped): the
// win32 connection type lets the Settings UI ask the LOCAL agent
// (127.0.0.1:9100 -- same one PrintButton already talks to) which Windows
// printers are installed, so the admin picks a name instead of typing a USB
// vendor/product ID or IP address. PrinterScanPicker.svelte is the component
// under test here; PrinterTab.svelte only conditionally renders it.

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function openAddDeviceModal(page: Page) {
  await login(page);
  await page.goto('/settings?tab=printers');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '+ Tambah Printer' }).click();
  await page.locator('#device-connection').selectOption('win32');
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('win32 connection type reveals the scan button and relabels the address field', async ({ page }) => {
    await openAddDeviceModal(page);
    await expect(page.getByTestId('scan-printers-button')).toBeVisible();
    await expect(page.locator('label[for="device-address"]')).toHaveText('Nama Printer Windows');
  });

  test('scan degrades gracefully when no local agent is running (the real default in CI)', async ({ page }) => {
    await openAddDeviceModal(page);
    await page.getByTestId('scan-printers-button').click();
    await expect(page.getByText('Agent printer tidak terdeteksi')).toBeVisible({ timeout: 10_000 });
  });

  test('scan lists detected printers; picking one fills the address field and confirms', async ({ page }) => {
    await page.route('http://127.0.0.1:9100/printers', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { name: 'POS-80', driver: 'POS-80 11.3.0.0', port: 'USB001', isDefault: true, recommended: true },
            { name: 'Microsoft Print to PDF', driver: 'Microsoft Print To PDF', port: 'PORTPROMPT:', isDefault: false, recommended: false },
          ],
        }),
      })
    );
    let configPostBody: unknown = null;
    await page.route('http://127.0.0.1:9100/config', (route) => {
      if (route.request().method() === 'POST') {
        configPostBody = route.request().postDataJSON();
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'saved' }) });
    });

    await openAddDeviceModal(page);
    await page.getByTestId('scan-printers-button').click();

    const list = page.getByTestId('scanned-printers-list');
    await expect(list).toBeVisible();
    await expect(list.getByText('POS-80')).toBeVisible();
    await expect(list.getByText('disarankan')).toBeVisible();
    await expect(list.getByText('Microsoft Print to PDF')).toBeVisible();

    await list.getByText('POS-80').click();

    await expect(page.locator('#device-address')).toHaveValue('POS-80');
    await expect(page.getByTestId('picked-printer-confirmation')).toContainText('POS-80');
    // Picking also auto-fills the still-empty device name field.
    await expect(page.locator('#device-name')).toHaveValue('POS-80');

    await expect.poll(() => configPostBody).toEqual({ mode: 'win32', win32: { printerName: 'POS-80' } });
  });

  test('picking a printer does not overwrite an already-typed device name', async ({ page }) => {
    await page.route('http://127.0.0.1:9100/printers', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ name: 'POS-80', driver: 'POS-80', port: 'USB001', isDefault: true, recommended: true }] }),
      })
    );
    await page.route('http://127.0.0.1:9100/config', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'saved' }) })
    );

    await openAddDeviceModal(page);
    await page.locator('#device-name').fill('Kasir Depan');
    await page.getByTestId('scan-printers-button').click();
    await page.getByTestId('scanned-printers-list').getByText('POS-80').click();

    await expect(page.locator('#device-address')).toHaveValue('POS-80');
    await expect(page.locator('#device-name')).toHaveValue('Kasir Depan');
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('scan picker does not overflow the modal', async ({ page }) => {
    await page.route('http://127.0.0.1:9100/printers', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ name: 'POS-80', driver: 'POS-80', port: 'USB001', isDefault: true, recommended: true }] }),
      })
    );

    await openAddDeviceModal(page);
    await page.getByTestId('scan-printers-button').click();
    await expect(page.getByTestId('scanned-printers-list')).toBeVisible();

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
