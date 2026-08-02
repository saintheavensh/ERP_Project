import { test, expect, type Page } from '@playwright/test';

/**
 * R1.8 — perbaikan dari uji manual R1.7 pemilik.
 *
 * T1 (uji-R1.7 D1): "kalau bisa di perketat lagi validasinya, saya bisa input
 * tiket service meskipun unit service belum di isi, dan buat keluhan /
 * kerusakan jadi kolom wajib di isi".
 *
 * Dua hal yang berkas ini jaga, dan keduanya pernah jadi bug nyata di proyek ini:
 *
 * 1. Gerbangnya di BACKEND, bukan di form. Tes API di bawah memanggil endpoint
 *    langsung — melewati form sepenuhnya — karena "form terkunci" adalah kunci
 *    semu (S5, lalu diulang R1.5C).
 * 2. Aturan baru TIDAK BOLEH menutup jalan yang pemilik minta tetap terbuka:
 *    merek/model di luar katalog device harus tetap tersimpan (keputusan
 *    2026-08-02, "bisa di isi merknya Advan tipenya G30 jadi flexible"). Kalau
 *    tes itu gagal, T1 sudah merusak fondasi yang T5 andalkan.
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

const unitLengkap = {
  assetType: 'Handphone',
  assetBrand: 'Samsung',
  assetModel: 'A10',
  reportedComplaint: 'Layar mati total',
  branchId: BRANCH_PUSAT,
};

async function intake(page: Page, body: Record<string, unknown>) {
  const token = await apiToken(page, 'cashier@demo.com');
  return page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
}

// ---------------------------------------------------------------------------
// A. Gerbangnya di backend — form dilewati sepenuhnya
// ---------------------------------------------------------------------------

test.describe('R1.8-T1 — API menolak unit/keluhan yang belum diisi', () => {
  test('unit yang cuma berisi "Jenis" ditolak — kasus persis yang pemilik temukan', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Tanpa Unit ' + Date.now(),
      assetBrand: '',
      assetModel: '',
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).error.message).toContain('Merek unit wajib diisi');
  });

  test('model kosong (spasi saja) ditolak', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Tanpa Model ' + Date.now(),
      assetModel: '   ',
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).error.message).toContain('Model / tipe unit wajib diisi');
  });

  test('keluhan kosong ditolak', async ({ page }) => {
    const { reportedComplaint, ...tanpaKeluhan } = unitLengkap;
    const res = await intake(page, { ...tanpaKeluhan, customerName: 'Uji Tanpa Keluhan ' + Date.now() });

    expect(res.status()).toBe(400);
    expect((await res.json()).error.message).toBe('Keluhan / kerusakan wajib diisi.');
  });

  // Begitu sebuah kolom jadi wajib, jalan pintas yang selalu muncul adalah
  // mengetik "-" supaya form lolos. Itu bukan keluhan.
  test('keluhan berisi "-" saja ditolak', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Strip ' + Date.now(),
      reportedComplaint: '-',
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).error.message).toContain('minimal 3 huruf');
  });

  // R1.6-T1 pernah membuat pesan galat sampai ke layar kasir sebagai JSON
  // mentah. Yang dijaga di sini bukan kalimat persisnya, melainkan bahwa
  // isinya BUKAN JSON.
  test('pesan penolakannya kalimat, bukan JSON mentah', async ({ page }) => {
    const { reportedComplaint, ...tanpaKeluhan } = unitLengkap;
    const res = await intake(page, { ...tanpaKeluhan, customerName: 'Uji Pesan ' + Date.now() });

    const pesan = (await res.json()).error.message as string;
    expect(pesan.startsWith('[')).toBe(false);
    expect(pesan).not.toContain('"code"');
    expect(pesan).not.toContain('ZodError');
  });
});

// ---------------------------------------------------------------------------
// B. Yang TIDAK boleh ikut tertutup
// ---------------------------------------------------------------------------

test.describe('R1.8-T1 — aturan baru tidak menutup jalan yang harus tetap terbuka', () => {
  // Keputusan pemilik 2026-08-02. Kalau ini gagal, kasir mentok di depan
  // pelanggan tiap kali unit yang masuk tidak ada di katalog device.
  test('merek/model di luar katalog tetap diterima (Advan G30)', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Advan ' + Date.now(),
      assetBrand: 'Advan',
      assetModel: 'G30',
    });

    expect(res.status()).toBe(201);
  });

  // Sandi/pola sengaja TETAP opsional — tidak semua unit terkunci, dan memaksa
  // staf mengarang sandi jauh lebih buruk daripada membiarkannya kosong (R1.5C).
  test('sandi/pola tetap boleh kosong', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Tanpa Sandi ' + Date.now(),
      devicePasscode: '',
    });

    expect(res.status()).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// C. PATCH — jalur tulis kedua, aturan yang sama
// ---------------------------------------------------------------------------

test.describe('R1.8-T1 — keluhan tak bisa dikosongkan lewat pintu belakang', () => {
  test('PATCH menolak mengosongkan keluhan, tapi tetap mengizinkan mengosongkan sandi', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const dibuat = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji PATCH ' + Date.now(),
      devicePasscode: '1234',
    });
    expect(dibuat.status()).toBe(201);
    const ticketId = (await dibuat.json()).data.id as string;

    const kosongkanKeluhan = await page.request.patch(`${API_BASE}/tickets/${ticketId}/intake-details`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { reportedComplaint: null },
    });
    expect(kosongkanKeluhan.status()).toBe(400);
    expect((await kosongkanKeluhan.json()).error.message).toBe('Keluhan / kerusakan wajib diisi.');

    // Sandi BOLEH dikosongkan — memang dihapus saat unit diserahkan kembali.
    const kosongkanSandi = await page.request.patch(`${API_BASE}/tickets/${ticketId}/intake-details`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { devicePasscode: null },
    });
    expect(kosongkanSandi.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// D. Form — peringatan lebih awal, dan tidak ada tiket yang lolos
// ---------------------------------------------------------------------------

test.describe('R1.8-T1 — form Terima Unit memberi tahu sebelum menyimpan', () => {
  test('menekan Simpan tanpa keluhan: pesan muncul, kasir tetap di form, tak ada tiket dibuat', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const nama = 'Uji Form Tanpa Keluhan ' + Date.now();
    await page.locator('#name').fill(nama);
    await page.locator('#type').selectOption('Smartphone');
    await page.locator('#brand').fill('Samsung');
    await page.locator('#model').fill('A10');
    // Keluhan sengaja dibiarkan kosong.

    await page.getByRole('button', { name: /Simpan|Terima Unit/i }).first().click();

    await expect(page.getByText(/Keluhan \/ kerusakan wajib diisi/)).toBeVisible();
    expect(page.url()).toContain('/tickets/intake');
    // Tidak ada toast sukses — bukti tiketnya benar-benar tidak dibuat, bukan
    // sekadar pesan yang menumpang di atas tiket yang terlanjur tersimpan.
    await expect(page.getByText(/berhasil dibuat/)).toHaveCount(0);
  });

  test('kolom wajib ditandai bintang di form', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    for (const label of [/^Merek/, /^Model \/ Tipe/, /^Keluhan \/ Kerusakan/]) {
      await expect(page.locator('label').filter({ hasText: label }).first()).toContainText('*');
    }
  });

  // Regresi R1.5D: aturan baru tidak boleh diam-diam mengembalikan lemparan ke
  // halaman detail — kasir harus tetap di form setelah simpan yang berhasil.
  test('intake lengkap tetap berhasil dan kasir tetap di form', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const nama = 'Uji Form Lengkap ' + Date.now();
    await page.locator('#name').fill(nama);
    await page.locator('#type').selectOption('Smartphone');
    await page.locator('#brand').fill('Samsung');
    await page.locator('#model').fill('A10');
    await page.locator('#complaint').fill('Layar mati total');

    await page.getByRole('button', { name: /Simpan|Terima Unit/i }).first().click();

    await expect(page.getByText(/berhasil dibuat/)).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/tickets/intake');
  });
});
