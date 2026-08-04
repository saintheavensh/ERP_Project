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
    await expect(page.getByText('terkunci setelah unit lepas dari konter')).toBeVisible();
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
