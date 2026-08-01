import { test, expect, type Page } from '@playwright/test';

/**
 * R1.6 — perbaikan dari uji manual R1.5 pemilik.
 *
 * Tiap tes di sini menjaga satu temuan yang pemilik dapatkan dengan MEMAKAI
 * aplikasinya, bukan dengan membaca kode — kelas bug yang 278 unit test dan
 * `tsc` bersih tidak pernah menangkap.
 *
 * Tes membuat datanya sendiri lewat API supaya tidak bergantung pada urutan
 * jalan atau sisa data tes lain (konvensi yang sama dengan r1-peran-akses).
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
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}

// ---------------------------------------------------------------------------
// A. T1 — pesan validasi berhenti berupa JSON mentah (uji-R1.5 C1/C3)
// ---------------------------------------------------------------------------

test.describe('R1.6-T1 — pesan validasi adalah kalimat, bukan JSON', () => {
  test('pola kurang dari 4 titik: pesan bersih, tanpa bentuk array/JSON', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const res = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerName: 'Uji Pola Pendek',
        assetType: 'Handphone',
        branchId: BRANCH_PUSAT,
        devicePasscode: 'pola:1-2-3',
      },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Pola minimal 4 titik.');

    // Inti temuan pemilik: tak boleh ada jejak JSON di pesan yang tampil.
    // Dicek eksplisit, bukan lewat toBe di atas saja — kalau pesannya nanti
    // diubah, tes ini tetap menjaga bentuknya.
    expect(body.error.message).not.toContain('[');
    expect(body.error.message).not.toContain('"code"');
    expect(body.error.message).not.toContain('"path"');
  });

  test('sandi kurang dari 4 karakter: pesan bersih', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const res = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { customerName: 'Uji Sandi Pendek', assetType: 'Handphone', branchId: BRANCH_PUSAT, devicePasscode: '12' },
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).error.message).toBe('Sandi/PIN minimal 4 karakter.');
  });

  test('amplop standar berlaku di endpoint LAIN juga, bukan cuma intake', async ({ page }) => {
    // Ini yang membuktikan perbaikannya di pembungkus zValidator, bukan
    // tambalan di satu halaman. Pelanggan tanpa nama = kolom wajib kosong.
    const token = await apiToken(page, 'cashier@demo.com');
    const res = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { phone: '081200000000' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).not.toContain('"code"');
    expect(body.error.message).not.toContain('"path"');
    // Amplop proyek utuh, bukan bentuk bawaan Hono `{ success: false }`.
    expect(body).toHaveProperty('meta.request_id');
    expect(body.data).toBeNull();
  });

  test('pola 4 titik tetap diterima — gerbangnya tidak kebablasan', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const res = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerName: 'Uji Pola Sah',
        assetType: 'Handphone',
        branchId: BRANCH_PUSAT,
        devicePasscode: 'pola:1-2-3-6',
      },
    });
    expect(res.status()).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// B. T2 — tombol Ambil langsung di baris antrian (uji-R1.5 B3)
// ---------------------------------------------------------------------------

test.describe('R1.6-T2 — ambil pekerjaan cukup satu klik dari daftar', () => {
  test('tombol Ambil ada di baris antrian dan memindahkan tiket tanpa buka detail', async ({ page }) => {
    const nama = 'Klaim Dari Daftar ' + Date.now();
    await createUnassignedTicket(page, nama);

    await login(page, 'technician@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    const antrian = page.getByTestId('unassigned-list');
    const baris = antrian.locator('tr', { hasText: nama });
    await expect(baris).toHaveCount(1);

    // Tombol harus ada DI BARIS itu — inti keluhan pemilik.
    const tombol = baris.getByTestId('claim-from-list');
    await expect(tombol).toBeVisible();

    await tombol.click();

    // Tetap di /tickets: tidak ada lemparan ke halaman detail.
    await expect(page).toHaveURL(/\/tickets\/?$/);
    await expect(antrian.locator('tr', { hasText: nama })).toHaveCount(0);
    await expect(page.getByTestId('my-jobs-list').locator('tr', { hasText: nama })).toHaveCount(1);
  });

  test('tombol Ambil TIDAK muncul di daftar "Sedang Saya Kerjakan"', async ({ page }) => {
    // Tombol yang kelihatan hidup tapi tak berguna adalah anti-pattern yang
    // Track F ada untuk membasminya.
    const nama = 'Sudah Milik Saya ' + Date.now();
    const ticketId = await createUnassignedTicket(page, nama);

    const token = await apiToken(page, 'technician@demo.com');
    const claim = await page.request.post(`${API_BASE}/tickets/${ticketId}/claim`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() },
    });
    expect(claim.status()).toBe(200);

    await login(page, 'technician@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    const milikSaya = page.getByTestId('my-jobs-list').locator('tr', { hasText: nama });
    await expect(milikSaya).toHaveCount(1);
    await expect(milikSaya.getByTestId('claim-from-list')).toHaveCount(0);
  });

  test('teknisi kedua tidak lagi melihat tiket yang sudah diambil teknisi pertama', async ({ page }) => {
    // Poin B6 uji R1 — belum pernah bisa diuji karena seed hanya punya SATU
    // teknisi. R1.6-T3 menambahkan Teknisi Rina justru untuk tes ini.
    const nama = 'Diambil Andi ' + Date.now();
    const ticketId = await createUnassignedTicket(page, nama);

    const tokenAndi = await apiToken(page, 'technician@demo.com');
    await page.request.post(`${API_BASE}/tickets/${ticketId}/claim`, {
      headers: { Authorization: `Bearer ${tokenAndi}`, 'Idempotency-Key': crypto.randomUUID() },
    });

    await login(page, 'technician2@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('unassigned-list').locator('tr', { hasText: nama })).toHaveCount(0);
    await expect(page.getByTestId('my-jobs-list').locator('tr', { hasText: nama })).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// C. T3 — kartu Piutang punya isi (uji-R1.5 A6)
// ---------------------------------------------------------------------------

test.describe('R1.6-T3 — kartu Piutang kasir tidak lagi selalu nol', () => {
  test('kasir melihat piutang dari seed, dan tetap ditolak di buku kas', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');

    const ar = await page.request.get(`${API_BASE}/finance/receivables`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(ar.status()).toBe(200);
    const faktur = (await ar.json()).data as { grandTotal: string; amountPaid: string }[];
    expect(faktur.length).toBeGreaterThanOrEqual(2);

    const sisa = faktur.reduce((s, f) => s + (Number(f.grandTotal) - Number(f.amountPaid)), 0);
    expect(sisa).toBeGreaterThan(0);

    // Dua hal berbeda yang mudah tertukar: kasir BOLEH menagih (piutang),
    // TIDAK BOLEH melihat omzet/modal/laba (buku kas).
    for (const ep of ['/finance/ledger', '/finance/payables']) {
      const res = await page.request.get(`${API_BASE}${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status(), `kasir harus 403 di ${ep}`).toBe(403);
    }
  });
});

// ---------------------------------------------------------------------------
// D. T4 — alamat ?ditolak= bersih sendiri (uji-R1.5 A3)
// ---------------------------------------------------------------------------

test.describe('R1.6-T4 — alamat ?ditolak= dibersihkan setelah kotaknya tampil', () => {
  test('kotak kuning tetap muncul, tapi parameternya hilang dari alamat', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/flows');

    const kotak = page.getByRole('alert').filter({ hasText: 'bukan untuk peran Anda' });
    await expect(kotak).toBeVisible();

    // Isi pesannya tetap menyebut halaman yang ditolak…
    await expect(kotak).toContainText('/flows');
    // …tapi alamatnya sudah bersih, jadi refresh/bookmark tidak mengulangnya.
    await expect(page).toHaveURL((url) => !url.searchParams.has('ditolak'));
  });

  test('setelah refresh, kotak kuning tidak muncul lagi', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/settings');
    await expect(page.getByRole('alert').filter({ hasText: 'bukan untuk peran Anda' })).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('alert').filter({ hasText: 'bukan untuk peran Anda' })).toHaveCount(0);
  });
});
