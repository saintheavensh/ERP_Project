import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Tahap B — perbaikan alur POS & alur servis (plan/tahap-b-alur-pos-servis.md).
// Lima keluhan pemilik setelah mencoba alur nyata:
//   1. kasir tak bisa memasukkan nominal uang    -> uang diterima + kembalian
//   2. struk tak otomatis tercetak                -> auto-cetak setelah checkout
//   3. sparepart muncul sebelum diagnosis         -> dikunci sampai lewat persetujuan
//   4. nota/label tak keluar saat intake          -> diuji di tahap-a-print-triggers
//   5. pembayaran harus di bagian akhir           -> faktur dikunci sampai ujung alur

const API_BASE = 'http://localhost:3001/v1';
// Sama seperti p12-pos-touch.spec.ts — item seed yang pasti ada stoknya di
// cabang Pusat, supaya tes tidak bergantung pada urutan grid produk.
const BRANCH_PUSAT = 'Pusat (Headquarter)';
const PRODUCT_NAME = 'LCD Samsung A10';

async function addKnownProductToCart(page: Page) {
  await page.goto('/pos');
  await page.waitForLoadState('networkidle');
  await page.locator('#branch').selectOption({ label: BRANCH_PUSAT });
  await page.getByPlaceholder('Cari SKU atau Nama Produk...').fill(PRODUCT_NAME);
  await page.waitForTimeout(200);
  await page.getByText(PRODUCT_NAME, { exact: true }).first().click();
}

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function apiHeaders(page: Page) {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await res.json();
  return { Authorization: `Bearer ${data.token}` };
}

async function transitionTo(page: Page, targetStage: string) {
  const value = await page.locator('#next option', { hasText: targetStage }).first().getAttribute('value');
  expect(value, `transisi ke "${targetStage}" harus ada`).toBeTruthy();
  await page.selectOption('#next', value!);
  await page.getByRole('button', { name: 'Execute' }).click();
  await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText(targetStage);
}

test.describe('POS — uang diterima & kembalian (keluhan #1)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('menghitung kembalian, dan mengunci tombol bila uang kurang', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    await page.getByRole('button', { name: 'Lanjut Pembayaran' }).click();
    // Tahap B — modal terbuka langsung di Tunai (metode paling sering dipakai);
    // sebelumnya default-nya metode aktif pertama secara abjad, yaitu Dana.
    const tender = page.getByTestId('cash-tender');
    await expect(tender).toBeVisible();

    // Nominal kurang -> peringatan + tombol proses terkunci.
    await page.locator('#amountTendered').fill('1');
    await expect(page.getByTestId('tender-short')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proses Transaksi' })).toBeDisabled();

    // Nominal cukup -> kembalian tampil, tombol hidup lagi.
    await page.locator('#amountTendered').fill('1000000');
    await expect(page.getByTestId('change-amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proses Transaksi' })).toBeEnabled();
  });
});

test.describe('POS — auto-cetak struk (keluhan #2)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('checkout memicu cetak tanpa harus membuka Riwayat', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    await page.getByRole('button', { name: 'Lanjut Pembayaran' }).click();
    await page.locator('#amountTendered').fill('1000000');
    await page.getByRole('button', { name: 'Proses Transaksi' }).click();

    // Status cetak muncul dengan sendirinya — tanpa satu pun klik ke Riwayat.
    // Printer agent tidak berjalan di CI, jadi statusnya "belum tercetak" +
    // tombol Cetak Ulang; yang dibuktikan di sini adalah cetak MEMANG terpicu
    // otomatis, bukan bahwa kertasnya keluar (itu 6D.1, butuh hardware).
    const status = page.getByTestId('print-status');
    await expect(status).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('reprint-receipt')).toBeVisible();
  });
});

test.describe('Servis — sparepart & pembayaran digerbangi tahap (keluhan #3 & #5)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sparepart terkunci di Intake/Diagnosis, terbuka setelah persetujuan', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', `Gerbang Sparepart ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#complaint', 'Tidak bisa charge');
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    // Intake: terkunci (template menandai allowsCharges=false di sini), dan
    // alasannya dijelaskan — bukan sekadar hilang tanpa keterangan.
    const locked = page.getByTestId('charges-locked');
    await expect(locked).toBeVisible();
    await expect(locked).toContainText('Diagnosis');
    await expect(page.getByRole('button', { name: '+ Tambah Biaya' })).toHaveCount(0);

    // Diagnosis: terbuka — di sinilah teknisi memasukkan estimasi harga.
    await transitionTo(page, 'Diagnosis');
    await expect(page.getByTestId('charges-locked')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '+ Tambah Biaya' })).toBeVisible();

    // Form diagnosa + estimasi waktu juga muncul di tahap ini (requiresDiagnosis).
    await expect(page.getByTestId('diagnosis-panel')).toBeVisible();
  });

  test('faktur hanya muncul di ujung alur, dengan nominal & kembalian', async ({ page }) => {
    const headers = await apiHeaders(page);
    // Template default toko (satu alur bercabang) — diambil dari API, bukan
    // di-hardcode, supaya tes tak rusak lagi bila templatenya diganti owner.
    const flows = await (await page.request.get(`${API_BASE}/flows`, { headers })).json();
    const SERVIS_FLOW_ID = flows.data.find((t: any) => t.isDefault).id as string;

    // Fixture lewat API sampai punya biaya yang layak ditagih di QC Awal.
    const intakeRes = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers,
      data: {
        customerName: `Gerbang Faktur ${Date.now()}`,
        assetType: 'Smartphone',
        assetBrand: 'Xiaomi',
        branchId: '00000000-0000-0000-0000-000000000000',
      },
    });
    const ticketId = (await intakeRes.json()).data.id as string;

    const flow = await (await page.request.get(`${API_BASE}/flows/${SERVIS_FLOW_ID}`, { headers })).json();
    const nodeId = (name: string) => flow.data.nodes.find((n: any) => n.name === name).id;

    for (const stage of ['Diagnosis', 'Ditunggu', 'QC Awal']) {
      await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
        headers: { ...headers, 'Idempotency-Key': randomUUID() },
        data: { targetNodeId: nodeId(stage) },
      });
    }
    await page.request.post(`${API_BASE}/tickets/${ticketId}/charges`, {
      headers,
      data: { sourceType: 'labor', description: 'Ganti konektor cas', quantity: 1, unitPrice: 200000 },
    });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/quotation`, { headers });

    await login(page);
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    // QC Awal: ada biaya layak tagih, TAPI belum di ujung alur -> terkunci.
    await expect(page.getByTestId('invoice-locked')).toBeVisible();
    await expect(page.getByTestId('ticket-invoice-panel')).toHaveCount(0);

    await transitionTo(page, 'Pengerjaan');
    await expect(page.getByTestId('invoice-locked')).toBeVisible();

    // QC Akhir = satu langkah dari node akhir -> pembayaran terbuka.
    await transitionTo(page, 'QC Akhir');
    const panel = page.getByTestId('ticket-invoice-panel');
    await expect(panel).toBeVisible();
    // Intl id-ID menyisipkan spasi setelah "Rp" — cocokkan pola, bukan literal.
    await expect(panel).toContainText(/Rp\s?200\.000/);

    // Nominal tunai + kembalian, sama seperti kasir POS.
    await page.selectOption('#invoice-method', 'cash');
    await page.locator('#invoice-tendered').fill('500000');
    await expect(page.getByTestId('ticket-change-amount')).toContainText(/Rp\s?300\.000/);
  });
});
