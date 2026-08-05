import { test, expect, type Page } from '@playwright/test';

/**
 * R1.11 — perbaikan dari uji manual R1.10 pemilik (poin A6/A7).
 *
 * **Aturan yang berkas ini ada untuk menegakkan**, dan ia LEBIH KETAT daripada
 * aturan R1.10 (lihat `plan/R1.11-perbaikan-hasil-uji-R1.10.md`):
 *
 * > Tes yang menekan tombol wajib menekannya **SEBAGAI PERAN YANG AKAN
 * > MENEKANNYA.** Super Admin melewati seluruh RBAC (`evaluateRbac`), jadi tes
 * > apa pun yang berjalan sebagai admin **tidak membuktikan apa pun tentang
 * > izin.**
 *
 * Aturan ini lahir dari bug yang R1.11-T1 perbaiki: `PATCH /:id/intake-details`
 * menampung lima kolom milik dua peran tapi digerbangi satu izin
 * (`ticket.create`). Sejak R1.5B mencabut izin itu dari teknisi, **teknisi tak
 * bisa menyimpan diagnosanya sama sekali** — empat hari, lima fase, nol tes
 * yang gagal. Sebabnya: nol e2e backend menyentuh endpoint itu, dan setiap tes
 * diagnosa memakai token admin.
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

/** Tiket baru di tahap Penerimaan, dibuat lewat jalur kasir yang sungguhan. */
async function buatTiket(page: Page, perkiraan: number | null = null) {
  const token = await apiToken(page, 'cashier@demo.com');
  const data: Record<string, unknown> = {
    customerName: 'Uji R1.11 ' + Date.now(),
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

/** Memajukan tiket satu tahap lewat API — bukan transisinya yang diuji di sini. */
async function majukanSatuTahap(page: Page, id: string): Promise<string> {
  const token = await apiToken(page, 'admin@demo.com');
  const detail = await page.request.get(`${API_BASE}/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await detail.json();
  const template = await page.request.get(`${API_BASE}/flows/${body.data.ticket.flowTemplateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const flow = (await template.json()).data;
  const berikutnya = flow.transitions.find((t: any) => t.fromNodeId === body.data.ticket.currentNodeId);
  expect(berikutnya, 'tiket harus punya tahap lanjutan').toBeTruthy();

  const pindah = await page.request.post(`${API_BASE}/tickets/${id}/transition`, {
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() },
    data: { targetNodeId: berikutnya.toNodeId },
  });
  expect(pindah.status()).toBe(200);

  const nama = flow.nodes.find((n: any) => n.id === berikutnya.toNodeId)?.name;
  return nama as string;
}

// ---------------------------------------------------------------------------
// T1 — teknisi akhirnya bisa menyimpan diagnosanya, LEWAT LAYAR
//
// Inilah tes yang tidak pernah ada. Kalau ia ditulis lima fase lalu, bug
// R1.11-T1 tidak akan pernah sampai ke tangan pemilik.
// ---------------------------------------------------------------------------

test.describe('R1.11-T1 — izin per-kolom di /intake-details', () => {
  test('TEKNISI menyimpan hasil diagnosa lewat layar dan angkanya bertahan', async ({ page }) => {
    const id = await buatTiket(page);
    await majukanSatuTahap(page, id); // ke tahap yang menuntut diagnosa

    await login(page, 'technician@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    // Tombolnya harus ADA untuk teknisi — ini kebalikan dari uji keluhan/sandi
    // di bawah, dan yang membuktikan T2 tidak kebablasan menyembunyikan.
    await page.getByTestId('ubah-diagnosa').click();
    await page.locator('#diagnosis').fill('IC charging rusak, perlu ganti konektor');
    await page.getByRole('button', { name: 'Simpan' }).first().click();

    // Tersimpan sungguhan: bertahan melewati muat ulang penuh.
    await expect(page.getByTestId('diagnosis-panel')).toContainText('IC charging rusak', { timeout: 15_000 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('diagnosis-panel')).toContainText('IC charging rusak');
  });

  test('TEKNISI tidak melihat tombol Ubah keluhan/sandi, tapi TETAP melihat isinya', async ({ page }) => {
    const id = await buatTiket(page);

    await login(page, 'technician@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    // Tidak ADA DI DOM, bukan sekadar tak terlihat.
    await expect(page.getByTestId('ubah-keluhan')).toHaveCount(0);
    await expect(page.getByTestId('ubah-sandi')).toHaveCount(0);

    // Tapi isinya tetap terbaca — teknisi butuh sandinya untuk menguji unit,
    // dan keluhan adalah alasan unit ini ada di mejanya. Menyembunyikan
    // keduanya akan menjadi "fitur hilang diam-diam", bukan perbaikan.
    await expect(page.getByText('Layar pecah')).toBeVisible();
    await expect(page.getByText('Keluhan / Kerusakan')).toBeVisible();
    await expect(page.getByText('Sandi / Pola')).toBeVisible();
  });

  test('KASIR tidak melihat tombol Ubah pada hasil diagnosa', async ({ page }) => {
    const id = await buatTiket(page);
    await majukanSatuTahap(page, id);

    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    // Sebelum R1.11 kasir benar-benar BISA menulis hasil diagnosa (200 di API),
    // menabrak komentar di db/seed/01-core.ts yang menyatakan sebaliknya.
    await expect(page.getByTestId('ubah-diagnosa')).toHaveCount(0);
    // Tapi tombol miliknya sendiri tetap ada.
    await expect(page.getByTestId('ubah-keluhan')).toHaveCount(1);
  });

  test('pendamping API: matriks izin per kolom, empat peran', async ({ page }) => {
    // Menemani tes layar di atas, TIDAK menggantikannya — membuktikan bahwa
    // yang menolak adalah backend, bukan tombol yang disembunyikan.
    const id = await buatTiket(page);
    const teknisi = await apiToken(page, 'technician@demo.com');
    const kasir = await apiToken(page, 'cashier@demo.com');
    const manager = await apiToken(page, 'manager@demo.com');
    const admin = await apiToken(page, 'admin@demo.com');

    const patch = (token: string, data: Record<string, unknown>) =>
      page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
        headers: { Authorization: `Bearer ${token}` },
        data,
      });

    // Teknisi: kolomnya sendiri boleh (INILAH bug yang diperbaiki — dulu 403).
    expect((await patch(teknisi, { diagnosis: 'IC rusak' })).status()).toBe(200);
    expect((await patch(teknisi, { estimatedDurationMinutes: 120 })).status()).toBe(200);
    // Teknisi: kolom konter tetap ditolak.
    expect((await patch(teknisi, { reportedComplaint: 'diubah teknisi' })).status()).toBe(403);
    expect((await patch(teknisi, { devicePasscode: '9999' })).status()).toBe(403);
    expect((await patch(teknisi, { intakeEstimatedCost: 777000 })).status()).toBe(403);

    // Kasir: kolomnya sendiri boleh, diagnosa TIDAK (dulu 200).
    expect((await patch(kasir, { reportedComplaint: 'LCD pecah total' })).status()).toBe(200);
    expect((await patch(kasir, { devicePasscode: '1234' })).status()).toBe(200);
    expect((await patch(kasir, { diagnosis: 'ditulis kasir' })).status()).toBe(403);

    // Manager memegang keduanya; Super Admin bypass.
    expect((await patch(manager, { diagnosis: 'diperiksa manager' })).status()).toBe(200);
    expect((await patch(admin, { reportedComplaint: 'dibetulkan admin' })).status()).toBe(200);
  });

  test('menyimpan ulang nilai yang SAMA tidak menuntut izin', async ({ page }) => {
    // Kondisional terhadap perubahan, bukan terhadap keberadaan kunci —
    // pelajaran R1.10-T4. Tanpa ini, form yang mengirim seluruh objek akan
    // memblokir orang yang tak menyentuh kolom itu sama sekali.
    const id = await buatTiket(page);
    const teknisi = await apiToken(page, 'technician@demo.com');

    // Keluhannya persis seperti yang dibuat kasir; teknisi tak mengubah apa pun.
    const res = await page.request.patch(`${API_BASE}/tickets/${id}/intake-details`, {
      headers: { Authorization: `Bearer ${teknisi}` },
      data: { reportedComplaint: 'Layar pecah' },
    });
    expect(res.status()).toBe(200);
  });

  test('tiket yang tidak ada tetap 404, bukan 403', async ({ page }) => {
    // 404 mendahului 403: tiket milik tenant lain tak boleh dibedakan dari
    // tiket yang tidak ada (aturan yang sama dengan H12).
    const teknisi = await apiToken(page, 'technician@demo.com');
    const res = await page.request.patch(
      `${API_BASE}/tickets/99999999-0000-4000-8000-000000000000/intake-details`,
      { headers: { Authorization: `Bearer ${teknisi}` }, data: { reportedComplaint: 'mati total' } }
    );
    expect(res.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// T3 — halaman menyusul keadaan terbaru
//
// Dipicu lewat event `focus`, BUKAN dengan menunggu interval 20 detik: yang
// pemilik alami adalah "menoleh kembali ke layar kasir", dan itu persis event
// ini. Menunggu interval akan membuat tes lambat tanpa menguji hal yang
// berbeda.
// ---------------------------------------------------------------------------

test.describe('R1.11-T3 — halaman tidak lagi basi', () => {
  test('halaman kasir menyusul saat tab kembali dipakai, tanpa F5', async ({ page }) => {
    const id = await buatTiket(page);

    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    const tahapAwal = (await page.getByTestId('tahap-saat-ini').textContent())?.trim();
    expect(tahapAwal).toBeTruthy();

    // Orang lain (teknisi/admin) memajukan tiket di layar sebelah.
    const tahapBaru = await majukanSatuTahap(page, id);
    expect(tahapBaru).not.toBe(tahapAwal);

    // Kasir menoleh kembali ke layarnya. Tidak menekan apa pun.
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect(page.getByTestId('tahap-saat-ini')).toHaveText(tahapBaru, { timeout: 15_000 });
  });

  test('penyegaran TIDAK menghapus tulisan yang sedang diketik', async ({ page }) => {
    // ⚠️ JUJUR TENTANG APA YANG TES INI BUKTIKAN, karena ini sempat salah:
    //
    // Ia ditulis untuk menangkap dugaan "menyegarkan saat orang mengetik akan
    // menghapus tulisannya". Dugaan itu **diuji dan ternyata salah** — penjaga
    // `busy` dicabut, tes ini tetap LULUS. Sebabnya: draf kotak Ubah hidup
    // sebagai `$state` terpisah dari `data`, jadi `invalidateAll()` tak
    // menyentuhnya.
    //
    // Jadi tes ini BUKAN penangkap bug yang sedang hidup; ia **jaminan**. Yang
    // dikuncinya: apa pun yang terjadi pada mekanisme penyegaran, tulisan
    // pemakai tidak boleh hilang. Nilainya baru terasa saat R2 memecah
    // `TicketWorkspace` — begitu sebuah kotak Ubah membaca `data`, bahaya itu
    // jadi nyata dan tes inilah yang bersuara lebih dulu.
    const id = await buatTiket(page);

    await login(page, 'cashier@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('ubah-keluhan').click();
    const kotak = page.locator('textarea').first();
    const tulisan = 'Layar pecah, sedang saya ketik dan belum disimpan';
    await kotak.fill(tulisan);

    // Sesuatu berubah di server, lalu kasir mengklik kembali ke jendela ini.
    await majukanSatuTahap(page, id);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(1500);

    // Kotaknya masih terbuka dan tulisannya masih utuh.
    await expect(kotak).toHaveValue(tulisan);
  });
});

// ---------------------------------------------------------------------------
// T4 — kalimat kunci perkiraan konter (uji-R1.10 A8)
// ---------------------------------------------------------------------------

test.describe('R1.11-T4 — kalimat kunci perkiraan konter', () => {
  test('menyebut perpindahan TAHAP, bukan perpindahan barang', async ({ page }) => {
    // Pemilik: "unit masih ada di konter cuman statusnya berubah yang tadinya
    // menunggu menjadi sudah di diagnosa". Kuncinya tetap; premisnya dibetulkan.
    const id = await buatTiket(page, 450000);
    await majukanSatuTahap(page, id);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${id}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('perkiraan-konter')).toContainText('450.000');
    await expect(page.getByTestId('ubah-perkiraan-konter')).toHaveCount(0);
    await expect(page.getByText('terkunci sejak tiket masuk pemeriksaan')).toBeVisible();
    // Premis lama tidak boleh kembali.
    await expect(page.getByText('lepas dari konter')).toHaveCount(0);
  });
});
