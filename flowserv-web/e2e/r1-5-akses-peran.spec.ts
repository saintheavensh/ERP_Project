import { test, expect, type Page } from '@playwright/test';

/**
 * R1.5 — perbaikan dari uji manual pemilik atas R1.
 *
 * Dua temuan, keduanya lolos dari 262 unit test + 27 Playwright + tsc bersih,
 * karena tak satu pun menjalankan aplikasi sebagai kasir/teknisi lalu MENGETIK
 * alamat yang menunya disembunyikan:
 *
 *  1. (uji-R1 C7/C8) Kasir & teknisi bisa membuka /settings dan /finance. Ini
 *     bukan sekadar halaman kosong yang terbuka — GET /v1/finance/* memberi
 *     mereka 200 berisi omzet, modal, dan LABA. Permission
 *     `finance.view_reports` sudah ada di katalog sejak H12 dan diberikan ke
 *     Manager, tapi tidak satu route pun pernah memanggilnya.
 *  2. (uji-R1 B1) Teknisi masih bisa membuat tiket servis. Pemilik: "tiket
 *     service hanya bisa dilakukan oleh admin atau kasir".
 *
 * Aturan tes di berkas ini: untuk hal yang bersifat kerahasiaan, assert bahwa
 * angkanya TIDAK ADA DI DOM — bukan sekadar "tidak terlihat". Elemen yang
 * ter-render lalu disembunyikan CSS tetap terkirim ke browser dan tetap
 * terbaca; itu bukan kerahasiaan, itu penyamaran. (Pelajaran P12: Playwright
 * tidak menganggap opacity:0 sebagai tersembunyi.)
 */

const API_BASE = 'http://localhost:3001/v1';
const BRANCH_PUSAT = 'b0000000-0000-4000-8000-000000000002';

async function login(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function apiToken(page: Page, email: string, password = 'admin123') {
  const res = await page.request.post(`${API_BASE}/auth/login`, { data: { email, password } });
  return (await res.json()).data.token as string;
}

// ---------------------------------------------------------------------------
// A. Kebocoran data keuangan (uji-R1 C7 & C8)
// ---------------------------------------------------------------------------

for (const peran of [
  { nama: 'kasir', email: 'cashier@demo.com' },
  { nama: 'teknisi', email: 'technician@demo.com' },
]) {
  test(`${peran.nama} tidak bisa membuka /finance dan tidak melihat angka uang`, async ({ page }) => {
    await login(page, peran.email);
    await page.goto('/finance');

    // Dipentalkan ke beranda, bukan diberi halaman kosong yang menyesatkan.
    await expect(page).toHaveURL(/\/\?ditolak=/);
    await expect(page.getByText('Halaman itu bukan untuk peran Anda')).toBeVisible();

    // Yang sebenarnya dijaga: istilah laporan keuangan tidak ada di DOM sama sekali.
    const html = await page.content();
    for (const bocor of ['Estimasi Laba', 'Modal (HPP)', 'Laba Kotor']) {
      expect(html, `"${bocor}" tidak boleh sampai ke ${peran.nama}`).not.toContain(bocor);
    }
  });

  test(`${peran.nama} juga tidak bisa membuka /settings maupun /flows`, async ({ page }) => {
    await login(page, peran.email);

    for (const path of ['/settings', '/flows']) {
      await page.goto(path);
      await expect(page, `${path} harus menolak ${peran.nama}`).toHaveURL(/\/\?ditolak=/);
    }
  });

  test(`API menolak ${peran.nama} di endpoint laporan keuangan, bukan cuma UI-nya`, async ({ page }) => {
    // Menyembunyikan halaman bukan keamanan. Ini yang membuktikan gerbangnya
    // ada di backend, jadi memanggil API langsung pun tidak tembus.
    const token = await apiToken(page, peran.email);
    for (const path of ['/finance/ledger', '/finance/ledger/summary', '/finance/payables']) {
      const res = await page.request.get(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status(), `${path} harus 403 untuk ${peran.nama}`).toBe(403);
    }
  });
}

test('manager tetap bisa membuka /finance dan melihat laporannya', async ({ page }) => {
  // Sisi lain dari gerbang yang sama: kalau ini gagal, perbaikannya kebablasan
  // dan justru mematikan fitur yang sah.
  await login(page, 'manager@demo.com');
  await page.goto('/finance');

  await expect(page).not.toHaveURL(/ditolak/);
  await expect(page.getByRole('heading', { name: /keuangan/i }).first()).toBeVisible();
});

test('kasir tetap punya kartu AR di beranda (perbaikan tidak boleh menolkannya)', async ({ page }) => {
  // /finance/receivables sengaja digerbangi pos.process_payment, bukan
  // finance.view_reports: itu daftar kerja penagihan kasir. Kalau salah
  // gerbang, kartu ini diam-diam jadi 0 karena jalur muatnya menelan 403.
  const token = await apiToken(page, 'cashier@demo.com');
  const res = await page.request.get(`${API_BASE}/finance/receivables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status(), 'kasir harus tetap boleh membaca piutang').toBe(200);

  // ...tapi teknisi tidak — ia tidak menagih siapa pun.
  const tokenTeknisi = await apiToken(page, 'technician@demo.com');
  const resTeknisi = await page.request.get(`${API_BASE}/finance/receivables`, {
    headers: { Authorization: `Bearer ${tokenTeknisi}` },
  });
  expect(resTeknisi.status(), 'teknisi tidak menagih, jadi tidak perlu piutang').toBe(403);
});

// ---------------------------------------------------------------------------
// B. Teknisi tidak lagi membuat tiket (uji-R1 B1)
// ---------------------------------------------------------------------------

test('teknisi tidak melihat tombol Terima Unit', async ({ page }) => {
  await login(page, 'technician@demo.com');
  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');

  // Tidak ada di DOM, bukan sekadar tak terlihat — tombol mati yang masih
  // ter-render adalah anti-pattern yang Track F ada untuk membasminya.
  await expect(page.getByRole('link', { name: /Terima Unit/i })).toHaveCount(0);
});

test('teknisi yang mengetik /tickets/intake langsung tetap ditolak', async ({ page }) => {
  await login(page, 'technician@demo.com');
  await page.goto('/tickets/intake');
  await expect(page).toHaveURL(/\/\?ditolak=/);
});

test('API menolak teknisi membuat tiket, dan tetap mengizinkan kasir', async ({ page }) => {
  const payload = {
    customerName: 'Uji R1.5B ' + Date.now(),
    customerPhone: '0812' + Math.floor(Math.random() * 1e8),
    assetType: 'Handphone',
    assetBrand: 'Samsung',
    assetModel: 'A10',
    reportedComplaint: 'Layar mati total',
    branchId: BRANCH_PUSAT,
  };

  const tokenTeknisi = await apiToken(page, 'technician@demo.com');
  const resTeknisi = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${tokenTeknisi}` },
    data: payload,
  });
  expect(resTeknisi.status(), 'teknisi tidak boleh membuat tiket servis').toBe(403);

  const tokenKasir = await apiToken(page, 'cashier@demo.com');
  const resKasir = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${tokenKasir}` },
    data: { ...payload, customerName: 'Uji R1.5B kasir ' + Date.now() },
  });
  expect(resKasir.status(), 'kasir HARUS tetap bisa — ini yang R1 perbaiki').toBe(201);
});

test('teknisi tetap bisa mengambil pekerjaan (regresi R1 — jangan sampai ikut tercabut)', async ({ page }) => {
  // ticket.diagnose menggerbangi POST /:id/claim. Mencabutnya bersama
  // ticket.create akan mengembalikan tepat bug yang R1 baru saja perbaiki.
  const tokenKasir = await apiToken(page, 'cashier@demo.com');
  const dibuat = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${tokenKasir}` },
    data: {
      customerName: 'Uji klaim R1.5 ' + Date.now(),
      customerPhone: '0812' + Math.floor(Math.random() * 1e8),
      assetType: 'Handphone',
      assetBrand: 'Samsung',
      assetModel: 'A10',
      reportedComplaint: 'Layar mati total',
      branchId: BRANCH_PUSAT,
    },
  });
  expect(dibuat.status()).toBe(201);
  const ticketId = (await dibuat.json()).data.id as string;

  const tokenTeknisi = await apiToken(page, 'technician@demo.com');
  const klaim = await page.request.post(`${API_BASE}/tickets/${ticketId}/claim`, {
    headers: { Authorization: `Bearer ${tokenTeknisi}`, 'Idempotency-Key': crypto.randomUUID() },
  });
  expect(klaim.status(), 'teknisi harus tetap bisa mengambil pekerjaan').toBe(200);
});

// ---------------------------------------------------------------------------
// C. Sandi/pola minimal 4 (uji-R1 A5)
// ---------------------------------------------------------------------------

test('API menolak sandi/PIN & pola yang terlalu pendek, di kedua jalur tulis', async ({ page }) => {
  const token = await apiToken(page, 'cashier@demo.com');
  const dasar = {
    assetType: 'Handphone',
    assetBrand: 'Samsung',
    reportedComplaint: 'Layar mati total',
    branchId: BRANCH_PUSAT,
  };
  const buat = (devicePasscode: string) =>
    page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        ...dasar,
        customerName: 'Uji sandi ' + Date.now() + Math.random(),
        customerPhone: '0812' + Math.floor(Math.random() * 1e8),
        devicePasscode,
      },
    });

  // Pendek ditolak. "pola:1-2" panjangnya 8 KARAKTER tapi cuma 2 titik — kalau
  // ini lolos, berarti validasinya menghitung panjang string mentah.
  expect((await buat('123')).status(), 'PIN 3 karakter').toBe(400);
  expect((await buat('pola:1-2')).status(), 'pola 2 titik').toBe(400);

  // Yang sah tetap lolos, termasuk kosong (tidak semua unit terkunci).
  expect((await buat('1234')).status(), 'PIN 4 karakter').toBe(201);
  expect((await buat('pola:1-2-3-6')).status(), 'pola 4 titik').toBe(201);
  expect((await buat('')).status(), 'kosong tetap boleh').toBe(201);
});

test('mengosongkan sandi saat serah-terima tetap boleh (jangan ikut terjaring)', async ({ page }) => {
  // PATCH dengan null adalah fitur nyata: sandi dihapus begitu unit
  // dikembalikan ke pelanggan. Aturan panjang minimum tidak boleh mematikannya.
  const token = await apiToken(page, 'cashier@demo.com');
  const dibuat = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      customerName: 'Uji hapus sandi ' + Date.now(),
      customerPhone: '0812' + Math.floor(Math.random() * 1e8),
      assetType: 'Handphone',
      reportedComplaint: 'Layar mati total',
      branchId: BRANCH_PUSAT,
      devicePasscode: '1234',
    },
  });
  expect(dibuat.status()).toBe(201);
  const ticketId = (await dibuat.json()).data.id as string;

  const patch = (devicePasscode: string | null) =>
    page.request.patch(`${API_BASE}/tickets/${ticketId}/intake-details`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { devicePasscode },
    });

  expect((await patch(null)).status(), 'null = kosongkan, harus boleh').toBe(200);
  expect((await patch('12')).status(), 'tetap menolak yang pendek').toBe(400);
  expect((await patch('5678')).status(), 'ganti ke sandi sah').toBe(200);
});

test('kasir melihat peringatan panjang sambil mengetik, bukan setelah simpan', async ({ page }) => {
  await login(page, 'cashier@demo.com');
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');

  await page.locator('#passcode').fill('12');
  await expect(page.getByText(/Sandi\/PIN minimal 4 karakter/)).toBeVisible();

  await page.locator('#passcode').fill('1234');
  await expect(page.getByText(/Sandi\/PIN minimal 4 karakter/)).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// D. Kasir tidak dilempar ke halaman detail (uji-R1 A9)
// ---------------------------------------------------------------------------

test('kasir tetap di form setelah simpan, dapat toast bernomor, form kosong lagi', async ({ page }) => {
  await login(page, 'cashier@demo.com');
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');

  const nama = `Uji toast ${Date.now()}`;
  await page.fill('#name', nama);
  await page.selectOption('#type', 'Smartphone');
  await page.fill('#brand', 'Samsung');
  await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();

  // Inti R1.5D: kasir TIDAK berpindah halaman.
  await expect(page.getByText(/berhasil dibuat/)).toBeVisible();
  expect(page.url()).toContain('/tickets/intake');

  // Nomor tiket wajib ada — itu satu-satunya pegangan kasir untuk ditempel di
  // unit. Toast tanpa nomor akan memaksa kasir membuka tiketnya, yang justru
  // mengembalikan kerepotan yang task ini hapus.
  await expect(page.getByRole('status')).toContainText(/TCK|[0-9a-f]{8}/);

  // Form sudah kosong, siap pelanggan berikutnya — ini yang bikin antrean jalan.
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.locator('#brand')).toHaveValue('');

  // Tiketnya benar-benar tersimpan, bukan cuma toast yang muncul.
  await page.getByRole('link', { name: 'Lihat tiket' }).click();
  await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
  await expect(page.getByText(nama).first()).toBeVisible();
});

test('cetak otomatis tetap terpicu dari form intake, tidak ikut hilang', async ({ page }) => {
  // Ini yang paling mudah rusak diam-diam: lemparan ke halaman detail dulu
  // yang MEMICU cetak label (`?autoprint=intake`). Menghapusnya tanpa
  // memindahkan pemicunya akan mematikan label tanpa satu tes pun merah.
  await login(page, 'cashier@demo.com');
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');

  await page.fill('#name', `Uji cetak intake ${Date.now()}`);
  await page.selectOption('#type', 'Smartphone');
  await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();

  // Tanpa printer ter-assign, statusnya melaporkan itu — bukti pemicunya jalan.
  await expect(page.getByTestId('intake-print-status')).toBeVisible({ timeout: 15_000 });
});

// ---------------------------------------------------------------------------
// E. Super Admin tidak berubah sama sekali
// ---------------------------------------------------------------------------

test('super admin tetap bisa membuka semua halaman yang dibatasi', async ({ page }) => {
  await login(page, 'admin@demo.com');

  for (const path of ['/finance', '/finance/ledger', '/settings', '/flows', '/tickets/intake']) {
    await page.goto(path);
    await expect(page, `${path} tidak boleh menolak Super Admin`).not.toHaveURL(/ditolak/);
  }
});
