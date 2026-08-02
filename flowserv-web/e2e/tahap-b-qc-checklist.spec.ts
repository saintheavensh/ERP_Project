import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Daftar periksa tahap (QC).
//
// Alasan fitur ini ada, kata pemilik: QC dipakai "untuk operasional dan evidence
// kepada pelanggan". Jadi yang dibuktikan di sini bukan cuma centangnya
// tersimpan, melainkan: owner bisa menyusun sendiri barisnya, staf mengisinya di
// tiket, dan hasilnya TETAP terbaca setelah tiket pindah tahap.

const API_BASE = 'http://localhost:3001/v1';
const SERVIS_FLOW = '84000000-0000-4000-8000-000000000003';
const BRANCH_PUSAT = '00000000-0000-0000-0000-000000000000';

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function apiToken(page: Page, email = 'admin@demo.com') {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email, password: 'admin123' },
  });
  return (await res.json()).data.token as string;
}

/**
 * Tiket baru yang sudah berdiri di tahap QC Awal, dibuat lewat API supaya tes
 * ini tidak ikut menguji ulang intake & perpindahan tahap (sudah ada spec-nya).
 */
async function ticketAtQcAwal(page: Page, customerName: string) {
  const token = await apiToken(page);
  const headers = { Authorization: `Bearer ${token}` };

  const flow = await (await page.request.get(`${API_BASE}/flows/${SERVIS_FLOW}`, { headers })).json();
  const nodeId = (name: string) => flow.data.nodes.find((n: any) => n.name === name).id;

  const intake = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers,
    data: {
      customerName, customerPhone: '081200001111', assetType: 'Smartphone',
      assetBrand: 'Samsung', assetModel: 'A10', reportedComplaint: 'Layar mati total',
      flowTemplateId: SERVIS_FLOW, branchId: BRANCH_PUSAT,
    },
  });
  const ticketId = (await intake.json()).data.id as string;

  for (const stage of ['Diagnosis', 'Unit Disimpan', 'QC Awal']) {
    await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: { targetNodeId: nodeId(stage) },
    });
  }
  return { ticketId, nodeId };
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('owner menyusun sendiri baris daftar periksa sebuah tahap', async ({ page }) => {
    await login(page);
    await page.goto(`/flows/${SERVIS_FLOW}`);
    await page.waitForLoadState('networkidle');

    // Lencana di kartu diagram: tahap yang punya daftar periksa terbaca tanpa
    // harus dibuka satu per satu.
    await expect(page.getByTestId('flow-node').filter({ hasText: 'QC Awal' })).toContainText('PERIKSA: 4');

    await page.getByTestId('flow-node').filter({ hasText: 'QC Awal' }).click();
    const panel = page.getByTestId('stage-panel');
    await expect(panel.getByTestId('checklist-item-row')).toHaveCount(4);

    const marker = `Konektor cas dicek ${Date.now()}`;
    await panel.getByTestId('add-checklist-item').click();
    await panel.getByTestId('checklist-item-row').last().locator('input').fill(marker);
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();

    // Benar-benar tersimpan, bukan hanya tampak di layar.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByTestId('flow-node').filter({ hasText: 'QC Awal' }).click();
    await expect(page.getByTestId('stage-panel').getByTestId('checklist-item-row')).toHaveCount(5);

    // Kembalikan ke bentuk semula supaya urutan jalannya tes tidak penting.
    await page.getByTestId('stage-panel').getByTestId('checklist-item-row').last()
      .getByRole('button', { name: /^Hapus item/ }).click();
    await page.getByTestId('save-flow').click();
    await expect(page.getByTestId('flow-saved')).toBeVisible();
  });

  test('staf mengisi daftar periksa di tiket, lengkap dengan siapa dan kapan', async ({ page }) => {
    const { ticketId } = await ticketAtQcAwal(page, `Uji QC ${Date.now()}`);

    // Teknisi, bukan admin: inilah yang benar-benar mengerjakan QC.
    await login(page, 'technician@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    const panel = page.getByTestId('checklist-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('QC Awal');
    await expect(page.getByTestId('checklist-progress')).toHaveText('0/4 diperiksa');

    const lines = panel.getByTestId('checklist-line');
    await lines.nth(0).getByRole('checkbox').check();
    await lines.nth(1).getByRole('checkbox').check();
    await lines.nth(0).locator('input[type="text"], input:not([type])').first().fill('nyala normal, layar mulus');
    await page.getByTestId('save-checklist').click();
    await expect(page.getByTestId('checklist-saved')).toBeVisible();

    // Hasil tersimpan + jejak siapa/kapan — inti "evidence"-nya.
    await expect(page.getByTestId('checklist-progress')).toHaveText('2/4 diperiksa');
    await expect(lines.nth(0)).toContainText('Teknisi Andi');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('checklist-progress')).toHaveText('2/4 diperiksa');
    // Catatan hidup di dalam <input>, jadi nilainya ada di PROPERTI value —
    // toContainText tak akan pernah melihatnya (nilai input bukan teks halaman).
    await expect(
      page.getByTestId('checklist-line').first().locator('input:not([type="checkbox"])')
    ).toHaveValue('nyala normal, layar mulus');
  });

  test('hasil pemeriksaan tetap terbaca setelah tiket pindah tahap', async ({ page }) => {
    const customerName = `Uji Bukti ${Date.now()}`;
    const { ticketId, nodeId } = await ticketAtQcAwal(page, customerName);
    const token = await apiToken(page);

    // Isi QC lewat API, lalu majukan tiketnya.
    const detail = await (await page.request.get(`${API_BASE}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json();
    await page.request.put(`${API_BASE}/tickets/${ticketId}/checklist`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        nodeId: detail.data.checklist.nodeId,
        answers: detail.data.checklist.lines.map((l: any, i: number) => ({ itemId: l.itemId, checked: i < 3 })),
      },
    });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
      headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': randomUUID() },
      data: { targetNodeId: nodeId('Pengerjaan') },
    });

    await login(page);
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    // Tahap sekarang (Pengerjaan) tak punya daftar periksa, jadi tidak ada form
    // aktif — tapi buktinya harus tetap ada, baca-saja.
    await expect(page.getByTestId('checklist-panel')).toHaveCount(0);
    const evidence = page.getByTestId('checklist-history');
    await expect(evidence).toHaveCount(1);
    await expect(evidence).toContainText('QC Awal');
    await expect(evidence).toContainText('3/4 diperiksa');
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('daftar periksa terpakai di ponsel tanpa membuat halaman overflow', async ({ page }) => {
    const { ticketId } = await ticketAtQcAwal(page, `Uji QC HP ${Date.now()}`);

    await login(page, 'technician@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('checklist-panel')).toBeVisible();
    // Kotak centang harus cukup besar untuk jari, bukan sekadar terlihat.
    const box = await page.getByTestId('checklist-line').first().getByRole('checkbox').boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(18);

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
