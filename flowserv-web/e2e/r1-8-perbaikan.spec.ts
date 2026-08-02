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

// ---------------------------------------------------------------------------
// E. T2 — kasir bisa melihat rincian tagihan piutang (uji-R1.7 A1)
// ---------------------------------------------------------------------------

test.describe('R1.8-T2 — rincian tagihan piutang untuk kasir', () => {
  // Bukan memeriksa tombolnya ADA — menekannya sampai isinya terbaca. Itu
  // langkah yang absen di R1.6 dan membuat bug C2 lolos ke tangan pemilik.
  test('kasir menekan Rincian dan benar-benar membaca isi tagihannya', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/finance/receivables');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('ar-rincian').first().click();

    const modal = page.getByTestId('ar-detail-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('ar-detail-lines')).toBeVisible({ timeout: 15_000 });
    await expect(modal.getByText('Isi Tagihan')).toBeVisible();
    // Nama pelanggan dan sisa piutang adalah dua hal yang dipakai kasir saat
    // menagih; keduanya harus terisi, bukan sekadar kerangka modalnya muncul.
    await expect(page.getByTestId('ar-detail-customer')).not.toBeEmpty();
    await expect(page.getByTestId('ar-detail-sisa')).toContainText('Rp');
  });

  // Kontrol yang pasti gagal saat ditekan adalah anti-pattern yang Track F ada
  // untuk membasminya, dan R1.7-T3 baru saja bereskan pada pemilih teknisi.
  test('rincian untuk kasir tidak menawarkan Void maupun Ubah', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/finance/receivables');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('ar-rincian').first().click();

    const modal = page.getByTestId('ar-detail-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: /Void/i })).toHaveCount(0);
    await expect(modal.getByRole('button', { name: /Ubah/i })).toHaveCount(0);
  });

  // T2 tidak boleh melonggarkan apa pun: kartu piutang boleh dibuka kasir,
  // buku kas dan laba toko tetap tidak.
  test('kasir tetap ditolak di /finance, /finance/ledger, /finance/payables', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    for (const path of ['/finance', '/finance/ledger', '/finance/payables']) {
      await page.goto(path);
      await expect(page.getByText('Halaman itu bukan untuk peran Anda')).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// F. T5 — katalog device tahu ada unit yang belum berkatalog
// ---------------------------------------------------------------------------

test.describe('R1.8-T5 — panel "Belum ada di katalog"', () => {
  test('unit di luar katalog muncul; unit yang cocok katalog TIDAK muncul', async ({ page }) => {
    const merekAsing = 'Advan';
    const modelAsing = 'G30-' + Date.now();
    await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Katalog ' + Date.now(),
      assetBrand: merekAsing,
      assetModel: modelAsing,
    });
    // Unit yang mereknya PERSIS ada di katalog seed — tidak boleh ikut muncul.
    await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Katalog Cocok ' + Date.now(),
      assetBrand: 'Samsung',
      assetModel: 'Galaxy A10',
    });

    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    const panel = page.getByTestId('uncatalogued-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(`${merekAsing} ${modelAsing}`)).toBeVisible();
    // Inti tes ini: `device_model_id` NULL saja tidak cukup untuk berkata
    // "belum ada di katalog" — teksnya harus ikut diperiksa, kalau tidak
    // panelnya menyuruh admin menambahkan yang sudah ada.
    await expect(panel.getByText('Samsung Galaxy A10')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// G. T6 & T7 — teknisi opsional + perkiraan biaya di intake
// ---------------------------------------------------------------------------

test.describe('R1.8-T6 — kasir boleh menunjuk teknisi, opsional', () => {
  test('tanpa teknisi: tiket masuk antrian "Menunggu Diambil"', async ({ page }) => {
    const nama = 'Uji Antrian ' + Date.now();
    const res = await intake(page, { ...unitLengkap, customerName: nama });
    expect(res.status()).toBe(201);
    expect((await res.json()).data.assignedTechnicianId).toBeFalsy();
  });

  test('dengan teknisi: tiket langsung bertuan dan TIDAK muncul di antrian', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const tekRes = await page.request.get(`${API_BASE}/users?role=Technician`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const teknisi = (await tekRes.json()).data[0];

    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Ditunjuk ' + Date.now(),
      assignedTechnicianId: teknisi.id,
    });
    expect(res.status()).toBe(201);
    const ticketId = (await res.json()).data.id as string;

    const antrian = await page.request.get(`${API_BASE}/tickets?assignedTo=none`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ids = ((await antrian.json()).data as any[]).map((t) => t.id);
    expect(ids).not.toContain(ticketId);
  });

  // Tanpa ini kasir bisa "menugaskan" pemilik toko atau kasir lain, dan
  // tiketnya hilang dari antrian tanpa ada yang mengerjakannya.
  test('menunjuk orang yang bukan teknisi ditolak', async ({ page }) => {
    const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'admin123' },
    });
    const adminId = (await loginRes.json()).data.user.id as string;

    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Salah Tunjuk ' + Date.now(),
      assignedTechnicianId: adminId,
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('TECHNICIAN_NOT_FOUND');
  });
});

test.describe('R1.8-T7 — perkiraan biaya di intake, bukan biaya sungguhan', () => {
  test('perkiraan tersimpan dan terlihat teknisi di halaman tiket', async ({ page }) => {
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Perkiraan ' + Date.now(),
      intakeEstimatedCost: 450000,
    });
    expect(res.status()).toBe(201);
    const ticketId = (await res.json()).data.id as string;

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    const estimate = page.getByTestId('intake-estimate');
    await expect(estimate).toBeVisible();
    await expect(estimate).toContainText('450.000');
  });

  // Inti T7: aturan tahap Penerimaan dari S5 TIDAK ikut dicabut. Kalau tes ini
  // hijau padahal biaya sungguhan lolos di Intake, T7 sudah membongkar gerbang
  // yang justru dipasang supaya tiket tak punya tagihan sebelum diperiksa.
  test('biaya SUNGGUHAN tetap ditolak di tahap Intake (422)', async ({ page }) => {
    const token = await apiToken(page, 'admin@demo.com');
    const res = await intake(page, {
      ...unitLengkap,
      customerName: 'Uji Gerbang Biaya ' + Date.now(),
      intakeEstimatedCost: 450000,
    });
    const ticketId = (await res.json()).data.id as string;

    const charge = await page.request.post(`${API_BASE}/tickets/${ticketId}/charges`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { sourceType: 'labor', description: 'Jasa ganti LCD', quantity: 1, unitPrice: 150000 },
    });
    expect(charge.status()).toBe(422);
    expect((await charge.json()).error.code).toBe('CHARGES_NOT_ALLOWED_AT_STAGE');
  });

  test('tanpa perkiraan: tak ada baris perkiraan di halaman tiket', async ({ page }) => {
    const res = await intake(page, { ...unitLengkap, customerName: 'Uji Tanpa Perkiraan ' + Date.now() });
    const ticketId = (await res.json()).data.id as string;

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('intake-estimate')).toHaveCount(0);
  });
});
