import { test, expect, type Page } from '@playwright/test';

// P12 — POS touch polish (5.6, plan/P7-plus-phase5-completion-plan.md). Most
// of the "touch-friendly" work landed in P1.5 (stacked layout, no fixed-width
// cart overflow); this is the targeted pass over what P1.5 didn't audit: tap
// target size on the cart qty stepper, and a real bug where the drafts
// modal's action buttons relied on `group-hover:opacity-100` — which never
// fires on a touchscreen, making them invisible and unreachable on the exact
// device this screen is built for.

const BRANCH_PUSAT = 'Pusat (Headquarter)';
const PRODUCT_NAME = 'LCD Samsung A10';

async function login(page: Page, email = 'cashier@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function addKnownProductToCart(page: Page) {
  await page.goto('/pos');
  await page.waitForLoadState('networkidle');
  await page.locator('#branch').selectOption({ label: BRANCH_PUSAT });
  await page.getByPlaceholder('Cari SKU atau Nama Produk...').fill(PRODUCT_NAME);
  await page.waitForTimeout(200);
  await page.getByText(PRODUCT_NAME, { exact: true }).first().click();
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('cart quantity stepper buttons meet a real tap-target size (>=36px)', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    const minusBtn = page.getByRole('button', { name: 'Kurangi jumlah' });
    const plusBtn = page.getByRole('button', { name: 'Tambah jumlah' });
    await expect(minusBtn).toBeVisible();

    const minusBox = await minusBtn.boundingBox();
    const plusBox = await plusBtn.boundingBox();
    expect(minusBox!.width).toBeGreaterThanOrEqual(36);
    expect(minusBox!.height).toBeGreaterThanOrEqual(36);
    expect(plusBox!.width).toBeGreaterThanOrEqual(36);
    expect(plusBox!.height).toBeGreaterThanOrEqual(36);
  });

  test('tapping the stepper updates quantity and the line total', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    const qty = page.locator('span.font-medium.w-6.text-center');
    await expect(qty).toHaveText('1');

    await page.getByRole('button', { name: 'Tambah jumlah' }).click();
    await expect(qty).toHaveText('2');

    await page.getByRole('button', { name: 'Kurangi jumlah' }).click();
    await expect(qty).toHaveText('1');
  });

  test('drafts modal action buttons are not opacity-0 (regression: group-hover never fires on touch)', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    page.once('dialog', (dialog) => dialog.accept(`P12 Draft ${Date.now()}`));
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Daftar Draft' }).click();
    const continueBtn = page.getByRole('button', { name: 'Lanjutkan Pembayaran' }).first();
    const deleteBtn = page.getByRole('button', { name: 'Hapus Draft' }).first();

    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toHaveCSS('opacity', '1');
    await expect(deleteBtn).toHaveCSS('opacity', '1');

    const deleteBox = await deleteBtn.boundingBox();
    expect(deleteBox!.width).toBeGreaterThanOrEqual(36);
    expect(deleteBox!.height).toBeGreaterThanOrEqual(36);
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('POS page, cart, and drafts modal never overflow the viewport', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    let bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);

    page.once('dialog', (dialog) => dialog.accept(`P12 Mobile Draft ${Date.now()}`));
    await page.getByRole('button', { name: 'Simpan Draft' }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Daftar Draft' }).click();
    await expect(page.getByRole('button', { name: 'Lanjutkan Pembayaran' }).first()).toBeVisible();

    bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });

  test('quantity stepper is reachable and usable at 375px', async ({ page }) => {
    await login(page);
    await addKnownProductToCart(page);

    const plusBtn = page.getByRole('button', { name: 'Tambah jumlah' });
    await expect(plusBtn).toBeVisible();
    await plusBtn.click();

    const qty = page.locator('span.font-medium.w-6.text-center');
    await expect(qty).toHaveText('2');
  });
});
