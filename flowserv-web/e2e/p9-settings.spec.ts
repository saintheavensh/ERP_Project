import { test, expect, type Page } from '@playwright/test';

// P9 — Settings CRUD (5.10, plan/P7-plus-phase5-completion-plan.md). Tabbed
// shell (Company / Branches / Users & Roles / Payment Methods) over real
// CRUD endpoints built in P9.1-P9.3. Closes 2A.1 (create-user).

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

  test('company tab: edits the name and it persists across reload', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=company');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#company-name');
    const original = await nameInput.inputValue();
    const updated = `${original} (E2E ${Date.now()})`;

    await nameInput.fill(updated);
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Perubahan tersimpan.')).toBeVisible();

    await page.reload();
    await expect(page.locator('#company-name')).toHaveValue(updated);

    // Restore, so repeated test runs don't accumulate suffixes forever.
    await page.locator('#company-name').fill(original);
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Perubahan tersimpan.')).toBeVisible();
  });

  test('branches tab: creates a branch, then edits its address', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=branches');
    await page.waitForLoadState('networkidle');

    const branchName = `P9 Branch ${Date.now()}`;
    await page.getByRole('button', { name: '+ Tambah Cabang' }).click();
    await page.locator('#branch-name').fill(branchName);
    await page.locator('#branch-address').fill('Jl. E2E Awal');
    await page.getByRole('button', { name: 'Simpan' }).click();

    await page.waitForLoadState('networkidle');
    const row = page.locator('tr', { hasText: branchName });
    await expect(row).toBeVisible();
    await expect(row.getByText('Jl. E2E Awal')).toBeVisible();

    await row.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#edit-branch-address').fill('Jl. E2E Diperbarui');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('tr', { hasText: branchName }).getByText('Jl. E2E Diperbarui')).toBeVisible();
  });

  test('users tab: creates a Cashier, then deactivates them and login fails', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=users');
    await page.waitForLoadState('networkidle');

    const email = `p9user-${Date.now()}@demo.com`;
    await page.getByRole('button', { name: '+ Tambah Pengguna' }).click();
    await page.locator('#user-name').fill('P9 E2E Cashier');
    await page.locator('#user-email').fill(email);
    await page.locator('#user-password').fill('e2epassword123');
    await page.locator('#user-role').selectOption({ label: 'Cashier' });
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: email });
    await expect(row).toBeVisible();
    await expect(row.getByText('Aktif', { exact: true })).toBeVisible();

    // New user can log in while active.
    const loginRes = await page.request.post('http://localhost:3001/v1/auth/login', {
      data: { email, password: 'e2epassword123' },
    });
    expect(loginRes.ok()).toBe(true);

    // Deactivate via the edit modal.
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#edit-user-status').selectOption('inactive');
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('tr', { hasText: email }).getByText('Nonaktif')).toBeVisible();

    const loginAfter = await page.request.post('http://localhost:3001/v1/auth/login', {
      data: { email, password: 'e2epassword123' },
    });
    expect(loginAfter.status()).toBe(401);
    const body = await loginAfter.json();
    expect(body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  test('payment methods tab: shows seeded methods read-only, no edit controls', async ({ page }) => {
    await login(page);
    await page.goto('/settings?tab=payment-methods');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });

  test('tab links switch the active panel via the ?tab= query', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#company-name')).toBeVisible();

    await page.getByRole('link', { name: 'Cabang' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/tab=branches/);
    await expect(page.getByRole('button', { name: '+ Tambah Cabang' })).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('settings shell does not overflow on any tab', async ({ page }) => {
    await login(page);

    for (const tab of ['company', 'branches', 'users', 'payment-methods']) {
      await page.goto(`/settings?tab=${tab}`);
      await page.waitForLoadState('networkidle');
      const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(bodyWidth, `tab=${tab} overflowed`).toBeLessThanOrEqual(376);
    }
  });

  test('tabs scroll horizontally instead of wrapping', async ({ page }) => {
    await login(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav.flex.gap-1');
    await expect(nav).toBeVisible();
    const overflowX = await nav.evaluate((el) => getComputedStyle(el.parentElement!).overflowX);
    expect(overflowX).toBe('auto');
  });
});
