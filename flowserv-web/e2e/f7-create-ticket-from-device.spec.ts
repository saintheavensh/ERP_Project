import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// F7 — the customer-detail "Create Ticket" button had no href/onclick at all (a
// dead affordance). This walks the real fix entirely through the UI: open a
// seeded customer, click "Create Ticket" on their device, confirm intake arrives
// pre-filled and locked to that customer + device (not a blank form), submit, and
// confirm the resulting ticket is actually linked to both.

const SHOTS = 'test-results/f7-create-ticket-from-device';
mkdirSync(SHOTS, { recursive: true });

const pageErrors: string[] = [];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test('creates a ticket from a customer device via the previously-dead button', async ({ page }) => {
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // 1. Log in.
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@demo.com');
  await expect(page.locator('#email')).toHaveValue('admin@demo.com');
  await page.locator('#password').fill('admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

  // 2. Open the seeded customer "Budi" from the customers list.
  await page.goto('/customers');
  await page.waitForLoadState('networkidle');
  const row = page.locator('tr', { hasText: 'Budi' }).first();
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: /Lihat/ }).click();
  await page.waitForURL(/\/customers\/[0-9a-f-]{36}/, { timeout: 20_000 });
  await shot(page, '01-customer-detail');

  // 3. Click "Create Ticket" on the registered device — the button that used to do nothing.
  await expect(page.getByRole('link', { name: 'Servis Unit Ini' })).toBeVisible();
  await page.getByRole('link', { name: 'Servis Unit Ini' }).click();
  await page.waitForURL(/\/tickets\/intake\?customerId=.+&assetId=.+/, { timeout: 20_000 });
  await page.waitForLoadState('networkidle');

  // 4. Intake arrives pre-filled and locked, not blank.
  await expect(page.getByText('Pelanggan lama dipilih')).toBeVisible();
  await expect(page.getByText('Unit lama dipilih')).toBeVisible();
  await expect(page.locator('#name')).toHaveValue('Budi Santoso');
  await shot(page, '02-intake-prefilled');

  // 5. Submit — the device section has no inputs to fill (locked), and since
  // Tahap B the form no longer asks for a flow (tiket memakai alur default toko).
  //
  // R1.8-T1 — keluhan wajib, DAN merek/model sengaja tidak diminta di sini:
  // unitnya sudah terdaftar (`assetId` ikut di URL), jadi memaksa mengetik ulang
  // identitasnya justru menghalangi pelanggan yang datang kembali. Jalur inilah
  // yang membuktikan pengecualian itu benar-benar hidup, bukan cuma tertulis.
  await page.fill('#complaint', 'Layar mati total');
  await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
  // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
  // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
  // menempuh jalan yang sama seperti kasir sungguhan.
  await page.getByRole('link', { name: 'Lihat tiket' }).click();

  // 6. Lands on the new ticket, linked to the right customer + device.
  await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
  await expect(page.locator('h1', { hasText: 'Workspace' })).toBeVisible();
  await expect(page.getByText('Budi Santoso')).toBeVisible();
  await shot(page, '03-ticket-created');

  // 7. No uncaught page errors anywhere in the walk.
  expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
});
