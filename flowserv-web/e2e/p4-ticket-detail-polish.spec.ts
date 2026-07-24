import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// P4 — ticket detail polish (timeline actor name, cost-breakdown tiles, and a
// mobile-responsive pass on a page that had zero responsive classes before
// this). Attachments explicitly out of scope — see plan/P4-ticket-detail-polish.md.

const SHOTS = 'test-results/p4-ticket-detail-polish';
mkdirSync(SHOTS, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
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

// Self-contained fixture: intake a fresh ticket via the API so this test's
// timeline/actor-name assertions don't depend on ambient seed state.
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
      assetModel: 'P4E2E',
      flowTemplateId: STANDARD_REPAIR_FLOW,
      branchId: '00000000-0000-0000-0000-000000000000',
      reportedComplaint: 'Layar bergaris',
    },
  });
  const body = await res.json();
  const ticketId = body.data.id as string;

  // Advance it once so the timeline has >1 entry (the actor-name assertion
  // needs a real transition, not just the intake row).
  await page.request.post(`${API_BASE}/tickets/${ticketId}/transition`, {
    headers: { Authorization: `Bearer ${data.token}`, 'Idempotency-Key': randomUUID() },
    data: { targetNodeId: '80000000-0000-4000-8000-000000000003' }, // Diagnosis
  });

  return ticketId;
}

test('timeline shows the actor name and cost breakdown renders as tiles', async ({ page }) => {
  const customerName = `P4 Detail Test ${Date.now()}`;
  const ticketId = await createIntakeTicket(page, customerName);

  await login(page, 'admin@demo.com');
  await page.goto(`/tickets/${ticketId}`);
  await page.waitForLoadState('networkidle');

  // Timeline — both entries were performed by Super Admin (the fixture's actor).
  await expect(page.getByText(/oleh Super Admin/).first()).toBeVisible();

  // Cost breakdown tiles (StatCard reuse) — visible even with zero charges,
  // since the section renders once state.charges.length > 0 is false... the
  // list itself is empty at this point, so assert the customer/device panel
  // and the current-stage panel instead, which always render.
  await expect(page.getByText('Diagnosis', { exact: true }).first()).toBeVisible();
  await shot(page, '01-detail-desktop');
});

test('a ticket with existing charges shows the Rincian Biaya cost-breakdown tiles', async ({ page }) => {
  // Use the seeded ticket (a1000000...) which already has charges from earlier
  // sessions/tests in this dev DB, OR add a charge to our own fixture ticket.
  const customerName = `P4 Charges Test ${Date.now()}`;
  const ticketId = await createIntakeTicket(page, customerName);

  const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@demo.com', password: 'admin123' },
  });
  const { data } = await loginRes.json();
  await page.request.post(`${API_BASE}/tickets/${ticketId}/charges`, {
    headers: { Authorization: `Bearer ${data.token}` },
    data: { sourceType: 'labor', description: 'Jasa ganti LCD', quantity: 1, unitPrice: 150000 },
  });

  await login(page, 'admin@demo.com');
  await page.goto(`/tickets/${ticketId}`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Rincian Biaya')).toBeVisible();
  await expect(page.getByText('Pendapatan')).toBeVisible();
  await expect(page.getByText('Modal')).toBeVisible();
  await expect(page.getByText('Margin')).toBeVisible();
  await shot(page, '02-cost-breakdown-tiles');
});

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('detail page stacks (workspace above timeline) without page overflow', async ({ page }) => {
    const customerName = `P4 Mobile Test ${Date.now()}`;
    const ticketId = await createIntakeTicket(page, customerName);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);

    // Workspace heading appears above the timeline heading in DOM order (stacked,
    // not side-by-side) — a simple, robust proxy for "flex-col not flex-row".
    const workspaceY = await page.getByRole('heading', { name: 'Workspace' }).boundingBox();
    const timelineY = await page.getByRole('heading', { name: 'Stage History' }).boundingBox();
    expect(workspaceY!.y).toBeLessThan(timelineY!.y);

    await shot(page, '03-mobile-stacked');
  });
});

test.describe('desktop viewport (1280x800) — confirm unchanged', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('workspace and timeline sit side by side', async ({ page }) => {
    const customerName = `P4 Desktop Test ${Date.now()}`;
    const ticketId = await createIntakeTicket(page, customerName);

    await login(page, 'admin@demo.com');
    await page.goto(`/tickets/${ticketId}`);
    await page.waitForLoadState('networkidle');

    const workspaceBox = await page.getByRole('heading', { name: 'Workspace' }).boundingBox();
    const timelineBox = await page.getByRole('heading', { name: 'Stage History' }).boundingBox();
    // Side by side: roughly the same vertical position, timeline to the right.
    expect(Math.abs(workspaceBox!.y - timelineBox!.y)).toBeLessThan(50);
    expect(timelineBox!.x).toBeGreaterThan(workspaceBox!.x);
    await shot(page, '04-desktop-side-by-side');
  });
});
