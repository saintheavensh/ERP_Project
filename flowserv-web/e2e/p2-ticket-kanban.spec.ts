import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// P2 — Ticket Kanban board. Columns = flow nodes, cards = open tickets grouped by
// currentNodeId. Tap-to-move is the one interaction every viewport can rely on
// (native drag-and-drop is a desktop-only enhancement, verified manually — see
// plan/P2-ticket-kanban-board.md Decision 3, Playwright's native-HTML5-DnD support
// is too flaky to gate this task's completion on).

const SHOTS = 'test-results/p2-ticket-kanban';
mkdirSync(SHOTS, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function login(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

const API_BASE = 'http://localhost:3001/v1';
const STANDARD_REPAIR_FLOW = '80000000-0000-4000-8000-000000000001';

// Self-contained fixture: intake a fresh ticket via the API directly (not the UI —
// intake itself is exercised elsewhere, e.g. F7's spec) so this test never depends
// on ambient seed/leftover state from other tests moving all the Intake cards away.
async function createIntakeTicket(page: Page, customerName: string) {
  const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await loginRes.json();
  const res = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${data.token}` },
    data: {
      customerName,
      customerPhone: '081234567890',
      assetType: 'Laptop',
      assetBrand: 'Asus',
      assetModel: 'E2E',
      flowTemplateId: STANDARD_REPAIR_FLOW,
      branchId: '00000000-0000-0000-0000-000000000000',
    },
  });
  const body = await res.json();
  return body.data.id as string;
}

const NODE_DIAGNOSIS = '80000000-0000-4000-8000-000000000003';

// Advances a freshly-intaken ticket straight to Diagnosis via the API (as admin,
// who bypasses the ticket.diagnose gate) so the drag-and-drop test has a
// deterministic card to drag instead of depending on whatever earlier tests left
// sitting in that column.
async function createDiagnosisTicket(page: Page, customerName: string) {
  const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await loginRes.json();
  const ticketId = await createIntakeTicket(page, customerName);
  await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
    headers: { Authorization: `Bearer ${data.token}`, 'Idempotency-Key': randomUUID() },
    data: { targetNodeId: NODE_DIAGNOSIS },
  });
  return ticketId;
}

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('columns scroll horizontally without overflowing the page', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/tickets/board');
    await page.waitForLoadState('networkidle');

    // At least the seeded 5-node "Standard Repair" board renders more columns
    // than fit in a 375px viewport (each column is w-72 = 288px).
    const columns = page.locator('[role="list"]');
    await expect(columns.first()).toBeVisible();
    const count = await columns.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // The page itself must not overflow (the horizontal-scroll container, not
    // <body>, is what scrolls) — same min-w-0 shell fix as P1.5.
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
    await shot(page, '01-board-mobile-columns');
  });

  test('tap a card to see valid moves, tap a target to move it', async ({ page }) => {
    const customerName = `Tap Move ${Date.now()}`;
    await createIntakeTicket(page, customerName);

    await login(page, 'admin@demo.com');
    // Tahap B — papan kini default ke template "Servis"; fixture di atas sengaja
    // memakai Standard Repair (ID node-nya dikunci beberapa test), jadi papannya
    // diarahkan eksplisit ke template itu.
    await page.goto(`/tickets/board?flowTemplateId=${STANDARD_REPAIR_FLOW}`);
    await page.waitForLoadState('networkidle');

    const intakeColumn = page.locator('[role="list"]').filter({ hasText: 'Intake' }).first();
    const card = intakeColumn.locator('[role="listitem"]').filter({ hasText: customerName });
    await expect(card).toBeVisible();

    await card.getByRole('button').first().click();
    const moveToDiagnosis = card.getByRole('button', { name: /Diagnosis/ });
    await expect(moveToDiagnosis).toBeVisible();
    await shot(page, '02-move-panel-open');

    await moveToDiagnosis.click();
    // The move triggers invalidateAll(); the card should now appear under Diagnosis.
    await page.waitForLoadState('networkidle');
    const diagnosisColumn = page.locator('[role="list"]').filter({ hasText: 'Diagnosis' }).first();
    await expect(diagnosisColumn.getByText(customerName, { exact: true })).toBeVisible();
    await shot(page, '03-card-moved-to-diagnosis');
  });

  test('a role without ticket.diagnose gets a clear permission error moving into Diagnosis', async ({ page }) => {
    const customerName = `Perm Test ${Date.now()}`;
    await createIntakeTicket(page, customerName);

    await login(page, 'cashier@demo.com');
    // Tahap B — papan kini default ke template "Servis"; fixture di atas sengaja
    // memakai Standard Repair (ID node-nya dikunci beberapa test), jadi papannya
    // diarahkan eksplisit ke template itu.
    await page.goto(`/tickets/board?flowTemplateId=${STANDARD_REPAIR_FLOW}`);
    await page.waitForLoadState('networkidle');

    const intakeColumn = page.locator('[role="list"]').filter({ hasText: 'Intake' }).first();
    const card = intakeColumn.locator('[role="listitem"]').filter({ hasText: customerName });
    await expect(card).toBeVisible();

    await card.getByRole('button').first().click();
    const moveToDiagnosis = card.getByRole('button', { name: /Diagnosis/ });
    await expect(moveToDiagnosis).toBeVisible();
    await moveToDiagnosis.click();

    await expect(page.getByText(/permission|izin/i)).toBeVisible({ timeout: 10_000 });
    await shot(page, '04-permission-denied-error');
  });
});

test.describe('desktop viewport (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // Tahap A added two more service-domain templates (Ditunggu/Disimpan);
  // Tahap B added a fourth, "Servis" (satu template bercabang), and made IT the
  // default — the flow every new ticket actually uses now. Standard Repair is
  // kept only for tickets/tests that predate it. Assertion diperbarui ke
  // keadaan itu, bukan ke ID default lama yang sudah tidak benar.
  test('template dropdown appears now that multiple service flow templates exist', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/tickets/board');
    await page.waitForLoadState('networkidle');
    const select = page.locator('select');
    await expect(select).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Standard Repair' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Servis - Ditunggu' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Servis - Disimpan' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Servis' }).first()).toHaveCount(1);
    // Default kini "Servis" — satu-satunya isDefault, dipakai tiap tiket baru.
    await expect(select).toHaveValue('84000000-0000-4000-8000-000000000003');
    await shot(page, '05-desktop-board');
  });

  test('list <-> board cross-links work', async ({ page }) => {
    await login(page, 'admin@demo.com');
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Board View' }).click();
    await page.waitForURL(/\/tickets\/board$/);
    await page.getByRole('link', { name: /List View/ }).click();
    await page.waitForURL(/\/tickets$/);
  });

  // Desktop-only progressive enhancement (native HTML5 drag-and-drop). Playwright's
  // dragTo() drives real dragstart/dragover/drop events, so this exercises the exact
  // browser mechanism a mouse user would use, not a simulated shortcut.
  test('native drag-and-drop moves a card between valid columns', async ({ page }) => {
    const customerName = `Drag Test ${Date.now()}`;
    await createDiagnosisTicket(page, customerName);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/board?flowTemplateId=${STANDARD_REPAIR_FLOW}`);
    await page.waitForLoadState('networkidle');

    const diagnosisColumn = page.locator('[role="list"]').filter({ hasText: 'Diagnosis' }).first();
    const approvalColumn = page.locator('[role="list"]').filter({ hasText: 'Waiting Approval' }).first();
    const card = diagnosisColumn.locator('[role="listitem"]').filter({ hasText: customerName });
    await expect(card).toBeVisible();

    await card.dragTo(approvalColumn);
    await page.waitForLoadState('networkidle');
    await expect(approvalColumn.getByText(customerName, { exact: true })).toBeVisible({ timeout: 10_000 });
    await shot(page, '06-drag-and-drop-moved');
  });
});
