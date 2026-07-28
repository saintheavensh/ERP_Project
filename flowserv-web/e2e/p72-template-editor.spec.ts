import { test, expect, type Page } from '@playwright/test';

// Phase 7.2 — editor template nota + pratinjau.
//
// Permintaan pemilik: template nota bisa diedit & dipilih, dengan pratinjau yang
// "sama dengan kenyataannya". Yang dibuktikan di sini adalah kalimat terakhir
// itu: mengubah sebuah sakelar harus mengubah pratinjau, dan pratinjaunya harus
// berupa kertas sungguhan pada lebar yang benar — bukan gambar hiasan.

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function openPrinterTab(page: Page) {
  await page.goto('/settings?tab=printers');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('printer-templates-table')).toBeVisible();
}

const API_BASE = 'http://localhost:3001/v1';

const BLANK_LAYOUT = {
  header: { showStoreName: true, showAddress: false, showPhone: false, showLogo: false },
  items: { showLineSubtotal: false, showDescription: false },
  extra: { showCashierName: false, showTicketInfo: false, showSignature: false },
  footer: { note: null, warrantyPolicy: null },
};

/**
 * Template milik tes ini sendiri, dibuat lewat API.
 *
 * Tes yang MENGUBAH template tidak boleh memakai template bawaan seed: sekali
 * sebuah tes gagal di tengah jalan, perubahannya tak sempat dikembalikan dan
 * tes berikutnya ikut gagal karena keadaan awalnya sudah lain — persis yang
 * terjadi saat spec ini pertama dijalankan.
 */
async function ownTemplate(page: Page, paperSize: '58mm' | '80mm' | 'A4', documentType = 'receipt') {
  const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const token = (await loginRes.json()).data.token;
  const name = `Uji Editor ${paperSize} ${Date.now()}`;
  await page.request.post(`${API_BASE}/printer/templates`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, documentType, paperSize, layoutConfig: BLANK_LAYOUT },
  });
  return name;
}

/** Buka editor untuk template dengan nama tertentu. */
async function openTemplate(page: Page, name: string) {
  await page.getByTestId('template-row').filter({ hasText: name }).first()
    .getByTestId('edit-template').click();
  await expect(page.getByTestId('template-editor')).toBeVisible();
  // Pratinjau datang dari server (debounce 250ms) — tunggu isinya, bukan
  // kerangkanya, kalau tidak assertion berikutnya membaca "Memuat pratinjau...".
  await expect(page.getByTestId('thermal-preview')).toBeVisible({ timeout: 15_000 });
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('pratinjau adalah kertas sungguhan pada lebar yang benar', async ({ page }) => {
    await login(page);
    const name = await ownTemplate(page, '80mm');
    await openPrinterTab(page);
    await openTemplate(page, name);

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).toHaveAttribute('data-paper-size', '80mm');
    // Isi contoh yang nyata, bukan lorem ipsum: nominal & item benar-benar ada.
    await expect(preview).toContainText('Toko Servis Contoh');
    await expect(preview).toContainText('LCD Samsung A10');

    // Tiap baris harus muat 48 karakter — ini yang bikin "sama dengan
    // kenyataannya" berarti sesuatu di kertas thermal.
    const longest = await preview.evaluate((el) =>
      Math.max(...[...el.querySelectorAll('div')].map((d) => (d.textContent ?? '').length))
    );
    expect(longest).toBeLessThanOrEqual(48);
  });

  test('mengubah sakelar langsung mengubah pratinjau, dan tersimpan', async ({ page }) => {
    await login(page);
    const name = await ownTemplate(page, '80mm');
    await openPrinterTab(page);
    await openTemplate(page, name);

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).not.toContainText('Jl. Contoh Raya');

    await page.getByTestId('layout-flag-header-showAddress').check();
    await expect(preview).toContainText('Jl. Contoh Raya', { timeout: 15_000 });

    const note = `Garansi uji ${Date.now()}`;
    await page.getByTestId('footer-note').fill(note);
    await expect(preview).toContainText(note, { timeout: 15_000 });

    await page.getByTestId('save-template').click();
    await expect(page.getByTestId('template-editor')).toHaveCount(0);

    // Benar-benar tersimpan: buka lagi, sakelarnya masih menyala.
    await openTemplate(page, name);
    await expect(page.getByTestId('layout-flag-header-showAddress')).toBeChecked();
    await expect(page.getByTestId('thermal-preview')).toContainText(note);
  });

  test('buat template baru, editornya langsung terbuka, lalu hapus lagi', async ({ page }) => {
    await login(page);
    await openPrinterTab(page);

    const name = `Struk Uji ${Date.now()}`;
    await page.getByTestId('new-template').click();
    await page.locator('#new-tpl-name').fill(name);
    await page.selectOption('#new-tpl-paper', '58mm');
    await page.getByTestId('confirm-new-template').click();

    // Template baru selalu perlu diatur, jadi editornya dibuka langsung.
    await expect(page.getByTestId('template-editor')).toBeVisible();
    await expect(page.getByTestId('thermal-preview')).toHaveAttribute('data-paper-size', '58mm', { timeout: 15_000 });
    await page.getByTestId('template-editor').getByRole('button', { name: 'Tutup' }).click();

    await expect(page.getByTestId('template-row').filter({ hasText: name })).toHaveCount(1);

    await page.getByTestId('template-row').filter({ hasText: name }).getByTestId('delete-template').click();
    await page.getByTestId('confirm-delete-template').click();
    await expect(page.getByTestId('template-row').filter({ hasText: name })).toHaveCount(0);
  });

  test('template yang masih dipasang di cabang tidak bisa dihapus, dan alasannya dijelaskan', async ({ page }) => {
    await login(page);
    await openPrinterTab(page);

    // Struk Default 80mm dipasang di Pusat oleh seed (6A.1).
    await page.getByTestId('template-row').filter({ hasText: 'Struk Default 80mm' })
      .getByTestId('delete-template').click();
    await page.getByTestId('confirm-delete-template').click();

    const error = page.getByTestId('template-list-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('masih dipakai');
    // ...dan templatenya tetap ada.
    await expect(page.getByTestId('template-row').filter({ hasText: 'Struk Default 80mm' })).toHaveCount(1);
  });

  test('pratinjau A4 memakai tata letak A4, bukan blok thermal', async ({ page }) => {
    await login(page);
    const name = await ownTemplate(page, 'A4', 'invoice_a4');
    await openPrinterTab(page);
    await page.getByTestId('template-row').filter({ hasText: name }).getByTestId('edit-template').click();
    await expect(page.getByTestId('template-editor')).toBeVisible();

    // Aturan spek 2: A4 tak pernah lewat blok thermal.
    await expect(page.getByTestId('template-preview')).toContainText('Toko Servis Contoh', { timeout: 15_000 });
    await expect(page.getByTestId('thermal-preview')).toHaveCount(0);
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('editor template tidak membuat halaman overflow di ponsel', async ({ page }) => {
    await login(page);
    const name = await ownTemplate(page, '80mm');
    await openPrinterTab(page);
    await page.getByTestId('template-row').filter({ hasText: name })
      .getByTestId('edit-template').click();
    await expect(page.getByTestId('template-editor')).toBeVisible();
    await expect(page.getByTestId('thermal-preview')).toBeVisible({ timeout: 15_000 });

    // Kertas 80mm (48 karakter) lebih lebar dari layar 375px — yang menggulir
    // harus wadah pratinjaunya, bukan seluruh halaman.
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
