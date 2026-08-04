import { test, expect, type Page } from '@playwright/test';

/**
 * R1.9 — perbaikan dari uji manual R1.8 pemilik.
 *
 * Aturan yang berkas ini pegang, diturunkan dari kegagalan nyata proyek ini:
 *
 * 1. **Ikuti tautannya, tekan tombolnya.** Tes R1.6 memeriksa kartu Piutang
 *    "tampil" dan API-nya 200, tak satu pun MENGKLIKNYA — dan bug C2 lolos ke
 *    tangan pemilik. T1 di bawah karena itu menekan baris menunya sampai
 *    halamannya benar-benar terbuka, lalu meneruskan ke "Servis Unit Ini".
 * 2. **Gerbangnya di backend.** Setiap aturan baru diuji lewat panggilan API
 *    langsung, melewati layar sepenuhnya — "form terkunci" adalah kunci semu
 *    (S5, R1.5C, R1.8-T1 sudah membayarnya tiga kali).
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
// T1 — kasir & manager punya jalan ke Pelanggan (uji-R1.8 A6)
// ---------------------------------------------------------------------------

test.describe('R1.9-T1 — jalan ke halaman Pelanggan', () => {
  // Bug ini bentuknya PERSIS sama dengan yang membuka seluruh cara kerja
  // fase-demi-fase ini: izin diberikan, jalannya tidak pernah dibuat. Akibatnya
  // poin uji A6 tak bisa dijalankan siapa pun.
  test('kasir MENGKLIK baris Pelanggan dan halamannya benar-benar terbuka', async ({ page }) => {
    await login(page, 'cashier@demo.com');

    const baris = page.locator('aside').getByRole('link', { name: 'Pelanggan', exact: true });
    await expect(baris).toBeVisible();
    await baris.click();

    // Bukan sekadar URL berubah: kalau route-access memantulkannya, kita akan
    // mendarat di '/' dengan pesan penolakan.
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole('heading', { name: 'Pelanggan' })).toBeVisible();
    await expect(page.getByText('Halaman itu bukan untuk peran Anda')).toHaveCount(0);
  });

  test('manager juga — ia punya customer.manage sejak H12 tapi tak punya barisnya', async ({ page }) => {
    await login(page, 'manager@demo.com');
    const baris = page.locator('aside').getByRole('link', { name: 'Pelanggan', exact: true });
    await expect(baris).toBeVisible();
    await baris.click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole('heading', { name: 'Pelanggan' })).toBeVisible();
  });

  test('teknisi TIDAK melihat barisnya — menu teknisi sengaja tetap 3 baris', async ({ page }) => {
    await login(page, 'technician@demo.com');
    await expect(page.locator('aside').getByRole('link', { name: 'Pelanggan', exact: true })).toHaveCount(0);
  });

  test('kasir menempuh pelanggan lama -> "Servis Unit Ini" -> tiket jadi', async ({ page }) => {
    // Jalur yang A6 mau buktikan: merek/model TIDAK diminta ulang (unitnya sudah
    // terdaftar), tapi keluhan TETAP wajib — aturan R1.8-T1 tidak boleh luntur
    // hanya karena masuk lewat pintu lain.
    await login(page, 'cashier@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /Lihat/ }).first().click();
    await page.waitForLoadState('networkidle');

    const servisLink = page.getByRole('link', { name: 'Servis Unit Ini' }).first();
    await expect(servisLink).toBeVisible();
    await servisLink.click();

    await expect(page).toHaveURL(/\/tickets\/intake\?/);
    await page.waitForLoadState('networkidle');

    // Merek/model TIDAK diminta ulang — unitnya sudah terdaftar, form
    // menampilkan ringkasan baca-saja (F7). Keluhan tetap satu-satunya yang
    // wajib diisi di sini.
    await expect(page.locator('#brand')).toHaveCount(0);
    await page.locator('#complaint').fill('Uji R1.9 T1 - dari pelanggan lama');
    await page.getByRole('button', { name: /Simpan & Terima Unit/i }).click();

    await expect(page.getByText(/berhasil dibuat/i)).toBeVisible({ timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------
// T1b — memberi hak utang bukan wewenang kasir
// ---------------------------------------------------------------------------

test.describe('R1.9-T1b — customer.allow_tempo', () => {
  test('kasir ditolak 403 saat mengubah allowTempo, tapi tetap bisa mengubah nama', async ({ page }) => {
    const token = await apiToken(page, 'cashier@demo.com');
    const daftar = await page.request.get(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pelanggan = (await daftar.json()).data[0];

    const ditolak = await page.request.put(`${API_BASE}/customers/${pelanggan.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: pelanggan.name, allowTempo: !pelanggan.allowTempo },
    });
    expect(ditolak.status()).toBe(403);
    expect((await ditolak.json()).error.message).toContain('customer.allow_tempo');

    // Gerbangnya harus sesempit wewenangnya: kasir memang mendaftarkan pelanggan
    // walk-in, jadi memblokir seluruh PUT akan merusak pekerjaan hariannya.
    const boleh = await page.request.put(`${API_BASE}/customers/${pelanggan.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: pelanggan.name, phone: '08' + Date.now().toString().slice(-9) },
    });
    expect(boleh.status()).toBe(200);
  });

  test('manager boleh; membuat pelanggan langsung dengan tempo juga digerbangi', async ({ page }) => {
    const tokenManager = await apiToken(page, 'manager@demo.com');
    const tokenKasir = await apiToken(page, 'cashier@demo.com');

    const olehManager = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${tokenManager}` },
      data: { name: 'Uji Tempo Manager ' + Date.now(), allowTempo: true },
    });
    expect(olehManager.status()).toBe(201);
    expect((await olehManager.json()).data.allowTempo).toBe(true);

    const olehKasir = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: { name: 'Uji Tempo Kasir ' + Date.now(), allowTempo: true },
    });
    expect(olehKasir.status()).toBe(403);

    const kasirBiasa = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: { name: 'Uji Walk-in Kasir ' + Date.now() },
    });
    expect(kasirBiasa.status()).toBe(201);
  });

  test('sakelar tempo hilang bagi kasir, tapi STATUSNYA tetap terbaca', async ({ page }) => {
    // Menyembunyikan tombol bukan keamanan (backend sudah 403 di atas) — ini
    // supaya kasir tak dihadapkan kontrol yang pasti gagal (anti-pattern Track
    // F, ditemukan pemilik lagi di R1.7-T3). Statusnya sengaja TETAP tampil:
    // kasir perlu tahu boleh/tidaknya menawarkan Tempo di kasir.
    await login(page, 'cashier@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Lihat/ }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('tempo-status')).toBeVisible();
    await expect(page.getByTestId('tempo-toggle')).toHaveCount(0);
    await expect(page.getByTestId('tempo-readonly')).toBeVisible();
  });

  test('super admin tetap melihat sakelarnya', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Lihat/ }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('tempo-toggle')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// T2 — piutang dikelompokkan per pelanggan (uji-R1.8 B1)
// ---------------------------------------------------------------------------

test.describe('R1.9-T2 — piutang per pelanggan', () => {
  test('dua nota satu pelanggan jadi SATU baris dengan subtotal benar', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/finance/receivables');
    await page.waitForLoadState('networkidle');

    // Seed R1.9 memberi Budi Santoso dua faktur belum lunas (450rb + 275rb).
    const grup = page.getByTestId('ar-grup').filter({ hasText: 'Budi Santoso' });
    await expect(grup).toHaveCount(1);
    await expect(grup.getByTestId('ar-grup-jumlah')).toHaveText('2 nota');
    await expect(grup.getByTestId('ar-grup-subtotal')).toContainText('725.000');
  });

  test('dibentang -> kedua notanya muncul, dan Rincian ditekan sampai isinya terbaca', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/finance/receivables');
    await page.waitForLoadState('networkidle');

    const grup = page.getByTestId('ar-grup').filter({ hasText: 'Budi Santoso' });
    const sebelum = await page.getByTestId('ar-nota').count();
    await grup.getByTestId('ar-grup-toggle').click();

    const sesudah = page.getByTestId('ar-nota');
    await expect(sesudah).toHaveCount(sebelum + 2);
    await expect(page.getByText('INV-SEED-0001')).toBeVisible();
    await expect(page.getByText('INV-SEED-0003')).toBeVisible();

    // Bukan memeriksa tombolnya ADA — menekannya sampai isinya terbaca.
    await sesudah.filter({ hasText: 'INV-SEED-0001' }).getByTestId('ar-rincian').click();
    await expect(page.getByTestId('ar-detail-modal')).toBeVisible();
    await expect(page.getByTestId('ar-detail-lines')).toBeVisible({ timeout: 15_000 });
  });

  test('pelanggan dengan SATU nota tetap satu baris datar, tanpa klik tambahan', async ({ page }) => {
    // Menambah satu klik yang tidak mengungkap apa pun adalah kerumitan yang
    // track penyederhanaan (S1-S5) ada untuk mengurangi.
    await login(page, 'cashier@demo.com');
    await page.goto('/finance/receivables');
    await page.waitForLoadState('networkidle');

    const siti = page.getByTestId('ar-nota').filter({ hasText: 'INV-SEED-0002' });
    await expect(siti).toHaveCount(1);
    await expect(siti.getByTestId('ar-rincian')).toBeVisible();
  });

  test('REGRESI — kasir tetap ditolak di halaman keuangan lain sesudah T2', async ({ page }) => {
    // Batas R1.5A tidak boleh longgar sebagai efek samping pengelompokan ini.
    const token = await apiToken(page, 'cashier@demo.com');
    for (const path of ['/finance/ledger', '/finance/payables', '/finance/ledger/summary']) {
      const res = await page.request.get(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status(), `kasir harus ditolak di ${path}`).toBe(403);
    }

    await login(page, 'cashier@demo.com');
    await page.goto('/finance/ledger');
    await expect(page.getByText('Halaman itu bukan untuk peran Anda')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// T3 — katalog device bisa dihapus & ditindaklanjuti (uji-R1.8 D1)
// ---------------------------------------------------------------------------

test.describe('R1.9-T3 — hapus & UI Katalog Device', () => {
  test('hapus model yang dipakai unit pelanggan ditolak 422 dengan alasan', async ({ page }) => {
    const token = await apiToken(page, 'admin@demo.com');
    const headers = { Authorization: `Bearer ${token}` };

    const merek = (await (await page.request.get(`${API_BASE}/device-catalog/brands`, { headers })).json()).data
      .find((b: any) => b.name === 'Samsung');
    const model = (await (await page.request.post(`${API_BASE}/device-catalog/models`, {
      headers, data: { deviceBrandId: merek.id, name: 'ZZ Uji Terpakai ' + Date.now() },
    })).json()).data;

    // Tautkan lewat intake sungguhan, bukan lewat SQL — yang diuji adalah jalur
    // yang benar-benar dipakai toko.
    const tokenKasir = await apiToken(page, 'cashier@demo.com');
    const intake = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: {
        customerName: 'Uji Penjaga Katalog ' + Date.now(),
        assetType: 'Handphone', assetBrand: 'Samsung', assetModel: model.name,
        deviceModelId: model.id, reportedComplaint: 'Uji penjaga hapus katalog',
        branchId: BRANCH_PUSAT,
      },
    });
    expect(intake.status()).toBe(201);

    const hapus = await page.request.delete(`${API_BASE}/device-catalog/models/${model.id}`, { headers });
    expect(hapus.status()).toBe(422);
    const err = (await hapus.json()).error;
    expect(err.code).toBe('DEVICE_MODEL_IN_USE');
    expect(err.message).toContain('unit pelanggan');
  });

  test('hapus merek yang masih punya model ditolak 422 dan menyebut jumlahnya', async ({ page }) => {
    const token = await apiToken(page, 'admin@demo.com');
    const headers = { Authorization: `Bearer ${token}` };

    const merek = (await (await page.request.post(`${API_BASE}/device-catalog/brands`, {
      headers, data: { name: 'ZZ Merek Uji ' + Date.now() },
    })).json()).data;
    await page.request.post(`${API_BASE}/device-catalog/models`, {
      headers, data: { deviceBrandId: merek.id, name: 'ZZ Model' },
    });

    const ditolak = await page.request.delete(`${API_BASE}/device-catalog/brands/${merek.id}`, { headers });
    expect(ditolak.status()).toBe(422);
    expect((await ditolak.json()).error.code).toBe('DEVICE_BRAND_HAS_MODELS');
  });

  test('model bebas terhapus 204 dan hilang dari layar', async ({ page }) => {
    const token = await apiToken(page, 'admin@demo.com');
    const headers = { Authorization: `Bearer ${token}` };
    const nama = 'ZZ Hapus Dari Layar ' + Date.now();

    const merek = (await (await page.request.get(`${API_BASE}/device-catalog/brands`, { headers })).json()).data
      .find((b: any) => b.name === 'Samsung');
    await page.request.post(`${API_BASE}/device-catalog/models`, {
      headers, data: { deviceBrandId: merek.id, name: nama },
    });

    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    // Pencarian lintas merek (perbaikan UX): satu daftar datar, bukan menyaring
    // di dalam puluhan kartu.
    await page.getByTestId('device-search').fill(nama);
    const baris = page.getByTestId('hasil-cari-baris').filter({ hasText: nama });
    await expect(baris).toHaveCount(1);

    page.once('dialog', (d) => d.accept());
    await baris.getByTestId('hapus-model').click();
    await page.waitForLoadState('networkidle');

    await page.getByTestId('device-search').fill(nama);
    await expect(page.getByTestId('hasil-cari-baris').filter({ hasText: nama })).toHaveCount(0);
  });

  test('pencarian menemukan model lintas merek dalam satu daftar datar', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('device-search').fill('A10');
    await expect(page.getByTestId('hasil-cari')).toBeVisible();
    // Tiap baris menyebut MEREKNYA — itu yang hilang saat hasil tersebar di
    // kartu-kartu terpisah.
    await expect(page.getByTestId('hasil-cari-baris').first()).toBeVisible();
  });

  test('nama merek yang salah ketik bisa dibetulkan (dulu tidak bisa sama sekali)', async ({ page }) => {
    const token = await apiToken(page, 'admin@demo.com');
    const headers = { Authorization: `Bearer ${token}` };
    const salah = 'ZZ Smasung ' + Date.now();

    const merek = (await (await page.request.post(`${API_BASE}/device-catalog/brands`, {
      headers, data: { name: salah },
    })).json()).data;

    const benar = salah.replace('Smasung', 'Samsung');
    const patch = await page.request.patch(`${API_BASE}/device-catalog/brands/${merek.id}`, {
      headers, data: { name: benar },
    });
    expect(patch.status()).toBe(200);
    expect((await patch.json()).data.name).toBe(benar);

    await page.request.delete(`${API_BASE}/device-catalog/brands/${merek.id}`, { headers });
  });

  test('"Tambahkan ke katalog" membuat modelnya dan barisnya hilang dari panel', async ({ page }) => {
    // Ini yang memberi panel R1.8-T5 sebuah penutup: tanpanya admin harus
    // mengetik ulang nama yang sudah terpampang di layar.
    const tokenKasir = await apiToken(page, 'cashier@demo.com');
    const cap = Date.now();
    const merekBaru = `ZZMerek${cap}`;
    const modelBaru = `ZZModel${cap}`;

    const intake = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: {
        customerName: 'Uji Panel Katalog ' + cap,
        assetType: 'Handphone', assetBrand: merekBaru, assetModel: modelBaru,
        reportedComplaint: 'Uji panel belum ada di katalog',
        branchId: BRANCH_PUSAT,
      },
    });
    expect(intake.status()).toBe(201);

    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    const baris = page.getByTestId('uncatalogued-row').filter({ hasText: modelBaru });
    await expect(baris).toHaveCount(1);
    await baris.getByTestId('uncatalogued-tambah').click();
    await page.waitForLoadState('networkidle');

    // Barisnya hilang KARENA modelnya benar-benar masuk katalog — dua sisi dari
    // klaim yang sama, jadi keduanya diperiksa.
    await expect(page.getByTestId('uncatalogued-row').filter({ hasText: modelBaru })).toHaveCount(0);
    await page.getByTestId('device-search').fill(modelBaru);
    await expect(page.getByTestId('hasil-cari-baris').filter({ hasText: modelBaru })).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// T4 — perkiraan konter vs estimasi teknisi (uji-R1.8 F2)
// ---------------------------------------------------------------------------

test.describe('R1.9-T4 — perkiraan konter terkunci setelah Penerimaan', () => {
  async function buatTiket(page: Page, perkiraan: number) {
    const token = await apiToken(page, 'cashier@demo.com');
    const res = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerName: 'Uji T4 ' + Date.now(),
        assetType: 'Handphone', assetBrand: 'Samsung', assetModel: 'Galaxy A10',
        reportedComplaint: 'Layar pecah', intakeEstimatedCost: perkiraan,
        branchId: BRANCH_PUSAT,
      },
    });
    expect(res.status()).toBe(201);
    return (await res.json()).data.id as string;
  }

  test('boleh dibetulkan SELAGI di Penerimaan, ditolak 422 sesudahnya', async ({ page }) => {
    const tokenKasir = await apiToken(page, 'cashier@demo.com');
    const tokenAdmin = await apiToken(page, 'admin@demo.com');
    const id = await buatTiket(page, 450000);

    // Salah ketik di konter harus bisa dibetulkan selagi unitnya masih di meja.
    const betulkan = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: { intakeEstimatedCost: 500000 },
    });
    expect(betulkan.status()).toBe(200);

    const detail = await (await page.request.get(`${API_BASE}/tickets/${id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })).json();
    const flow = await (await page.request.get(`${API_BASE}/flows/${detail.data.ticket.flowTemplateId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })).json();
    const edge = flow.data.transitions.find((t: any) => t.fromNodeId === detail.data.ticket.currentNodeId);
    const maju = await page.request.post(`${API_BASE}/tickets/${id}/transition`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { targetNodeId: edge.toNodeId },
    });
    expect(maju.status()).toBe(200);

    const ditolak = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${tokenKasir}` },
      data: { intakeEstimatedCost: 999000 },
    });
    expect(ditolak.status()).toBe(422);
    expect((await ditolak.json()).error.code).toBe('INTAKE_ESTIMATE_LOCKED');

    // Super Admin pun ditolak: ini aturan bukti, bukan aturan wewenang.
    const adminDitolak = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { intakeEstimatedCost: 999000 },
    });
    expect(adminDitolak.status()).toBe(422);

    const sesudah = await (await page.request.get(`${API_BASE}/tickets/${id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })).json();
    expect(Number(sesudah.data.ticket.intakeEstimatedCost)).toBe(500000);

    // Penguncian tidak boleh menular ke field lain di endpoint yang sama.
    const lain = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { diagnosis: 'LCD rusak total' },
    });
    expect(lain.status()).toBe(200);
  });

  test('halaman tiket menampilkan kedua angka beserta selisihnya', async ({ page }) => {
    const tokenAdmin = await apiToken(page, 'admin@demo.com');
    const id = await buatTiket(page, 450000);

    // Estimasi teknisi = jumlah baris biaya. Tahap Penerimaan melarang biaya
    // (S5), jadi tiketnya dimajukan dulu ke tahap yang mengizinkan.
    const detail = await (await page.request.get(`${API_BASE}/tickets/${id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })).json();
    const flow = await (await page.request.get(`${API_BASE}/flows/${detail.data.ticket.flowTemplateId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })).json();
    const edge = flow.data.transitions.find((t: any) => t.fromNodeId === detail.data.ticket.currentNodeId);
    await page.request.post(`${API_BASE}/tickets/${id}/transition`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { targetNodeId: edge.toNodeId },
    });

    const charge = await page.request.post(`${API_BASE}/tickets/${id}/charges`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { sourceType: 'labor', description: 'Ganti LCD', quantity: 1, unitPrice: 700000 },
    });
    expect(charge.status()).toBe(201);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('perkiraan-konter')).toContainText('450.000');
    await expect(page.getByTestId('estimasi-teknisi')).toContainText('700.000');
    // Selisihnya yang jadi percakapan dengan pelanggan, bukan salah satunya.
    await expect(page.getByTestId('selisih-estimasi')).toContainText('250.000');
    await expect(page.getByTestId('selisih-estimasi')).toContainText('Lebih mahal');
  });
});

// ---------------------------------------------------------------------------
// T5 — kasir memilih apa yang dicetak (uji-R1.8 F5)
// ---------------------------------------------------------------------------

test.describe('R1.9-T5 — tombol cetak di Terima Unit', () => {
  test('tombol muncul setelah unit tersimpan dan memanggil jalur render yang sama', async ({ page }) => {
    // Yang dijaga di sini BUKAN "kertas keluar" (butuh printer fisik, sama
    // statusnya dengan 6D.1) melainkan: tombolnya ada, dan ia menempuh
    // GET /v1/print/documents/... yang sama dengan cetak otomatis — bukan jalur
    // cetak kedua yang bisa kehilangan pemilihan template per cabang.
    const diminta: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/print/documents/')) diminta.push(req.url());
    });

    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.locator('#name').fill('Uji Cetak ' + Date.now());
    await page.locator('#type').selectOption({ index: 1 });
    await page.locator('#brand').fill('Samsung');
    await page.locator('#model').fill('Galaxy A10');
    // Autocomplete merek/model membuka dropdown yang menutupi tombol simpan.
    await page.keyboard.press('Escape');
    await page.locator('#complaint').fill('Uji tombol cetak R1.9');
    await page.getByRole('button', { name: /Simpan & Terima Unit/i }).click();

    await expect(page.getByText(/berhasil dibuat/i)).toBeVisible({ timeout: 20_000 });

    const tombolLabel = page.getByTestId('intake-cetak-label');
    const tombolTandaTerima = page.getByTestId('intake-cetak-tanda-terima');
    await expect(tombolLabel).toBeVisible();
    await expect(tombolTandaTerima).toBeVisible();

    diminta.length = 0;
    await tombolTandaTerima.click();
    // Halaman tidak boleh menggantung: entah berhasil atau pesan terbaca.
    await expect(page.getByTestId('intake-print-status')).toBeVisible({ timeout: 20_000 });
    expect(diminta.some((u) => u.includes('/print/documents/tanda_terima/'))).toBe(true);
  });

  test('daftar Unit Masuk Terbaru menawarkan cetak ulang', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    // Seed selalu punya tiket, jadi daftar riwayat terisi dari server.
    await expect(page.getByTestId('intake-riwayat')).toBeVisible();
    await expect(page.getByTestId('riwayat-cetak-label')).toBeVisible();
    await expect(page.getByTestId('riwayat-cetak-tanda-terima')).toBeVisible();
  });
});
