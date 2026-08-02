import { test, expect, type Page } from '@playwright/test';

/**
 * R1 — Peran & Akses.
 *
 * Dua bug yang diperbaiki fase ini, keduanya lolos dari 262 unit test + tsc
 * bersih karena tak satu pun menjalankan aplikasinya sebagai kasir/teknisi:
 *
 *  1. Kasir tak punya izin `ticket.create` (403 di POST /v1/tickets/intake) DAN
 *     tak punya baris menu "Servis" — padahal `modules/flow/backbone.ts` menulis
 *     tahap Intake sebagai pekerjaan kasir sejak Tahap B.
 *  2. Daftar tiket teknisi di-filter `?assignedTo=me` mati — jadi tiket yang
 *     belum bertuan tidak muncul di mana pun, halaman detailnya tak terjangkau,
 *     dan tombol "Ambil Pekerjaan" (yang sudah benar) tak pernah bisa ditekan.
 *
 * Tiap tes membuat tiketnya sendiri lewat API supaya tidak bergantung pada
 * urutan jalan atau sisa data tes lain.
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
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  return (await res.json()).data.token as string;
}

/** Tiket baru tanpa teknisi, dibuat lewat API sebagai kasir. */
async function createUnassignedTicket(page: Page, customerName: string) {
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
    },
  });
  expect(res.status(), 'kasir harus boleh membuat tiket servis').toBe(201);
  return (await res.json()).data.id as string;
}

// ---------------------------------------------------------------------------
// A. Kasir membuat tiket servis
// ---------------------------------------------------------------------------

test('kasir punya menu Servis dan bisa membuka form Terima Unit', async ({ page }) => {
  await login(page, 'cashier@demo.com');

  const sidebar = page.locator('aside');
  await expect(sidebar.getByRole('link', { name: 'Servis' })).toBeVisible();

  await sidebar.getByRole('link', { name: 'Servis' }).click();
  await page.waitForURL('**/tickets');
  await page.getByRole('link', { name: 'Terima Unit' }).click();
  await page.waitForURL('**/tickets/intake');

  // Yang membedakan lolos dari gagal: form-nya benar-benar ada, bukan halaman
  // kosong atau pesan izin. (`locator('form')` tidak dipakai — form logout di
  // sidebar ikut cocok.)
  await expect(page.locator('#name')).toBeVisible();
  await expect(page.locator('#complaint')).toBeVisible();
  await expect(page.getByText(/tidak punya izin|PERMISSION_DENIED/i)).toHaveCount(0);
});

test('kasir membuat tiket lewat UI dan tiketnya muncul di daftar', async ({ page }) => {
  const nama = `Pelanggan R1 ${Date.now()}`;
  await login(page, 'cashier@demo.com');
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');

  await page.locator('#name').fill(nama);
  await page.locator('#phone').fill('081200099988');
  // "Jenis" wajib diisi (required, default kosong) — tanpa ini submit diblokir
  // validasi browser dan halaman diam saja.
  await page.locator('#type').selectOption('Smartphone');
  // R1.8-T1 — merek & model kini wajib juga.
  await page.locator('#brand').fill('Samsung');
  await page.locator('#model').fill('A10');
  await page.locator('#complaint').fill('Tidak bisa mengisi daya');

  await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
  // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
  // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
  // menempuh jalan yang sama seperti kasir sungguhan.
  await page.getByRole('link', { name: 'Lihat tiket' }).click();
  await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(nama).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// B. Teknisi mengambil pekerjaan
// ---------------------------------------------------------------------------

test('teknisi melihat dua kelompok, dan tiket tak bertuan ada di "Menunggu Diambil"', async ({ page }) => {
  const nama = `Antrian R1 ${Date.now()}`;
  await createUnassignedTicket(page, nama);

  await login(page, 'technician@demo.com');
  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Menunggu Diambil' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sedang Saya Kerjakan' })).toBeVisible();

  // Ada di antrian, TIDAK ada di daftar punya sendiri.
  await expect(page.getByTestId('unassigned-list').getByText(nama)).toBeVisible();
  await expect(page.getByTestId('my-jobs-list').getByText(nama)).toHaveCount(0);
});

test('teknisi mengambil pekerjaan: tiket pindah kelompok tanpa reload manual', async ({ page }) => {
  const nama = `Ambil R1 ${Date.now()}`;
  const ticketId = await createUnassignedTicket(page, nama);

  await login(page, 'technician@demo.com');
  await page.goto(`/tickets/${ticketId}`);
  await page.waitForLoadState('networkidle');

  await page.getByTestId('claim-ticket').click();
  // Tombolnya hilang begitu tiket bertuan. Sengaja BUKAN mencari teks
  // "Teknisi Andi": nama itu juga tertulis di sidebar ("Masuk sebagai"), jadi
  // assertion-nya akan lulus walau klaimnya gagal — persis yang terjadi di
  // percobaan pertama.
  await expect(page.getByTestId('claim-ticket')).toHaveCount(0, { timeout: 15_000 });

  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('my-jobs-list').getByText(nama)).toBeVisible();
  await expect(page.getByTestId('unassigned-list').getByText(nama)).toHaveCount(0);
});

test('tiket yang sudah diambil tidak lagi muncul sebagai antrian bagi teknisi lain', async ({ page }) => {
  const nama = `Sudah Diambil R1 ${Date.now()}`;
  const ticketId = await createUnassignedTicket(page, nama);

  // Manager menugaskan tiket ini ke teknisi lewat API — mensimulasikan "sudah
  // dipegang orang", tanpa perlu akun teknisi kedua di seed.
  const manager = await apiToken(page, 'manager@demo.com');
  const users = await (await page.request.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${manager}` },
  })).json();
  const teknisi = users.data.find((u: { name: string }) => u.name === 'Teknisi Andi');
  const assign = await page.request.post(`${API_BASE}/tickets/${ticketId}/assign`, {
    headers: { Authorization: `Bearer ${manager}` },
    data: { technicianId: teknisi.id },
  });
  expect(assign.ok()).toBeTruthy();

  await login(page, 'technician@demo.com');
  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('unassigned-list').getByText(nama)).toHaveCount(0);
});

test('beranda teknisi menampilkan kartu "Menunggu Diambil" yang menuju daftar tiket', async ({ page }) => {
  await createUnassignedTicket(page, `Beranda R1 ${Date.now()}`);

  await login(page, 'technician@demo.com');
  await page.waitForLoadState('networkidle');

  const kartu = page.getByRole('link').filter({ hasText: 'Menunggu Diambil' });
  await expect(kartu).toBeVisible();
  await kartu.click();
  await page.waitForURL('**/tickets');
  await expect(page.getByRole('heading', { name: 'Menunggu Diambil' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// C. Regresi — R1 hanya menambah SATU izin, tidak melonggarkan yang lain
// ---------------------------------------------------------------------------

test('peran non-teknisi tetap melihat satu daftar tiket, bukan dua kelompok', async ({ page }) => {
  await login(page, 'manager@demo.com');
  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Servis' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Menunggu Diambil' })).toHaveCount(0);
});

test('kasir tetap ditolak untuk hal di luar membuat tiket', async ({ page }) => {
  const token = await apiToken(page, 'cashier@demo.com');
  const headers = { Authorization: `Bearer ${token}` };

  // Bukti bahwa yang ditambahkan benar-benar hanya `ticket.create`.
  const supplier = await page.request.post(`${API_BASE}/suppliers`, {
    headers,
    data: { name: 'Supplier Uji', type: 'distributor' },
  });
  expect(supplier.status(), 'kasir tidak boleh mengelola supplier').toBe(403);

  const branch = await page.request.post(`${API_BASE}/branches`, {
    headers,
    data: { name: 'Cabang Uji' },
  });
  expect(branch.status(), 'kasir tidak boleh membuat cabang').toBe(403);

  const audit = await page.request.get(`${API_BASE}/audit-logs`, { headers });
  expect(audit.status(), 'kasir tidak boleh melihat log audit').toBe(403);
});

test('kasir tidak bisa mengambil pekerjaan (itu wewenang teknisi)', async ({ page }) => {
  const ticketId = await createUnassignedTicket(page, `Klaim Kasir R1 ${Date.now()}`);
  const token = await apiToken(page, 'cashier@demo.com');

  const claim = await page.request.post(`${API_BASE}/tickets/${ticketId}/claim`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(claim.status()).toBe(403);
});

// ---------------------------------------------------------------------------
// D. HP
// ---------------------------------------------------------------------------

test('daftar dua kelompok tidak meluber ke samping di layar 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await createUnassignedTicket(page, `Mobile R1 ${Date.now()}`);

  await login(page, 'technician@demo.com');
  await page.goto('/tickets');
  await page.waitForLoadState('networkidle');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, 'halaman tidak boleh geser horizontal di HP').toBeLessThanOrEqual(1);
});
