import { test, expect, type Page } from '@playwright/test';

// Tahap B / Phase 7.1 — editor alur servis.
//
// Yang dibuktikan di sini bukan sekadar "halamannya tampil", tapi bahwa
// menyunting template BENAR-BENAR mengubah cara aplikasi bekerja: keterangan
// tahap muncul di halaman tiket, dan mematikan sebuah kapabilitas langsung
// menutup fitur yang bersangkutan. Itulah inti keputusan pemilik bahwa
// "template flow service ini inti dari semua alur servicenya".

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

/**
 * Buka panel "Atur" untuk tahap dengan nama tertentu.
 *
 * Namanya ada di dalam <input>, dan nilai input yang dikelola Svelte hidup di
 * PROPERTI `value`, bukan atribut HTML-nya — jadi selektor CSS
 * `input[value="Diagnosis"]` tidak akan pernah cocok setelah hidrasi. Karena
 * itu nilainya dibaca satu per satu lewat inputValue().
 */
async function openStage(page: Page, name: string) {
  const stages = page.getByTestId('flow-stage');
  const count = await stages.count();
  for (let i = 0; i < count; i++) {
    const stage = stages.nth(i);
    if ((await stage.locator('input').first().inputValue()) === name) {
      await stage.getByRole('button', { name: 'Atur' }).click();
      return stage;
    }
  }
  throw new Error(`Tahap "${name}" tidak ditemukan di editor alur`);
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('menampilkan tahap alur default beserta lencana kapabilitasnya', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');

    const stages = page.getByTestId('flow-stage');
    await expect(stages).toHaveCount(8);

    // Lencana = ringkasan kapabilitas, supaya owner tak perlu membuka tiap tahap
    // untuk tahu tahap mana yang mencetak apa.
    await expect(stages.first()).toContainText('TAHAP AWAL');
    await expect(stages.first()).toContainText('CETAK: label');
    await expect(stages.last()).toContainText('TAHAP AKHIR');

    // Alur default yang sehat tidak memunculkan peringatan apa pun.
    await expect(page.getByTestId('flow-warnings')).toHaveCount(0);
  });

  test('memperingatkan alur yang rusak sebelum disimpan', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');

    // Tahap baru tanpa sambungan = tahap awal kedua -> harus diperingatkan,
    // karena tiket jadi tak tahu harus mulai di mana.
    await page.getByRole('button', { name: '+ Tambah Tahap' }).click();
    const warnings = page.getByTestId('flow-warnings');
    await expect(warnings).toBeVisible();
    await expect(warnings).toContainText('tahap awal');
  });

  test('mengubah urutan tahap lewat tombol panah', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');

    const stages = page.getByTestId('flow-stage');
    const secondName = await stages.nth(1).locator('input').first().inputValue();

    await stages.nth(1).getByRole('button', { name: 'Naikkan tahap' }).click();

    // Tahap kedua kini di posisi pertama — urutan inilah yang disimpan sebagai
    // sequenceOrder, jalur yang sama dipakai drag-and-drop.
    await expect(stages.first().locator('input').first()).toHaveValue(secondName);
  });

  test('keterangan tahap yang disimpan muncul di halaman tiket', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');

    const marker = `Keterangan uji ${Date.now()}`;
    const stage = await openStage(page, 'Intake');
    await stage.locator('textarea').first().fill(marker);

    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();

    // Sekarang buat tiket baru: halaman tiket harus menampilkan keterangan itu
    // di bawah "Current Stage". (Binding ini sudah ada sejak Phase 3 tapi
    // kolomnya tak pernah ada, jadi selama ini selalu kosong.)
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', `Uji Keterangan ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    await expect(page.getByText(marker)).toBeVisible();
  });

  test('mematikan "input biaya" di sebuah tahap langsung mengunci form biaya di tiket', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');

    // Diagnosis default-nya MENGIZINKAN biaya. Matikan, lalu buktikan tiket
    // ikut berubah — bukti bahwa perilaku benar-benar mengikuti template.
    const stage = await openStage(page, 'Diagnosis');
    const chargesToggle = stage.getByRole('checkbox').first();
    await expect(chargesToggle).toBeChecked();
    await chargesToggle.uncheck();
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();

    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', `Uji Gerbang ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    const diagnosisValue = await page.locator('#next option', { hasText: 'Diagnosis' }).first().getAttribute('value');
    await page.selectOption('#next', diagnosisValue!);
    await page.getByRole('button', { name: 'Execute' }).click();
    await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText('Diagnosis');

    // Sebelum perubahan ini, Diagnosis menampilkan form biaya. Sekarang terkunci.
    await expect(page.getByTestId('charges-locked')).toBeVisible();

    // Kembalikan ke semula supaya spec lain (yang mengandalkan biaya terbuka di
    // Diagnosis) tidak terpengaruh urutan jalannya tes.
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');
    const restore = await openStage(page, 'Diagnosis');
    await restore.getByRole('checkbox').first().check();
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('editor alur tidak overflow di layar ponsel', async ({ page }) => {
    await login(page);
    await page.goto('/settings/flow');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('flow-stage').first()).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
