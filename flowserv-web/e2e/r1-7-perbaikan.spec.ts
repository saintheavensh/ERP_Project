import { test, expect, type Page } from '@playwright/test';

/**
 * R1.7 — perbaikan dari uji manual R1.6 pemilik.
 *
 * Tes pertama di berkas ini menjaga bug yang paling memalukan sejauh ini:
 * kartu "Piutang (AR)" di beranda kasir menautkan ke halaman yang menolak
 * kasir. Tes R1.6 memeriksa API-nya membalas 200 dan kartunya tampil — tapi
 * TIDAK ADA yang mengikuti tautannya. Pemilik menemukannya dengan satu klik.
 * Karena itu tes di sini MENGIKUTI tautan, bukan memeriksa keberadaannya.
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

async function createUnassignedTicket(page: Page, customerName: string, extra: Record<string, unknown> = {}) {
  const token = await apiToken(page, 'cashier@demo.com');
  const res = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      customerName,
      customerPhone: '0812' + Math.floor(Math.random() * 1e8),
      assetType: 'Handphone',
      assetBrand: 'Samsung',
      assetModel: 'A10',
      reportedComplaint: 'Layar mati total',
      branchId: BRANCH_PUSAT,
      ...extra,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}

// ---------------------------------------------------------------------------
// A. C2 — kasir bisa BENAR-BENAR membuka piutang, bukan cuma melihat kartunya
// ---------------------------------------------------------------------------

test.describe('R1.7-T1 — kartu Piutang kasir menuju halaman yang bisa dibuka', () => {
  test('kasir mengklik kartu Piutang dan sampai di halamannya', async ({ page }) => {
    await login(page, 'cashier@demo.com');

    // Justru mengikuti tautannya — inilah yang tidak dilakukan tes R1.6.
    await page.getByRole('link', { name: /Piutang/i }).first().click();

    await expect(page).toHaveURL(/\/finance\/receivables/);
    await expect(page.getByRole('heading', { name: /Piutang Pelanggan/i })).toBeVisible();
    // Bukan halaman kosong: faktur dari seed benar-benar tampil.
    await expect(page.getByText('Budi Santoso').first()).toBeVisible();
  });

  test('kasir TETAP ditolak di /finance dan /finance/ledger', async ({ page }) => {
    // Sisi lain dari gerbang yang sama: kalau ini gagal, perbaikan C2
    // kebablasan dan membuka kembali kebocoran yang R1.5A tutup.
    await login(page, 'cashier@demo.com');

    for (const path of ['/finance', '/finance/ledger', '/finance/payables']) {
      await page.goto(path);
      await expect(
        page.getByText('Halaman itu bukan untuk peran Anda'),
        `${path} harus tetap menolak kasir`
      ).toBeVisible();
    }
  });

  test('teknisi tidak ikut kebagian halaman piutang', async ({ page }) => {
    // Teknisi tidak menagih, jadi tidak butuh daftar piutang.
    await login(page, 'technician@demo.com');
    await page.goto('/finance/receivables');
    await expect(page.getByText('Halaman itu bukan untuk peran Anda')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// B. B1 — antrian di beranda teknisi + popup rincian
// ---------------------------------------------------------------------------

test.describe('R1.7-T2 — antrian di beranda, rincian lewat popup', () => {
  test('beranda teknisi menampilkan baris antrian, bukan cuma angkanya', async ({ page }) => {
    const nama = 'Antrian Beranda ' + Date.now();
    await createUnassignedTicket(page, nama);

    await login(page, 'technician@demo.com');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const antrian = page.getByTestId('beranda-antrian');
    await expect(antrian).toBeVisible();
    await expect(antrian.getByTestId('beranda-antrian-row').filter({ hasText: nama })).toHaveCount(1);
  });

  test('popup menampilkan catatan kasir dan mengambil pekerjaan tanpa pindah halaman', async ({ page }) => {
    const nama = 'Popup Ambil ' + Date.now();
    await createUnassignedTicket(page, nama, {
      reportedComplaint: 'Tidak bisa mengisi daya sama sekali',
      devicePasscode: 'pola:1-2-3-6',
    });

    await login(page, 'technician@demo.com');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('beranda-antrian-row').filter({ hasText: nama }).click();

    const dialog = page.getByTestId('antrian-detail-dialog');
    await expect(dialog).toBeVisible();
    // Yang pemilik minta terlihat: keluhan dan pola yang dicatat kasir.
    await expect(dialog.getByTestId('antrian-keluhan')).toContainText('Tidak bisa mengisi daya');
    await expect(dialog.getByTestId('antrian-sandi')).toContainText('1-2-3-6');

    await dialog.getByTestId('antrian-ambil').click();

    // Popup tertutup, tetap di beranda, dan tiketnya pindah ke milik sendiri.
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(page.getByTestId('beranda-antrian-row').filter({ hasText: nama })).toHaveCount(0);
    await expect(page.getByTestId('technician-ticket-row').filter({ hasText: nama })).toHaveCount(1);
  });

  test('di /tickets, "Lihat" pada antrian membuka popup yang sama', async ({ page }) => {
    const nama = 'Lihat Antrian ' + Date.now();
    await createUnassignedTicket(page, nama);

    await login(page, 'technician@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    const baris = page.getByTestId('unassigned-list').locator('tr', { hasText: nama });
    await baris.getByTestId('lihat-antrian').click();

    await expect(page.getByTestId('antrian-detail-dialog')).toBeVisible();
    // Tetap di /tickets — tidak membuka halaman baru.
    await expect(page).toHaveURL(/\/tickets\/?$/);
  });

  test('tiket yang sudah dipegang tetap membuka halaman kerja penuh', async ({ page }) => {
    // Popup sengaja HANYA untuk memutuskan mau mengambil atau tidak; biaya,
    // daftar periksa, dan perpindahan tahap tidak muat di dalamnya.
    const nama = 'Sudah Dipegang ' + Date.now();
    const ticketId = await createUnassignedTicket(page, nama);
    const token = await apiToken(page, 'technician@demo.com');
    await page.request.post(`${API_BASE}/tickets/${ticketId}/claim`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() },
    });

    await login(page, 'technician@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    const baris = page.getByTestId('my-jobs-list').locator('tr', { hasText: nama });
    await expect(baris.getByTestId('lihat-antrian')).toHaveCount(0);
    await baris.getByRole('link', { name: /Buka/ }).click();
    await expect(page).toHaveURL(new RegExp(`/tickets/${ticketId}`));
  });
});

// ---------------------------------------------------------------------------
// C. B3 — teknisi tidak memilih teknisi lain
// ---------------------------------------------------------------------------

test.describe('R1.7-T3 — pemilih teknisi hanya untuk yang berwenang', () => {
  test('teknisi hanya membaca nama pemegang tiket, tanpa dropdown', async ({ page }) => {
    const nama = 'Tanpa Dropdown ' + Date.now();
    const ticketId = await createUnassignedTicket(page, nama);

    await login(page, 'technician@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('assigned-technician-name')).toBeVisible();
    await expect(page.locator('select').filter({ hasText: 'Pilih Teknisi' })).toHaveCount(0);
    // Yang TIDAK boleh ikut hilang: mengambil pekerjaan untuk diri sendiri.
    await expect(page.getByTestId('claim-ticket')).toBeVisible();
  });

  test('manajer tetap bisa menugaskan teknisi', async ({ page }) => {
    const nama = 'Manajer Menugaskan ' + Date.now();
    const ticketId = await createUnassignedTicket(page, nama);

    await login(page, 'manager@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('select').filter({ hasText: 'Pilih Teknisi' })).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// D. E1 — riwayat unit masuk di halaman Terima Unit
// ---------------------------------------------------------------------------

test.describe('R1.7-T4 — kasir bisa memastikan unit yang barusan dicatat', () => {
  test('tiket yang baru disimpan langsung muncul di riwayat, tanpa memuat ulang', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const nama = 'Riwayat Intake ' + Date.now();
    await page.locator('#name').fill(nama);
    await page.locator('#type').selectOption('Smartphone');
    // R1.8-T1 — merek, model & keluhan kini wajib.
    await page.locator('#brand').fill('Samsung');
    await page.locator('#model').fill('A10');
    await page.locator('#complaint').fill('Layar mati total');
    await page.getByRole('button', { name: /Simpan|Terima Unit/i }).first().click();

    await expect(page.getByText('berhasil dibuat')).toBeVisible({ timeout: 15_000 });

    const riwayat = page.getByTestId('intake-riwayat');
    await expect(riwayat).toBeVisible();
    await expect(riwayat.getByTestId('intake-riwayat-row').filter({ hasText: nama })).toHaveCount(1);
  });

  test('riwayat tetap ada setelah halaman dimuat ulang', async ({ page }) => {
    // Dimuat dari server, bukan hanya dikumpulkan di memori halaman.
    const nama = 'Riwayat Bertahan ' + Date.now();
    await createUnassignedTicket(page, nama);

    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('intake-riwayat').getByTestId('intake-riwayat-row').filter({ hasText: nama })).toHaveCount(1);
  });
});
