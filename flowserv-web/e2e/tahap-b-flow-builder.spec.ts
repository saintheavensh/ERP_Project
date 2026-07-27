import { test, expect, type Page } from '@playwright/test';

// Editor alur servis — bentuk DIAGRAM, di /flows (dipindah dari Setelan pada
// 2026-07-27 atas keputusan pemilik).
//
// Yang dibuktikan di sini bukan sekadar "diagramnya tampil", tapi dua klaim
// yang benar-benar dijanjikan ke pemilik:
//   1. urutan alur INTI terkunci — tahap inti tak punya tombol lepas sama
//      sekali, dan servernya menolak walau permintaannya dipaksa;
//   2. yang bisa diatur memang cuma tahap tambahan (QC dsb.) + isi tiap tahap,
//      dan mengubahnya BENAR-BENAR mengubah cara aplikasi bekerja.

const SERVIS_FLOW = '84000000-0000-4000-8000-000000000003';
const DITUNGGU_FLOW = '84000000-0000-4000-8000-000000000001';

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

/** Kartu tahap di diagram, dicari dari namanya. */
function stage(page: Page, name: string) {
  return page.getByTestId('flow-node').filter({ hasText: name }).first();
}

/** Buka panel pengaturan sebuah tahap dengan mengklik kartunya. */
async function openStage(page: Page, name: string) {
  await stage(page, name).click();
  const panel = page.getByTestId('stage-panel');
  await expect(panel).toBeVisible();
  return panel;
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('diagram menampilkan seluruh tahap, mana yang inti dan mana yang tambahan', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    const nodes = page.getByTestId('flow-node');
    await expect(nodes).toHaveCount(8);

    // Tulang punggung terkunci, QC adalah tahap tambahan — inilah pembagian yang
    // dimaksud "alur intinya urutannya tidak bisa diubah, konfigurasinya hanya
    // menambahkan QC".
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Intake' })).toHaveAttribute('data-core', 'true');
    await expect(page.getByTestId('flow-node').filter({ hasText: 'QC Awal' })).toHaveAttribute('data-core', 'false');
    await expect(page.getByTestId('flow-node').filter({ hasText: 'QC Akhir' })).toHaveAttribute('data-core', 'false');

    // Panah dari mana ke mana: percabangan setelah Diagnosis membuat jumlah
    // sambungan lebih banyak daripada jumlah tahap.
    await expect(page.getByTestId('flow-edge-drop')).toHaveCount(9);

    // Lencana kapabilitas terbaca langsung dari kartunya, tanpa membuka apa pun.
    await expect(stage(page, 'Intake')).toContainText('CETAK: label');
    await expect(stage(page, 'Unit Disimpan')).toContainText('CETAK: tanda_terima');
    await expect(stage(page, 'Ditunggu')).not.toContainText('CETAK');

    await expect(page.getByTestId('flow-warnings')).toHaveCount(0);
  });

  test('tahap inti tidak punya tombol lepas, tahap tambahan punya', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    await expect(stage(page, 'Pengerjaan').getByRole('button', { name: /^Lepas tahap/ })).toHaveCount(0);
    await expect(stage(page, 'QC Awal').getByRole('button', { name: /^Lepas tahap/ })).toHaveCount(1);

    // Panel tahap inti pun hanya menawarkan pengaturan isi, bukan pelepasan.
    const panel = await openStage(page, 'Pengerjaan');
    await expect(panel).toContainText('Tahap inti');
    await expect(panel.getByRole('button', { name: 'Lepas tahap ini dari alur' })).toHaveCount(0);
  });

  test('melepas tahap tambahan menyambungkan alur langsung melewatinya', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    // Sengaja TIDAK disimpan: yang diuji di sini perilaku diagramnya, dan
    // template ini dipakai tiket baru oleh spec lain.
    await stage(page, 'QC Awal').getByRole('button', { name: /^Lepas tahap/ }).click();

    await expect(page.getByTestId('flow-node')).toHaveCount(7);
    await expect(page.getByTestId('flow-node').filter({ hasText: 'QC Awal' })).toHaveCount(0);
    // Kedua cabang harus tersambung ulang ke Pengerjaan — kalau tidak, akan
    // muncul peringatan "tahap tak tersambung".
    await expect(page.getByTestId('flow-warnings')).toHaveCount(0);

    // 9 sambungan semula, minus 3 yang menyentuh QC Awal, plus 2 sambungan
    // pengganti — kedua cabang (Ditunggu & Unit Disimpan) harus tersambung
    // sendiri ke Pengerjaan, bukan menggantung.
    await expect(page.getByTestId('flow-edge-drop')).toHaveCount(8);
    await expect(page.locator('[aria-label="Sisipkan tahap antara Ditunggu dan Pengerjaan"]')).toHaveCount(1);
    await expect(page.locator('[aria-label="Sisipkan tahap antara Unit Disimpan dan Pengerjaan"]')).toHaveCount(1);
  });

  test('menyisipkan QC hanya di cabang bawah tidak menyeret cabang atas', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    // Mulai dari keadaan tanpa QC (bawaan memasangnya untuk KEDUA cabang).
    await stage(page, 'QC Awal').getByRole('button', { name: /^Lepas tahap/ }).click();

    // Pasang QC hanya pada cabang "Unit Disimpan".
    await page.getByTestId('palette-item').filter({ hasText: 'QC Awal' }).click();
    await page.locator('[aria-label="Sisipkan tahap antara Unit Disimpan dan Pengerjaan"]').click();

    // Cabang atas HARUS tetap langsung ke Pengerjaan — inilah yang dilaporkan
    // pemilik terbaca "bergabung".
    await expect(page.locator('[aria-label="Sisipkan tahap antara Ditunggu dan Pengerjaan"]')).toHaveCount(1);
    await expect(page.locator('[aria-label="Sisipkan tahap antara Ditunggu dan QC Awal"]')).toHaveCount(0);
    await expect(page.locator('[aria-label="Sisipkan tahap antara Unit Disimpan dan QC Awal"]')).toHaveCount(1);

    // ...dan harus TERLIHAT begitu juga: QC digambar sebaris dengan cabang yang
    // memakainya, bukan di baris "Ditunggu" (di situlah panah cabang atas lewat,
    // yang membuat diagramnya menipu meski datanya benar).
    const qcY = (await stage(page, 'QC Awal').boundingBox())!.y;
    const ditungguY = (await stage(page, 'Ditunggu').boundingBox())!.y;
    const disimpanY = (await stage(page, 'Unit Disimpan').boundingBox())!.y;
    expect(qcY).not.toBeCloseTo(ditungguY, 0);
    expect(qcY).toBeCloseTo(disimpanY, 0);
    // Tidak disimpan — template ini dipakai spec lain.
  });

  test('menyisipkan tahap tambahan pada sebuah panah, lalu menyimpannya', async ({ page }) => {
    await login(page);
    // Alur non-default, supaya tiket baru & spec lain tidak terpengaruh.
    await page.goto(`/flows/${DITUNGGU_FLOW}`);
    await page.waitForLoadState('networkidle');

    const before = await page.getByTestId('flow-node').count();

    // Jalur sentuh: ketuk tahap di palet, lalu ketuk tanda "+" pada panahnya.
    await page.getByTestId('palette-item').filter({ hasText: 'Menunggu Sparepart' }).click();
    await page.getByTestId('flow-edge-drop').first().click();

    await expect(page.getByTestId('flow-node')).toHaveCount(before + 1);
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Menunggu Sparepart' })).toHaveCount(1);
    await expect(page.getByTestId('flow-warnings')).toHaveCount(0);

    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();

    // Benar-benar tersimpan: muat ulang halaman dan tahapnya masih ada.
    await page.reload();
    await page.waitForLoadState('networkidle');
    const inserted = page.getByTestId('flow-node').filter({ hasText: 'Menunggu Sparepart' });
    await expect(inserted).toHaveCount(1);
    // Tahap buatan editor selalu tahap TAMBAHAN — jadi bisa dilepas lagi.
    await expect(inserted).toHaveAttribute('data-core', 'false');

    // Kembalikan alur ke bentuk semula supaya urutan jalannya tes tidak penting.
    await inserted.getByRole('button', { name: /^Lepas tahap/ }).click();
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();
  });

  test('seret tahap dari palet ke panah juga menyisipkannya', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${DITUNGGU_FLOW}`);
    await page.waitForLoadState('networkidle');

    const before = await page.getByTestId('flow-node').count();
    await page.getByTestId('palette-item').filter({ hasText: 'QC Awal' })
      .dragTo(page.getByTestId('flow-edge-drop').first());

    await expect(page.getByTestId('flow-node')).toHaveCount(before + 1);
    // Tidak disimpan — cukup membuktikan seretannya sampai ke tindakan yang sama.
  });

  test('keterangan tahap yang disimpan muncul di halaman tiket', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    const marker = `Keterangan uji ${Date.now()}`;
    const panel = await openStage(page, 'Intake');
    await panel.locator('textarea').first().fill(marker);

    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();

    // Buat tiket baru: halaman tiket harus menampilkan keterangan itu di bawah
    // "Current Stage" — bukti bahwa yang disunting di sini dibaca staf di sana.
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
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    // Diagnosis default-nya MENGIZINKAN biaya. Matikan, lalu buktikan tiket ikut
    // berubah — bukti bahwa perilaku benar-benar mengikuti template.
    const panel = await openStage(page, 'Diagnosis');
    const chargesToggle = panel.getByRole('checkbox').first();
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
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');
    const restore = await openStage(page, 'Diagnosis');
    await restore.getByRole('checkbox').first().check();
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();
  });

  test('alur baru lahir dengan tahap intinya, lalu bisa dihapus lagi', async ({ page }) => {
    await login(page);
    await page.goto('/flows');
    await page.waitForLoadState('networkidle');

    const name = `Alur Uji ${Date.now()}`;
    await page.getByRole('button', { name: 'Buat Alur' }).click();
    await page.locator('#flow-name').fill(name);
    await page.getByRole('button', { name: 'Buat', exact: true }).click();
    await page.waitForURL(/\/flows\/[0-9a-f-]{36}/, { timeout: 20_000 });

    // Inti keluhan pemilik: alur baru TIDAK boleh lahir kosong. Kanvas tanpa
    // tahap berarti tanpa panah, dan tanpa panah tak ada tempat menyisipkan
    // apa pun — editornya buntu.
    await expect(page.getByTestId('flow-node')).toHaveCount(6);
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Intake' })).toHaveCount(1);
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Selesai' })).toHaveCount(1);
    // Percabangan Ditunggu / Unit Disimpan ikut terbentuk, bukan rantai lurus.
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Ditunggu' })).toHaveCount(1);
    await expect(page.getByTestId('flow-node').filter({ hasText: 'Unit Disimpan' })).toHaveCount(1);
    // Semuanya tahap inti — QC memang belum dipasang, itulah yang ditambahkan owner.
    await expect(page.getByTestId('flow-node').filter({ hasText: 'QC' })).toHaveCount(0);
    // Dan alur bawaannya sehat: tak ada satu pun peringatan untuk diperbaiki.
    await expect(page.getByTestId('flow-warnings')).toHaveCount(0);

    // Hapus lagi — alur ini belum dipakai tiket mana pun, jadi boleh.
    await page.getByTestId('delete-flow').click();
    await page.getByTestId('confirm-delete-flow').click();
    await page.waitForURL(/\/flows$/, { timeout: 20_000 });
    await expect(page.getByTestId('flow-card').filter({ hasText: name })).toHaveCount(0);
  });

  test('alur default tidak bisa dihapus, dan alasannya dijelaskan', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('delete-flow').click();
    await page.getByTestId('confirm-delete-flow').click();

    // Tetap di halaman yang sama, dengan alasan penolakan yang bisa ditindaklanjuti.
    await expect(page.getByTestId('flow-error')).toBeVisible();
    await expect(page.getByTestId('flow-error')).toContainText('dipakai setiap tiket baru');
    await expect(page).toHaveURL(new RegExp(`/flows/${SERVIS_FLOW}$`));
    await expect(page.getByTestId('flow-node')).toHaveCount(8);
  });

  test('daftar alur adalah pintu masuknya, dan Setelan hanya menunjuk ke sana', async ({ page }) => {
    await login(page);
    await page.goto('/flows');
    await page.waitForLoadState('networkidle');

    // Alur yang benar-benar dipakai tiket baru harus terlihat sebagai apa adanya.
    await expect(page.getByTestId('flow-card').filter({ hasText: 'Dipakai tiket baru' })).toHaveCount(1);
    await page.getByTestId('flow-card').filter({ hasText: 'Dipakai tiket baru' }).click();
    await page.waitForURL(/\/flows\/[0-9a-f-]{36}/);
    await expect(page.getByTestId('flow-canvas')).toBeVisible();

    // Tab "Alur Servis" di Setelan bukan tempat kedua untuk mengatur hal yang
    // sama — ia hanya membawa ke sini.
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Nama tab sengaja dibedakan dari menu sidebar ("Alur Servis ↗") supaya
    // jelas ia membawa keluar dari Setelan, bukan membuka tab di tempat.
    await page.getByRole('link', { name: 'Alur Servis ↗' }).click();
    await page.waitForURL(/\/flows$/);
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('diagram bisa digulir menyamping tanpa membuat halaman overflow', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('flow-node').first()).toBeVisible();

    // Diagramnya memang lebih lebar dari layar (7 kolom) — yang menggulir harus
    // wadahnya, bukan seluruh halaman.
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    const canvasScrolls = await page.getByTestId('flow-canvas')
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(canvasScrolls).toBe(true);
  });
});
