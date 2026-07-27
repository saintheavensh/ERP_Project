import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// H15 gap (b): a literal browser click-through of a repair from intake to close,
// driven only through the UI. Uses the transition control (a bare ticket can go
// Intake -> Diagnosis -> Repair -> Completion with no charges), so this is a
// reliable, selector-stable walk that catches UI dead ends the API e2e cannot see.
// The API-level correctness of the full money flow is already proven by
// flowserv-api/src/__tests__/e2e-service-flow.test.ts.

const SHOTS = 'test-results/intake-to-close';
mkdirSync(SHOTS, { recursive: true });

const pageErrors: string[] = [];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

// Pick the transition <option> whose text names the target stage, then execute.
async function transitionTo(page: Page, targetStage: string) {
  const value = await page.locator('#next option', { hasText: targetStage }).first().getAttribute('value');
  expect(value, `a transition option to "${targetStage}" should exist`).toBeTruthy();
  await page.selectOption('#next', value!);
  await page.getByRole('button', { name: 'Execute' }).click();
  // Wait for the re-render: the current-stage heading should now name the target.
  await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText(targetStage);
}

test('walks a repair from intake to close entirely through the UI', async ({ page }) => {
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // 1. Log in through the real login form. Wait for hydration to settle first —
  // the email input is a one-way controlled value={form?.email ?? ''}, so filling
  // it mid-hydration gets reset to ''. toHaveValue re-asserts until it sticks.
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@demo.com');
  await expect(page.locator('#email')).toHaveValue('admin@demo.com');
  await page.locator('#password').fill('admin123');
  await shot(page, '01-login');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

  // 2. New Intake — create a ticket for a brand-new customer.
  await page.goto('/tickets/intake');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'New Service Intake' })).toBeVisible();
  const uniqueName = `QA Playwright ${Date.now()}`;
  await page.fill('#name', uniqueName);
  await expect(page.locator('#name')).toHaveValue(uniqueName);
  // Typing a name opens the customer-search dropdown; a brand-new name matches
  // nothing, so we just leave it (submits as a new customer).
  await page.selectOption('#type', 'Smartphone');
  await page.fill('#brand', 'Samsung');
  await page.fill('#model', 'Galaxy A10');
  // Tahap B — tak ada lagi pemilih alur di intake: kasir baru memutuskan
  // ditunggu/disimpan setelah diagnosis, jadi tiket memakai alur default toko
  // ("Servis", satu template bercabang).
  await shot(page, '02-intake-filled');
  await page.getByRole('button', { name: 'Create Ticket' }).click();

  // 3. Lands on the ticket detail (intake goto's /tickets/:id).
  await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
  await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText('Intake');
  await shot(page, '03-ticket-intake');

  // 4. Walk the lifecycle to a terminal node using only the transition control.
  // Tahap B — tahapnya kini mengikuti template "Servis": setelah Diagnosis
  // kasir memilih cabang (di sini "Ditunggu", pelanggan menunggu di tempat),
  // lalu QC Awal → Pengerjaan → QC Akhir → Selesai.
  await transitionTo(page, 'Diagnosis');
  await shot(page, '04-diagnosis');

  await transitionTo(page, 'Ditunggu');
  await transitionTo(page, 'QC Awal');
  await transitionTo(page, 'Pengerjaan');
  await shot(page, '05-repair');

  await transitionTo(page, 'QC Akhir');
  await transitionTo(page, 'Selesai');
  await shot(page, '06-completion');

  // 5. Completion is terminal — the ticket is now closed. The workspace shows the
  // closed notice and offers no further transitions.
  await expect(page.getByText('already closed')).toBeVisible();
  await shot(page, '07-closed');

  // 6. No uncaught page errors anywhere in the walk (the real dead-end signal).
  expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
});
