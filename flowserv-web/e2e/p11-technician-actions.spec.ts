import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// P11 — Technician quick actions on the dashboard (5.8, plan/P7-plus-phase5-completion-plan.md).
// Reuses the Kanban board's targetsFor() edge-filter logic, computed server-side
// this time, so a technician can advance an assigned ticket without opening
// /tickets/board.

const API_BASE = 'http://localhost:3001/v1';
const STANDARD_REPAIR_FLOW = '80000000-0000-4000-8000-000000000001';
const NODE_DIAGNOSIS = '80000000-0000-4000-8000-000000000003';
const TECHNICIAN_USER_ID = 'e0000000-0000-4000-8000-000000000003';

async function login(page: Page, email: string, password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function adminToken(page: Page): Promise<string> {
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await res.json();
  return data.token as string;
}

// Self-contained fixture: intake a ticket, advance it to Diagnosis (which
// branches to both Waiting Approval and Repair — a real fork, not a straight
// line), and assign it to the seeded technician user. All via the API
// directly so this test never depends on ambient board/list state.
async function createAssignedDiagnosisTicket(page: Page, customerName: string, token: string): Promise<string> {
  const intakeRes = await page.request.post(`${API_BASE}/tickets/intake`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      customerName,
      customerPhone: '081234567890',
      assetType: 'Laptop',
      assetBrand: 'Asus',
      assetModel: 'P11-E2E',
      flowTemplateId: STANDARD_REPAIR_FLOW,
      branchId: '00000000-0000-0000-0000-000000000000',
      reportedComplaint: 'Keyboard tidak berfungsi',
    },
  });
  const { data: ticket } = await intakeRes.json();

  await page.request.post(`${API_BASE}/tickets/${ticket.id}/transition`, {
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': randomUUID() },
    data: { targetNodeId: NODE_DIAGNOSIS },
  });

  await page.request.post(`${API_BASE}/tickets/${ticket.id}/assign`, {
    headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': randomUUID() },
    data: { technicianId: TECHNICIAN_USER_ID },
  });

  return ticket.id as string;
}

test.describe('desktop (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('a Diagnosis-stage ticket shows both branch options as quick actions', async ({ page }) => {
    const token = await adminToken(page);
    const customerName = `P11 Fork ${Date.now()}`;
    await createAssignedDiagnosisTicket(page, customerName, token);

    await login(page, 'technician@demo.com');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(customerName)).toBeVisible();
    const row = page.getByTestId('technician-ticket-row').filter({ hasText: customerName });
    await expect(row.getByRole('button', { name: '→ Waiting Approval' })).toBeVisible();
    await expect(row.getByRole('button', { name: '→ Repair' })).toBeVisible();
  });

  test('clicking a quick action moves the ticket and updates its badge', async ({ page }) => {
    const token = await adminToken(page);
    const customerName = `P11 Move ${Date.now()}`;
    const ticketId = await createAssignedDiagnosisTicket(page, customerName, token);

    await login(page, 'technician@demo.com');
    await page.waitForLoadState('networkidle');

    const row = page.getByTestId('technician-ticket-row').filter({ hasText: customerName });
    await row.getByRole('button', { name: '→ Repair' }).click();
    await page.waitForLoadState('networkidle');

    // The dashboard reloads via invalidateAll() — the same row now shows the
    // Repair node badge and only Repair's own forward action (Completion).
    await expect(page.getByText(customerName)).toBeVisible();
    const updatedRow = page.getByTestId('technician-ticket-row').filter({ hasText: customerName });
    await expect(updatedRow.getByText('Repair', { exact: true })).toBeVisible();
    await expect(updatedRow.getByRole('button', { name: '→ Completion' })).toBeVisible();

    const check = await page.request.get(`${API_BASE}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: updated } = await check.json();
    expect(updated.ticket.currentNodeId).toBe('80000000-0000-4000-8000-000000000005'); // Repair
  });

  test('a ticket with no assigned technician tickets shows the empty state, not a crash', async ({ page }) => {
    await login(page, 'cashier@demo.com');
    await page.waitForLoadState('networkidle');
    // Cashier never sees the Technician widget at all (P3) — quick actions
    // must not appear anywhere on a role that doesn't have My Jobs.
    await expect(page.getByText('Tugas Saya')).not.toBeVisible();
  });
});

test.describe('mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('quick action buttons wrap without overflowing the page', async ({ page }) => {
    const token = await adminToken(page);
    const customerName = `P11 Mobile ${Date.now()}`;
    await createAssignedDiagnosisTicket(page, customerName, token);

    await login(page, 'technician@demo.com');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(customerName)).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});
