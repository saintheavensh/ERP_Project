import { test, expect, type Page } from '@playwright/test';

/**
 * R1.10 — perbaikan dari uji manual R1.9 pemilik.
 *
 * **Aturan baru yang berkas ini ada untuk menegakkan** (lihat
 * `plan/R1.10-perbaikan-hasil-uji-R1.9.md`):
 *
 * > Kalau aturannya tentang sesuatu yang ORANG harus lakukan, tesnya WAJIB
 * > menekan tombolnya. Panggilan API boleh menemani — untuk membuktikan
 * > gerbangnya nyata dan bukan kunci layar — tapi tidak boleh MENGGANTIKAN
 * > langkah lewat layar.
 *
 * Aturan ini lahir dari kegagalan yang terjadi TIGA KALI dengan bentuk sama:
 * R1 (kasir punya `ticket.create`, baris menunya tak pernah dibuat), R1.7-T1
 * (komentar menyebut pengecualian piutang, barisnya tak pernah ditulis), dan
 * R1.9-T4 (backend menerima & mengunci perkiraan konter, kontrolnya tak pernah
 * dibuat). Ketiganya punya tes hijau. Ketiganya tetap buntu di tangan pemilik.
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

/** Tiket baru di tahap Penerimaan, dengan atau tanpa perkiraan konter. */
async function buatTiket(page: Page, perkiraan: number | null) {
  const token = await apiToken(page, 'cashier@demo.com');
  const data: Record<string, unknown> = {
    customerName: 'Uji R1.10 ' + Date.now(),
    assetType: 'Handphone',
    assetBrand: 'Samsung',
    assetModel: 'Galaxy A10',
    reportedComplaint: 'Layar pecah',
    branchId: BRANCH_PUSAT,
  };
  if (perkiraan !== null) data.intakeEstimatedCost = perkiraan;

  const res = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}

// ---------------------------------------------------------------------------
// T1 — perkiraan konter bisa dibetulkan DARI LAYAR (uji-R1.9 E1/E2/E3)
// ---------------------------------------------------------------------------

test.describe('R1.10-T1 — Perkiraan Konter bisa diubah dari layar', () => {
  test('kasir MENGKLIK Ubah, mengetik angka baru, dan angkanya berubah di layar', async ({ page }) => {
    // Ini tes yang seharusnya ada di R1.9 dan tidak ada. Pemilik menuliskannya
    // sebagai pertanyaan: "di bagian mana saya bisa merubahnya?"
    const id = await buatTiket(page, 450000);

    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('perkiraan-konter')).toContainText('450.000');

    await page.getByTestId('ubah-perkiraan-konter').click();
    const input = page.getByTestId('input-perkiraan-konter');
    await expect(input).toBeVisible();
    await input.fill('500000');
    await page.getByTestId('simpan-perkiraan-konter').click();

    // Berubah DI LAYAR, bukan cuma di database.
    await expect(page.getByTestId('perkiraan-konter')).toContainText('500.000');
    await expect(page.getByTestId('input-perkiraan-konter')).toHaveCount(0);
  });

  test('bertahan setelah halaman dimuat ulang — benar-benar tersimpan', async ({ page }) => {
    const id = await buatTiket(page, 450000);
    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('ubah-perkiraan-konter').click();
    await page.getByTestId('input-perkiraan-konter').fill('675000');
    await page.getByTestId('simpan-perkiraan-konter').click();
    await expect(page.getByTestId('perkiraan-konter')).toContainText('675.000');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('perkiraan-konter')).toContainText('675.000');
  });

  test('kasir yang LUPA menyebutkan angka masih bisa mengisinya di konter', async ({ page }) => {
    // Sebelum R1.10 kotak ini hanya muncul bila angkanya sudah terisi, jadi
    // yang lupa mengisi di form intake tak punya tempat menambahkannya sama
    // sekali — bukan cuma "tak bisa mengubah".
    const id = await buatTiket(page, null);

    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('perkiraan-konter')).toContainText('Belum disebutkan');
    await page.getByTestId('ubah-perkiraan-konter').click();
    await page.getByTestId('input-perkiraan-konter').fill('300000');
    await page.getByTestId('simpan-perkiraan-konter').click();

    await expect(page.getByTestId('perkiraan-konter')).toContainText('300.000');
  });

  test('tombolnya HILANG setelah tiket lewat Penerimaan, dan angkanya tetap', async ({ page }) => {
    // Bukan tombol mati: memasang kontrol yang pasti ditolak backend adalah
    // anti-pattern yang Track F dan R1.7-T3 sudah berantas.
    const id = await buatTiket(page, 450000);
    const token = await apiToken(page, 'admin@demo.com');

    // Majukan tiket lewat API — yang diuji di sini bukan transisinya.
    const detail = await page.request.get(`${API_BASE}/tickets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await detail.json();
    const template = await page.request.get(`${API_BASE}/flows/${body.data.ticket.flowTemplateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const flow = (await template.json()).data;
    const berikutnya = flow.transitions.find((t: any) => t.fromNodeId === body.data.ticket.currentNodeId);
    expect(berikutnya, 'tiket di tahap Penerimaan harus punya tahap lanjutan').toBeTruthy();

    const pindah = await page.request.post(`${API_BASE}/tickets/${id}/transition`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() },
      data: { targetNodeId: berikutnya.toNodeId },
    });
    expect(pindah.status()).toBe(200);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('perkiraan-konter')).toContainText('450.000');
    await expect(page.getByTestId('ubah-perkiraan-konter')).toHaveCount(0);
    // R1.11-T4 — kalimatnya diganti, MAKSUD tesnya tidak. Pemilik mengoreksi
    // premisnya di uji R1.10 A8: "unit masih ada di konter cuman statusnya
    // berubah". Yang dijaga tes ini sejak awal adalah "terkuncinya terbaca
    // pemakai", dan itu tetap dijaga — hanya kata-katanya yang menyusul.
    await expect(page.getByText('terkunci sejak tiket masuk pemeriksaan')).toBeVisible();
  });

  test('(pendamping API) gerbangnya di backend, bukan di layar', async ({ page }) => {
    // Tombol yang disembunyikan bukan keamanan — aturan lama yang TETAP
    // berlaku. Tes ini menemani tes layar di atas, tidak menggantikannya.
    const id = await buatTiket(page, 450000);
    const token = await apiToken(page, 'admin@demo.com');

    const bolehDulu = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { intakeEstimatedCost: 480000 },
    });
    expect(bolehDulu.status()).toBe(200);

    const detail = await page.request.get(`${API_BASE}/tickets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await detail.json();
    const template = await page.request.get(`${API_BASE}/flows/${body.data.ticket.flowTemplateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const flow = (await template.json()).data;
    const berikutnya = flow.transitions.find((t: any) => t.fromNodeId === body.data.ticket.currentNodeId);
    await page.request.post(`${API_BASE}/tickets/${id}/transition`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() },
      data: { targetNodeId: berikutnya.toNodeId },
    });

    const ditolak = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { intakeEstimatedCost: 999000 },
    });
    expect(ditolak.status()).toBe(422);
    expect((await ditolak.json()).error.code).toBe('INTAKE_ESTIMATE_LOCKED');
  });
});

// ---------------------------------------------------------------------------
// T2 — daftar pelanggan menyegarkan diri + toast (uji-R1.9 B4)
// ---------------------------------------------------------------------------

test.describe('R1.10-T2 — daftar pelanggan menyegarkan diri sendiri', () => {
  test('pelanggan baru muncul TANPA memuat ulang halaman, dan toast berhasil terlihat', async ({ page }) => {
    // Bug-nya bukan "data tidak datang" — invalidateAll() sudah dipanggil sejak
    // dulu. Yang salah: state memegang salinan `data` dari saat halaman pertama
    // dibuka. Karena itu tes ini TIDAK BOLEH memakai reload() untuk membuktikan
    // keberhasilannya; reload justru menyembunyikan bug-nya.
    const nama = 'Pelanggan Uji T2 ' + Date.now();

    await login(page, 'cashier@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('cell', { name: nama })).toHaveCount(0);

    await page.getByRole('button', { name: 'Tambah Pelanggan' }).click();
    await page.locator('#name').fill(nama);
    await page.locator('#phone').fill('0812' + Date.now().toString().slice(-8));
    await page.getByRole('button', { name: 'Save Customer' }).click();

    // Inti T2: barisnya muncul sendiri.
    await expect(page.getByRole('cell', { name: nama })).toBeVisible();

    const toast = page.getByTestId('customer-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('berhasil ditambahkan');
  });

  test('gagal menyimpan memunculkan toast gagal, bukan diam-diam', async ({ page }) => {
    // Nama satu huruf: ditolak backend (`z.string().min(2)`) TAPI lolos dari
    // tombol yang hanya mati saat nama kosong — jadi ini kegagalan yang
    // benar-benar bisa dicapai kasir, bukan yang dikarang untuk tes.
    //
    // Telepon duplikat sengaja TIDAK dipakai sebagai pemicu: diperiksa ke
    // `routes/customers.ts` lebih dulu, dan ternyata nomor kembar memang
    // DITERIMA (tak ada unique constraint) — tesnya akan hijau karena alasan
    // yang salah.
    await login(page, 'cashier@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Tambah Pelanggan' }).click();
    await page.locator('#name').fill('A');
    await page.getByRole('button', { name: 'Save Customer' }).click();

    const toast = page.getByTestId('customer-toast');
    await expect(toast).toBeVisible();
    await expect(toast).not.toContainText('berhasil ditambahkan');
  });
});

// ---------------------------------------------------------------------------
// T3 — /devices hanya Super Admin (uji-R1.9 D10)
// ---------------------------------------------------------------------------

test.describe('R1.10-T3 — katalog device hanya untuk Super Admin', () => {
  test('kasir mengetik /devices dan DIPENTALKAN', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/devices');
    await expect(page).not.toHaveURL(/\/devices/);
    await expect(page.getByRole('heading', { name: 'Katalog Device' })).toHaveCount(0);
  });

  test('manager juga dipentalkan — ia punya inventory.manage_items, tapi bukan izin ini', async ({ page }) => {
    await login(page, 'manager@demo.com');
    await page.goto('/devices');
    await expect(page).not.toHaveURL(/\/devices/);
  });

  test('Super Admin tetap masuk dan halamannya utuh', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/devices$/);
    await expect(page.getByRole('heading', { name: 'Katalog Device' })).toBeVisible();
    await expect(page.getByTestId('device-search')).toBeVisible();
  });

  test('REGRESI — kasir tetap bisa menerima unit, autocomplete device tetap hidup', async ({ page }) => {
    // Ini tes yang membuat T3 boleh ditandai selesai. GET brands/models sengaja
    // TIDAK ikut digerbangi justru karena form ini memanggilnya; menutup
    // endpoint bacanya akan mematikan Terima Unit untuk kasir, dan kerusakan itu
    // baru terlihat saat toko sedang ramai.
    await login(page, 'cashier@demo.com');
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.locator('#name').fill('Uji T3 Layar ' + Date.now());
    await page.locator('#type').selectOption('Smartphone');

    // Mengetik di sini memicu GET /device-catalog/brands — endpoint yang
    // sengaja TIDAK ikut digerbangi T3. Kalau ia ikut ditutup, autocomplete-nya
    // mati diam-diam dan yang tersisa cuma form yang terasa "kadang jalan".
    await page.locator('#brand').fill('Samsung');
    await page.locator('#model').fill('Galaxy A10');
    await page.locator('#complaint').fill('mati total');

    await page.getByRole('button', { name: /Simpan & Terima Unit/i }).click();
    await expect(page.getByText(/berhasil dibuat/i)).toBeVisible({ timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------
// T4 — kategori pelanggan read-only bagi kasir (uji-R1.9 A1)
// ---------------------------------------------------------------------------

test.describe('R1.10-T4 — kategori pelanggan hanya manajer/pemilik', () => {
  /** Pelanggan baru milik manager, supaya tesnya tak bergantung data seed. */
  async function buatPelanggan(page: Page) {
    const token = await apiToken(page, 'manager@demo.com');
    const res = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Uji T4 ' + Date.now(), phone: '0812' + Date.now().toString().slice(-8) },
    });
    expect(res.status()).toBe(201);
    return (await res.json()).data.id as string;
  }

  test('kasir MELIHAT kategorinya tapi tidak punya kontrol untuk mengubahnya', async ({ page }) => {
    // Pemilik: "kategorinya readonly hanya bisa di edit oleh manager".
    // Kasir tetap perlu TAHU kategorinya — jadi badge-nya wajib tetap ada.
    const id = await buatPelanggan(page);

    await login(page, 'cashier@demo.com');
    await page.goto(`/customers/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('customer-type-badge')).toBeVisible();
    await expect(page.getByLabel('Ubah kategori pelanggan')).toHaveCount(0);
    await expect(page.getByTestId('kategori-terkunci')).toBeVisible();
  });

  test('manager punya kontrolnya dan bisa mengubah kategori', async ({ page }) => {
    const id = await buatPelanggan(page);

    await login(page, 'manager@demo.com');
    await page.goto(`/customers/${id}`);
    await page.waitForLoadState('networkidle');

    const pilih = page.getByLabel('Ubah kategori pelanggan');
    await expect(pilih).toBeVisible();
    await pilih.selectOption('sparepart');
    await expect(page.getByTestId('customer-type-badge')).toContainText('Sparepart');
  });

  test('kasir tidak melihat pilihan Kategori saat menambah pelanggan', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Tambah Pelanggan' }).click();

    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#customer-type')).toHaveCount(0);
  });

  test('(pendamping API) gerbangnya di backend, dan tidak kelewat lebar', async ({ page }) => {
    // Yang mudah salah di sini BUKAN penolakannya, melainkan penolakan yang
    // terlalu lebar: form mengirim seluruh objek tiap simpan, jadi memeriksa
    // "customerType ada di payload" akan memblokir kasir yang cuma membetulkan
    // nomor telepon. Karena itu tes ini menuntut 200 untuk kasus itu.
    const id = await buatPelanggan(page);
    const kasir = await apiToken(page, 'cashier@demo.com');
    const manager = await apiToken(page, 'manager@demo.com');

    const ubahKategori = await page.request.put(`${API_BASE}/customers/${id}`, {
      headers: { Authorization: `Bearer ${kasir}` },
      data: { name: 'Uji T4 kasir', customerType: 'sparepart' },
    });
    expect(ubahKategori.status()).toBe(403);

    const ubahTelepon = await page.request.put(`${API_BASE}/customers/${id}`, {
      headers: { Authorization: `Bearer ${kasir}` },
      data: { name: 'Uji T4 kasir', phone: '081200000000', customerType: 'service' },
    });
    expect(ubahTelepon.status()).toBe(200);

    const olehManager = await page.request.put(`${API_BASE}/customers/${id}`, {
      headers: { Authorization: `Bearer ${manager}` },
      data: { name: 'Uji T4 manager', customerType: 'sparepart' },
    });
    expect(olehManager.status()).toBe(200);

    // Jalur POST ikut ditutup — membuat pelanggan LANGSUNG berkategori
    // sparepart adalah cara lain melakukan hal yang sama.
    const buatLangsung = await page.request.post(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${kasir}` },
      data: { name: 'Uji T4 pintu belakang', customerType: 'sparepart' },
    });
    expect(buatLangsung.status()).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// T5 — pencarian katalog per kata (uji-R1.9 D2)
// ---------------------------------------------------------------------------

test.describe('R1.10-T5 — pencarian katalog device per kata', () => {
  test('"samsung a20" menemukan Galaxy A20 — kalimat pemilik, di layar', async ({ page }) => {
    // Aturannya sudah dijaga 13 tes unit di lib/devices/__tests__; yang ini
    // membuktikan kotak cari di halaman benar-benar MEMAKAI aturan itu — bukan
    // masih memakai pencocokan lamanya.
    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('device-search').fill('samsung a20');
    const baris = page.getByTestId('hasil-cari-baris').filter({ hasText: 'Galaxy A20' });
    await expect(baris.first()).toBeVisible();
  });

  test('urutan kata bebas: "a20 samsung" juga menemukannya', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('device-search').fill('a20 samsung');
    await expect(
      page.getByTestId('hasil-cari-baris').filter({ hasText: 'Galaxy A20' }).first(),
    ).toBeVisible();
  });

  test('kata yang tidak ada membuat hasilnya kosong, bukan asal cocok', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/devices');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('device-search').fill('samsung iphone');
    await expect(page.getByTestId('hasil-cari-baris')).toHaveCount(0);
  });
});
