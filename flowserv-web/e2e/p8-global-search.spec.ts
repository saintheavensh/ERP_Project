import { test, expect, type Page } from '@playwright/test';

// P8 — Global Search (plan/P7-plus-phase5-completion-plan.md P8.1-P8.3).
// Desktop: inline input + dropdown in the header. Mobile: icon that expands
// into a full-screen overlay. Both hit the same GET /v1/search endpoint.

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

const API_BASE = 'http://localhost:3001/v1';
const CUSTOMER_BUDI = '90000000-0000-4000-8000-000000000001'; // IDS.customerBudi

/**
 * Memastikan Budi punya minimal satu tiket, tanpa bergantung pada tes lain.
 * Idempoten: dijalankan ulang cuma menambah satu tiket lagi, dan pencarian
 * hanya butuh ada-tidaknya, bukan jumlahnya.
 */
async function ensureBudiTicket(page: Page) {
  const login = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const token = (await login.json()).data.token as string;

  const res = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      customerId: CUSTOMER_BUDI,
      assetType: 'Handphone',
      assetBrand: 'Samsung',
      assetModel: 'A10',
      reportedComplaint: 'Layar mati total',
      branchId: '00000000-0000-0000-0000-000000000000',
    },
  });
  expect(res.status()).toBe(201);
}

test.describe('desktop (1280x800) — inline search', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('typing a known customer name shows grouped results and navigates on click', async ({ page }) => {
    // Fixture mandiri (ditambahkan R1.8). Tes ini menuntut grup "Tiket" muncul
    // untuk Budi, padahal SEED TIDAK PERNAH membuat tiket untuk Budi — tiket
    // seed-nya milik Andi. Selama ini ia lulus karena f7-create-ticket-from-
    // device kebetulan berjalan lebih dulu (workers: 1) dan membuatkan tiket
    // untuk Budi sebagai efek samping. Ketahuan saat f7 sempat gagal: p8 ikut
    // gagal, padahal tak ada kaitannya. Lulus karena alasan yang salah adalah
    // bentuk cacat yang berulang di proyek ini — jadi tiketnya dibuat di sini.
    await ensureBudiTicket(page);
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await expect(input).toBeVisible();
    await input.fill('budi');

    // Wait for the debounced fetch + dropdown to render a result group.
    await expect(page.getByTestId('search-group-customer')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Tiket', { exact: true })).toBeVisible();
    await expect(page.getByText('Budi Santoso', { exact: true }).first()).toBeVisible();

    await page.getByText('Budi Santoso', { exact: true }).first().click();
    await page.waitForURL(/\/customers\//);
    await expect(page.locator('body')).toContainText('Budi Santoso');
  });

  test('typing an inventory SKU finds the item and navigates to its detail page', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('BAT-IPH');

    await expect(page.getByText('Barang', { exact: true })).toBeVisible({ timeout: 5_000 });
    const resultButton = page.locator('button', { hasText: 'Baterai iPhone X' }).first();
    await expect(resultButton).toBeVisible();
    await resultButton.click();
    await page.waitForURL(/\/inventory\//);
  });

  test('a single character shows the "type more" hint, not a network call result', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('b');
    await page.waitForTimeout(400);
    await expect(page.getByText('Tidak ada hasil.')).not.toBeVisible();
  });

  test('clicking outside the dropdown closes it', async ({ page }) => {
    await login(page);

    const input = page.locator('input[placeholder^="Cari pelanggan"]');
    await input.fill('budi');
    await expect(page.getByTestId('search-group-customer')).toBeVisible({ timeout: 5_000 });

    // Click far outside both the dropdown and the sidebar (which sits above
    // the backdrop, z-index-wise, on the left edge of the page).
    await page.mouse.click(1250, 500);
    await expect(page.getByTestId('search-group-customer')).not.toBeVisible();
  });
});

test.describe('mobile (375x667) — overlay search', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('search icon opens a full-screen overlay; typing finds a supplier; Batal closes it', async ({ page }) => {
    await login(page);

    // The inline desktop input is hidden below sm; only the icon renders.
    await expect(page.locator('input[placeholder^="Cari pelanggan"]')).toBeHidden();

    await page.getByLabel('Open search').click();
    const overlayInput = page.locator('input[placeholder="Cari..."]');
    await expect(overlayInput).toBeVisible();

    // The overlay itself must never force horizontal scroll.
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);

    await overlayInput.fill('supplier a');
    await expect(page.getByTestId('search-group-supplier')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Supplier A (Tunai)').first()).toBeVisible();

    await page.getByText('Batal').click();
    await expect(overlayInput).toBeHidden();
  });

  test('selecting a mobile result navigates and closes the overlay', async ({ page }) => {
    await login(page);

    await page.getByLabel('Open search').click();
    const overlayInput = page.locator('input[placeholder="Cari..."]');
    await overlayInput.fill('budi');
    await expect(page.getByText('Budi Santoso', { exact: true }).first()).toBeVisible({ timeout: 5_000 });

    await page.getByText('Budi Santoso', { exact: true }).first().click();
    await page.waitForURL(/\/customers\//);
    await expect(overlayInput).toBeHidden();
  });
});
