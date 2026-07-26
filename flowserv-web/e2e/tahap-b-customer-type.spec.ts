import { test, expect, type Page } from '@playwright/test';

// Tahap-B — customer categories: 'service' vs 'sparepart'. It's a soft label,
// NOT a restriction: a sparepart customer must still be selectable for a service
// ticket ("customer sparepart bisa juga di deteksi untuk service"). Proves the
// create form, the list badge + filter, and the intake picker all honour that.

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

  test('create a sparepart customer, see the badge, filter by category, and still use it for a service ticket', async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    const name = `Sparepart ${Date.now()}`;
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await page.locator('#name').fill(name);
    await page.locator('#customer-type').selectOption('sparepart');
    await page.getByRole('button', { name: 'Save Customer' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Customer' })).toBeHidden();

    // Re-navigate (this list's load doesn't refresh in place — a pre-existing quirk).
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByText('Sparepart', { exact: true })).toBeVisible();

    // Filter to Sparepart: our row stays, a seeded service customer drops out.
    await page.getByLabel('Filter kategori').selectOption('sparepart');
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Budi Santoso' })).toHaveCount(0);

    // The sparepart customer is still selectable for a SERVICE ticket.
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    await page.locator('#name').fill(name);
    const option = page.getByRole('button').filter({ hasText: name });
    await expect(option).toBeVisible();
    await expect(option.getByText('Sparepart', { exact: true })).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('customers list with the category column does not overflow', async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
