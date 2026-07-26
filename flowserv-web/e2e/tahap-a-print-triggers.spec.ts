import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Tahap A — pemicu cetak per-tahap (go-live gap Tier-1 #3,
// plan/tahap-a-print-triggers.md). Label/tanda-terima are ticket-sourced
// documents (printed at diagnosis, before any invoice exists) -- a genuinely
// new render path (modules/printer/ticket-document.ts), not the existing
// pos_invoice one. This proves all three triggers actually work through the
// real UI: Label (both flows, once diagnosis has started), Tanda Terima
// (Disimpan only, once the unit has entered storage), and Nota (once the
// ticket's invoice exists).

const API_BASE = 'http://localhost:3001/v1';

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function transitionTo(page: Page, targetStage: string) {
  const value = await page.locator('#next option', { hasText: targetStage }).first().getAttribute('value');
  expect(value, `a transition option to "${targetStage}" should exist`).toBeTruthy();
  await page.selectOption('#next', value!);
  await page.getByRole('button', { name: 'Execute' }).click();
  await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText(targetStage);
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Label: appears once diagnosis starts, shows customer + keluhan', async ({ page }) => {
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
    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });

    // Not printable yet at Intake.
    await expect(page.getByRole('button', { name: 'Cetak Label' })).toHaveCount(0);

    await transitionTo(page, 'Diagnosis');
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

  test('Tanda Terima: only appears in the Disimpan flow, once the unit enters storage', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Print Tanda Terima ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Laptop');
    await page.fill('#brand', 'Asus');
    await page.fill('#complaint', 'Mati total');
    await page.selectOption('#flow', { label: 'Servis - Disimpan' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });

    await transitionTo(page, 'Diagnosis');
    // Label is printable now (diagnosis started) but Tanda Terima is not yet
    // (unit hasn't entered storage).
    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toHaveCount(0);

    await transitionTo(page, 'Unit Disimpan');
    await expect(page.getByRole('button', { name: 'Cetak Tanda Terima' })).toBeVisible();
    await page.getByRole('button', { name: 'Cetak Tanda Terima' }).click();

    const preview = page.getByTestId('thermal-preview');
    await expect(preview).toBeVisible();
    await expect(preview.getByText('TANDA TERIMA UNIT SERVIS')).toBeVisible();
    await expect(preview.getByText(/Plg: Print Tanda Terima/)).toBeVisible();
    await expect(preview.getByText(/Keluhan: Mati total/)).toBeVisible();
    await expect(preview).toHaveAttribute('data-paper-size', '80mm');

    // Ditunggu tickets never show Tanda Terima -- there is no storage step.
    // (Covered structurally: the Ditunggu template has no "Unit Disimpan"
    // node at all, so hasEnteredUnitDisimpan can never become true for one.)
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
    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await transitionTo(page, 'Diagnosis');

    await expect(page.getByRole('button', { name: 'Cetak Label' })).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
