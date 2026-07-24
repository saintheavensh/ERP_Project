import { test, expect, type Page } from '@playwright/test';

// Tahap A — 2 flow template servis (Ditunggu/Disimpan) + field sandi/pola
// (go-live gap Tier-1 #2, plan/tahap-a-flow-templates.md). The flow engine,
// ticket detail page, and Kanban board are all generic over node names — this
// proves the two new templates (7/8 nodes each, including the "Unit Disimpan"
// node unique to the Disimpan flow) actually walk correctly through the real
// UI, and that the sandi/pola field round-trips.

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

  test('Disimpan flow: intake shows the template, and walks through Unit Disimpan', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    // All three templates are selectable (Standard Repair + the two new ones).
    await expect(page.locator('#flow option', { hasText: 'Servis - Disimpan' })).toHaveCount(1);
    await expect(page.locator('#flow option', { hasText: 'Servis - Ditunggu' })).toHaveCount(1);
    await expect(page.locator('#flow option', { hasText: 'Standard Repair' })).toHaveCount(1);

    const uniqueName = `Tahap A Disimpan ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Xiaomi');
    await page.fill('#model', 'Redmi Note 12');
    await page.selectOption('#flow', { label: 'Servis - Disimpan' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText('Intake');

    // Intake -> Diagnosis -> Unit Disimpan -- the node unique to this template.
    await transitionTo(page, 'Diagnosis');
    await transitionTo(page, 'Unit Disimpan');
    await transitionTo(page, 'Menunggu Persetujuan');
    await transitionTo(page, 'QC Awal');
    await transitionTo(page, 'Pengerjaan');
    await transitionTo(page, 'QC Akhir');
    await transitionTo(page, 'Selesai');

    // Terminal node closes the ticket (structural detection in the flow engine).
    await expect(page.getByText(/already closed/i)).toBeVisible();
  });

  test('Ditunggu flow: the Approval -> Selesai shortcut closes without repair/QC', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Tahap A Ditunggu Shortcut ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Samsung');
    await page.fill('#model', 'A05');
    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await transitionTo(page, 'Diagnosis');
    await transitionTo(page, 'Menunggu Persetujuan');
    // Shortcut: "ternyata tidak ada kerusakan" -- close directly, skipping QC/Repair.
    await transitionTo(page, 'Selesai');
    await expect(page.getByText(/already closed/i)).toBeVisible();
  });

  test('sandi/pola: set at intake, visible on the detail page, editable afterward', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Tahap A Passcode ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Oppo');
    await page.fill('#model', 'A57');
    await page.fill('#passcode', '1234');
    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page.getByText('1234', { exact: true })).toBeVisible();

    // Edit it — correcting a mis-keyed value. Scoped to the "Sandi / Pola" row
    // specifically: the Customer box's icon-only edit button's accessible name
    // ("Edit Customer") would otherwise substring-match a bare { name: 'Edit' }.
    const passcodeRow = page.getByText('Sandi / Pola').locator('..');
    await passcodeRow.getByRole('button', { name: 'Edit' }).click();
    await page.locator('input[placeholder="mis. 1234 atau pola L-terbalik"]').fill('5678');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('5678', { exact: true })).toBeVisible();
  });

  test('sandi/pola: left blank at intake shows a dash, not blank/undefined', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    const uniqueName = `Tahap A No Passcode ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Tablet');
    await page.selectOption('#flow', { label: 'Servis - Ditunggu' });
    await page.getByRole('button', { name: 'Create Ticket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    await expect(page.getByText('Sandi / Pola')).toBeVisible();
    // The dash placeholder for an empty devicePasscode. The label sits in an
    // inner flex row; the value <p> is a sibling of that row under the same
    // outer container, hence '../..' rather than '..'.
    await expect(page.getByText('Sandi / Pola').locator('../..').getByText('-', { exact: true })).toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('intake form with the new sandi/pola field does not overflow', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
