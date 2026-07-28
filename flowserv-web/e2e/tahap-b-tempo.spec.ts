import { test, expect, type Page } from '@playwright/test';

// D1 (go-live tahap-B) — kelayakan tempo per pelanggan. Owner mencentang "boleh
// tempo" saat membuat pelanggan, dan bisa memberi/mencabut kapan pun di halaman
// detail. Gerbang backend-nya (checkout tempo -> 422 kalau tak diizinkan)
// diverifikasi live via curl; test ini membuktikan kontrol UI-nya bekerja.

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

  test('create a customer with tempo allowed, then revoke and re-grant it on the detail page', async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    const name = `Tempo UI ${Date.now()}`;
    await page.getByRole('button', { name: 'Tambah Pelanggan' }).click();
    await page.locator('#name').fill(name);
    await page.locator('#allow-tempo').check(); // izinkan tempo saat pembuatan
    await page.getByRole('button', { name: 'Save Customer' }).click();

    // Modal closes on success. Re-navigate for a fresh list load (this list's
    // server load uses a plain fetch, so invalidateAll doesn't refresh it in
    // place — a pre-existing quirk, unrelated to tempo).
    await expect(page.getByRole('heading', { name: 'Tambah Pelanggan' })).toBeHidden();
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // Open the new customer's detail page.
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('link', { name: /Lihat/ }).click();
    await page.waitForURL(/\/customers\/[0-9a-f-]{36}$/, { timeout: 20_000 });

    // The create-form checkbox took effect end-to-end.
    await expect(page.getByTestId('tempo-status')).toContainText('Diizinkan');

    // Revoke -> not allowed.
    await page.getByTestId('tempo-toggle').click();
    await expect(page.getByTestId('tempo-status')).toContainText('Tidak diizinkan');

    // Re-grant -> allowed again.
    await page.getByTestId('tempo-toggle').click();
    await expect(page.getByTestId('tempo-status')).toContainText('Diizinkan');
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('the tempo card does not overflow on a phone', async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    const name = `Tempo Mobile ${Date.now()}`;
    await page.getByRole('button', { name: 'Tambah Pelanggan' }).click();
    await page.locator('#name').fill(name);
    await page.getByRole('button', { name: 'Save Customer' }).click();
    await expect(page.getByRole('heading', { name: 'Tambah Pelanggan' })).toBeHidden();
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await page.getByRole('row').filter({ hasText: name }).getByRole('link', { name: /Lihat/ }).click();
    await page.waitForURL(/\/customers\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page.getByTestId('tempo-card')).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
