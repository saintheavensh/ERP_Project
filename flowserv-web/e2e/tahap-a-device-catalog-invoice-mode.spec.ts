import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Tahap A — device catalog (image/specs/saran servis, extends the existing
// device_brands/device_models tables built for DEV-008 sparepart
// compatibility, which had zero CRUD routes before this) + invoice display
// mode (Detailed/Summary/Flexible). Triggered by a mockup the owner shared,
// not a numbered go-live-plan item — see
// plan/tahap-a-device-catalog-invoice-mode.md for the design + the
// per-tenant-vs-shared-catalog decision.

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

  test('Device catalog admin: create a brand + model with specs/image/suggested services', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/device-catalog');
    await page.waitForLoadState('networkidle');

    const brandName = `TestBrand ${Date.now()}`;
    await page.getByRole('button', { name: 'Merk Baru' }).click();
    await page.locator('#brand-name').fill(brandName);
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: brandName })).toBeVisible();

    // + Model on that brand's card — the outer bordered card div is the only
    // element with this exact class combination containing the brand name
    // (nested divs inside use different classes), so this scopes correctly
    // without a strict-mode ambiguity across multiple brand cards.
    await page.locator('div.rounded-xl.shadow-sm.border-slate-200').filter({ hasText: brandName })
      .getByRole('button', { name: '+ Model' }).click();

    const modelName = `TestModel X1 ${Date.now()}`;
    await page.locator('#model-name').fill(modelName);
    await page.locator('#model-image').fill('https://example.com/x1.jpg');
    await page.locator('input[placeholder="mis. RAM"]').fill('RAM');
    await page.locator('input[placeholder="mis. 4 GB"]').fill('6 GB');
    await page.locator('#model-services').fill('Ganti LCD, Ganti Baterai');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    // Scoped to this model's own row (by its unique name) — the "1
    // spesifikasi"/"2 saran servis" text is shared phrasing that other
    // catalog entries (including the seeded Galaxy A10/iPhone X) also show.
    const modelRow = page.locator('div.p-4.flex.items-center.gap-4').filter({ hasText: modelName });
    await expect(modelRow).toBeVisible();
    await expect(modelRow.getByText('1 spesifikasi')).toBeVisible();
    await expect(modelRow.getByText('2 saran servis')).toBeVisible();
  });

  test('Intake: catalog match shows image/specs + suggested-service chip fills Keluhan', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Print Catalog ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Samsung');
    await page.fill('#model', 'Galaxy A10');
    // Debounced (250ms) live search against the seeded catalog entry.
    await expect(page.getByRole('button', { name: /Samsung Galaxy A10/ })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Samsung Galaxy A10/ }).click();

    const preview = page.getByTestId('device-catalog-preview');
    await expect(preview).toBeVisible();
    await expect(preview.getByText('RAM')).toBeVisible();
    await expect(preview.getByText('2 GB', { exact: true })).toBeVisible();

    await preview.getByRole('button', { name: 'Ganti LCD' }).click();
    await expect(page.locator('#complaint')).toHaveValue('Ganti LCD');

    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });

    // The linked catalog entry should now surface on the ticket detail page too.
    const workspaceCard = page.getByTestId('device-catalog-card');
    await expect(workspaceCard).toBeVisible();
    await expect(workspaceCard.getByText('RAM')).toBeVisible();
  });

  test('Settings: invoice display mode persists across reload', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=sales');
    await page.waitForLoadState('networkidle');

    await page.locator('input[value="flexible"]').check();
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Perubahan tersimpan.')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[value="flexible"]')).toBeChecked();

    // Reset to 'detailed' so this test doesn't leak state into other specs
    // that print an A4 invoice and assert on its (non-toggled) shape.
    await page.locator('input[value="detailed"]').check();
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Perubahan tersimpan.')).toBeVisible();
  });

  test('Invoice A4: flexible mode shows a working Detailed/Summary toggle', async ({ page }) => {
    const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@demo.com', password: 'admin123' },
    });
    const { data } = await loginRes.json();
    const headers = { Authorization: `Bearer ${data.token}` };

    // Set flexible mode via the API (isolates this test from the settings-tab
    // test above, and from any other spec that might run in a different order).
    await page.request.patch(`${API_BASE}/settings/sales`, { headers, data: { invoiceDisplayMode: 'flexible' } });

    const DITUNGGU_FLOW_ID = '84000000-0000-4000-8000-000000000001';
    const intakeRes = await page.request.post(`${API_BASE}/tickets/intake`, {
      headers,
      data: {
        customerName: `Print Flexible ${Date.now()}`,
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
      headers, data: { sourceType: 'labor', description: 'Ganti LCD', quantity: 1, unitPrice: 150000 },
    });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/charges`, {
      headers, data: { sourceType: 'fee', description: 'Biaya Cek', quantity: 1, unitPrice: 20000 },
    });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/quotation`, { headers });
    await page.request.post(`${API_BASE}/tickets/${ticketId}/invoice`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      data: { paymentMethod: 'cash' },
    });

    await login(page);
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Cetak Nota (A4)' }).click();

    const invoiceArea = page.locator('#print-area');
    await expect(invoiceArea).toBeVisible();
    const toggle = page.getByTestId('invoice-view-mode-toggle');
    await expect(toggle).toBeVisible();

    // Default: Detailed — both lines shown separately.
    await expect(invoiceArea.getByText('Ganti LCD')).toBeVisible();
    await expect(invoiceArea.getByText('Biaya Cek')).toBeVisible();

    await toggle.getByRole('button', { name: 'Summary' }).click();
    await expect(invoiceArea.getByText('2 item/jasa')).toBeVisible();
    await expect(invoiceArea.getByText('Ganti LCD')).toHaveCount(0);

    // Reset the tenant setting back to 'detailed' so later specs in the full
    // suite (e.g. the print-triggers Nota test) see the original fixed shape.
    await page.request.patch(`${API_BASE}/settings/sales`, { headers, data: { invoiceDisplayMode: 'detailed' } });
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Device catalog page and intake catalog card do not overflow', async ({ page }) => {
    await login(page);
    await page.goto('/inventory/device-catalog');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);

    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    await page.fill('#brand', 'Samsung');
    await page.fill('#model', 'Galaxy A10');
    await expect(page.getByRole('button', { name: /Samsung Galaxy A10/ })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Samsung Galaxy A10/ }).click();
    await expect(page.getByTestId('device-catalog-preview')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
  });
});
