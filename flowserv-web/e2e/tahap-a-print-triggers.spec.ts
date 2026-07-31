import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Tahap A — pemicu cetak per-tahap (go-live gap Tier-1 #3,
// plan/tahap-a-print-triggers.md). Label/tanda-terima are ticket-sourced
// documents (printed before any invoice exists) -- a genuinely new render
// path (modules/printer/ticket-document.ts), not the existing pos_invoice one.
//
// Tahap B (2026-07-27, plan/tahap-b-alur-pos-servis.md) — dua pemicunya
// DILONGGARKAN atas permintaan pemilik, dan spec ini ikut diperbarui:
//   - Label: dulu menunggu tiket keluar dari Intake -> kini tersedia langsung.
//   - Tanda Terima: dulu hanya alur Disimpan setelah node "Unit Disimpan" ->
//     kini kedua alur, langsung setelah intake.
// Alasannya: keduanya dokumen SERAH TERIMA, dan serah terima terjadi di
// intake. Sebelumnya, tepat setelah intake tersimpan tak ada satu pun tombol
// cetak yang muncul -- persis keluhan pemilik.

const API_BASE = 'http://localhost:3001/v1';

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Label: available immediately after intake, shows customer + keluhan', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Print Label ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Samsung');
    await page.fill('#model', 'A05');
    await page.fill('#complaint', 'LCD retak parah');
    await page.fill('#passcode', '1234'); // sandi -> harus muncul di label QC
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();

    // R1.5D — kasir kini TETAP di form setelah simpan (uji-R1 A9), jadi
    // auto-cetak dipicu DARI SINI, bukan lagi dari halaman tiket lewat
    // `?autoprint=intake`. Yang diuji tidak berubah: bahwa auto-cetak
    // BENAR-BENAR berjalan — tanpa printer ter-assign untuk 'label' di cabang
    // ini, statusnya melaporkan itu alih-alih diam saja. Buktinya sekarang
    // muncul di toast intake, mengikuti ke mana perilakunya pindah.
    await expect(page.getByTestId('intake-print-status')).toContainText(/belum tercetak/i);

    // Kasir memang tidak dipindahkan — itu inti R1.5D.
    expect(page.url()).toContain('/tickets/intake');

    await page.getByRole('link', { name: 'Lihat tiket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    // Tahap B — langsung bisa dicetak di Intake, tanpa transisi apa pun.
    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();

    await page.getByRole('button', { name: 'Cetak Label' }).click();

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).toBeVisible();
    await expect(preview.getByText(uniqueName)).toBeVisible();
    await expect(preview.getByText(/Kerusakan: LCD retak parah/)).toBeVisible();
    // Sandi/pola dicetak di label stoker untuk QC (bukan di nota pelanggan).
    await expect(preview.getByText(/Sandi: 1234/)).toBeVisible();
    await expect(preview).toHaveAttribute('data-paper-size', '58mm');
  });

  test('Tanda Terima: hanya cabang Disimpan, dan hanya setelah unit ditinggal', async ({ page }) => {
    // Tahap B — aturan finalnya (deskripsi alur pemilik 2026-07-27):
    // intake mencetak LABEL saja; nota tanda terima hanya keluar bila kasir
    // memilih cabang "Unit Disimpan" setelah diagnosis. Yang ditunggu tidak
    // dapat nota sampai selesai.
    //
    // Yang diuji di sini bukan daftar nama node, melainkan bahwa perilakunya
    // MENGIKUTI konfigurasi template (`flow_nodes.autoPrintDocuments`).
    async function intake(name: string, complaint: string) {
      await page.goto('/tickets/intake');
      await page.waitForLoadState('networkidle');
      await page.fill('#name', name);
      await page.selectOption('#type', 'Laptop');
      await page.fill('#brand', 'Asus');
      await page.fill('#complaint', complaint);
      await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
      // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
      // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
      // menempuh jalan yang sama seperti kasir sungguhan.
      await page.getByRole('link', { name: 'Lihat tiket' }).click();
      await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    }

    async function moveTo(stage: string) {
      const value = await page.locator('#next option', { hasText: stage }).first().getAttribute('value');
      expect(value, `transisi ke "${stage}" harus ada`).toBeTruthy();
      await page.selectOption('#next', value!);
      await page.getByRole('button', { name: 'Execute' }).click();
      await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText(stage);
    }

    await login(page);

    const uniqueName = `Print TT ${Date.now()}`;
    await intake(uniqueName, 'Mati total');

    // Di Intake: label ya, tanda terima BELUM — unitnya belum diputuskan ditinggal.
    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toHaveCount(0);

    await moveTo('Diagnosis');
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toHaveCount(0);

    // Kasir memilih cabang Disimpan -> tanda terima muncul.
    await moveTo('Unit Disimpan');
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toBeVisible();
    await page.getByRole('button', { name: 'Cetak Tanda Terima' }).click();

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).toBeVisible();
    await expect(preview.getByText('TANDA TERIMA UNIT SERVIS')).toBeVisible();
    await expect(preview.getByText(new RegExp(`Plg: ${uniqueName}`))).toBeVisible();
    await expect(preview.getByText(/Keluhan: Mati total/)).toBeVisible();
    await expect(preview).toHaveAttribute('data-paper-size', '80mm');
  });

  test('Ditunggu: tidak pernah memunculkan Tanda Terima', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    await page.fill('#name', `Print Ditunggu ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#complaint', 'Keyboard rusak');
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    const moveTo = async (stage: string) => {
      const value = await page.locator('#next option', { hasText: stage }).first().getAttribute('value');
      await page.selectOption('#next', value!);
      await page.getByRole('button', { name: 'Execute' }).click();
      await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText(stage);
    };

    await moveTo('Diagnosis');
    await moveTo('Ditunggu');

    // Cabang Ditunggu tak pernah melewati node yang mencetak tanda terima,
    // jadi tombolnya memang tak pernah ada — tanpa satu pun aturan khusus di kode.
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();
  });

  test('Nota: appears once the ticket actually has an invoice', async ({ page }) => {
    // Self-contained API fixture (mirrors p2-ticket-kanban's pattern) --
    // walks intake -> Diagnosis -> adds a labor charge -> quotation (flips
    // it to 'approved', which already makes a labor charge billable, no
    // stock/consume step needed) -> generates the ticket invoice.
    const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'admin123' },
    });
    const { data } = await loginRes.json();
    const headers = { Authorization: `Bearer ${data.token}` };

    const DITUNGGU_FLOW_ID = '84000000-0000-4000-8000-000000000001';
    const intakeRes = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers,
      data: {
        customerName: `Print Nota ${Date.now()}`,
        assetType: 'Smartphone',
        assetBrand: 'Xiaomi',
        flowTemplateId: DITUNGGU_FLOW_ID,
        branchId: '00000000-0000-0000-0000-000000000000',
      },
    });
    const ticketId = (await intakeRes.json()).data.id as string;

    const flowDetail = await (await page.request.get(`${API_BASE}/flows/${DITUNGGU_FLOW_ID}`, { headers })).json();
    const diagnosisNodeId = flowDetail.data.nodes.find((n: any) => n.name === 'Diagnosis').id;
    await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: { targetNodeId: diagnosisNodeId },
    });

    await page.request.post(`${API_BASE}/tickets/${ticketId}/charges`, {
      headers,
      data: { sourceType: 'labor', description: 'Ganti LCD', quantity: 1, unitPrice: 150000 },
    });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/quotation`, { headers });
    const invoiceRes = await page.request.post(`${API_BASE}/tickets/${ticketId}/invoice`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: { paymentMethod: 'cash' },
    });
    expect(invoiceRes.ok()).toBe(true);

    // Now the UI: the ticket detail page should surface Cetak Struk/Nota A4.
    await login(page);
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Cetak Struk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cetak Nota (A4)' })).toBeVisible();

    await page.getByRole('button', { name: 'Cetak Nota (A4)' }).click();
    await expect(page.locator('#print-area')).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Dokumen Cetak section does not overflow once printable', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Print Mobile ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#complaint', 'Baterai boros');
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
