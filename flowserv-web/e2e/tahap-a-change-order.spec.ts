import { test, expect, type Page } from '@playwright/test';

// Tahap A #5 (B1) — Change Order: saat pembongkaran ketemu kerusakan tambahan,
// teknisi menambah biaya lalu MINTA PERSETUJUAN ULANG. Re-quote hanya menagih
// selisihnya; approvedTotal menumpuk kumulatif. Data layer sudah mendukung ini
// (dibuktikan live via curl); test ini membuktikan framing UI-nya bekerja:
// panel "Temuan Baru (Change Order)" muncul dan quote kedua benar.

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

// Tahap B — dua perubahan di helper ini, keduanya konsekuensi alur nyata toko:
//  (1) form intake tak lagi meminta alur (ditentukan setelah diagnosis);
//  (2) biaya BELUM boleh diisi di tahap Intake — template menandai Intake
//      dengan allowsCharges=false, karena unitnya memang belum didiagnosis.
//      Jadi tiket digeser ke Diagnosis dulu, tahap tempat teknisi memang
//      memasukkan estimasi harga.
async function intakeTicket(page: Page, name: string) {
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');
  await page.fill('#name', name);
  await page.selectOption('#type', 'Smartphone');
  await page.fill('#brand', 'Samsung');
  await page.getByRole('button', { name: 'Create Ticket' }).click();
  await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

  const diagnosisValue = await page.locator('#next option', { hasText: 'Diagnosis' }).first().getAttribute('value');
  await page.selectOption('#next', diagnosisValue!);
  await page.getByRole('button', { name: 'Execute' }).click();
  await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText('Diagnosis');
}

// Adds a labor charge via the on-page form (resets to 'part' after each add,
// so we re-pick "Jasa" every time).
async function addLabor(page: Page, description: string, price: string) {
  await page.getByRole('button', { name: 'Jasa', exact: true }).click();
  await page.getByPlaceholder('Deskripsi jasa').fill(description);
  await page.getByPlaceholder('Harga satuan').fill(price);
  await page.getByRole('button', { name: 'Tambah Biaya' }).click();
  await expect(page.getByText(description)).toBeVisible();
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('a new finding after the first quote is framed as a Change Order and re-quotes only the delta', async ({ page }) => {
    await login(page);
    await intakeTicket(page, `Change Order ${Date.now()}`);

    // First quote: jasa diagnosa 100.000.
    await addLabor(page, 'Jasa diagnosa awal', '100000');
    // No change-order panel yet — nothing has been quoted.
    await expect(page.getByTestId('change-order-panel')).toHaveCount(0);
    await page.getByTestId('request-approval').click();
    await expect(page.getByText(/Disetujui:/)).toBeVisible();
    await expect(page.getByText('100.000').first()).toBeVisible();

    // Bongkar -> temuan baru: ganti konektor 250.000. This is the change order.
    await addLabor(page, 'TEMUAN BARU: ganti konektor', '250000');

    const panel = page.getByTestId('change-order-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Temuan Baru');
    await expect(panel).toContainText('250.000'); // delta only
    await expect(panel).toContainText('350.000'); // cumulative approved-to-be

    // Approve the additional amount. Panel disappears; approved total is now 350k.
    await page.getByTestId('change-order-approve').click();
    await expect(page.getByTestId('change-order-panel')).toHaveCount(0);
    const approvedRegion = page.getByText(/Disetujui:/).locator('..');
    await expect(approvedRegion).toContainText('350.000');
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('the Change Order panel does not overflow on a phone', async ({ page }) => {
    await login(page);
    await intakeTicket(page, `Change Order Mobile ${Date.now()}`);
    await addLabor(page, 'Jasa diagnosa', '100000');
    await page.getByTestId('request-approval').click();
    await expect(page.getByText(/Disetujui:/)).toBeVisible();
    await addLabor(page, 'TEMUAN BARU konektor', '250000');
    await expect(page.getByTestId('change-order-panel')).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
