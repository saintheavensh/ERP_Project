import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// P1.5 — the app shell (fixed 256px sidebar, no collapse) was unusable on a phone
// viewport: it alone ate 68% of a 375px screen. This walks the fix at a real phone
// viewport: sidebar hidden by default behind a hamburger, opens as an off-canvas
// drawer, closes on backdrop tap or navigation. Also spot-checks the two other
// worst offenders the audit found (wide tables, the POS fixed-width cart) at the
// same viewport, and confirms desktop (no hamburger, sidebar always visible) is
// unchanged.

const SHOTS = 'test-results/p1.5-mobile-shell';
mkdirSync(SHOTS, { recursive: true });

const pageErrors: string[] = [];

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@demo.com');
  await expect(page.locator('#email')).toHaveValue('admin@demo.com');
  await page.locator('#password').fill('admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

test.describe('mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('sidebar is a closed-by-default drawer, opens via hamburger, closes on backdrop tap', async ({ page }) => {
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    await login(page);
    await page.waitForLoadState('networkidle');
    await shot(page, '01-dashboard-drawer-closed');

    // Sidebar off-screen by default — its nav links aren't in the visible viewport.
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // Hamburger opens it.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible();
    await page.waitForTimeout(250); // let the 200ms slide transition finish before the screenshot
    await shot(page, '02-drawer-open');

    // Tapping the backdrop closes it again. Click a point actually outside the
    // 256px-wide drawer (the backdrop covers the full viewport including the
    // area behind the drawer, but the drawer visually sits on top there — a
    // real tap on the visible backdrop, to the right of the drawer, is what
    // this simulates).
    await page.getByRole('button', { name: 'Close menu overlay' }).click({ position: { x: 320, y: 300 } });
    await expect(sidebar).toHaveClass(/-translate-x-full/);
    await shot(page, '03-drawer-closed-after-backdrop-tap');

    // The explicit X button inside the drawer header also closes it.
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(sidebar).toHaveClass(/translate-x-0/);
    await page.getByRole('button', { name: 'Close menu', exact: true }).click();
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // Opening it and navigating closes it too (afterNavigate hook).
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('link', { name: 'Tickets' }).click();
    await page.waitForURL(/\/tickets$/);
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
  });

  test('tickets table scrolls horizontally instead of clipping', async ({ page }) => {
    await login(page);
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
    const scrollRegion = page.locator('.overflow-x-auto').first();
    await expect(scrollRegion).toBeVisible();
    // The table itself is wider than the phone viewport (min-w-[720px] vs 375px) —
    // that's the point: it scrolls inside scrollRegion instead of clipping/overflowing the page.
    const tableBox = await page.locator('table').first().boundingBox();
    expect(tableBox!.width).toBeGreaterThan(375);
    // The page itself must not be wider than the viewport (min-w-0 on <main> fix).
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376); // 1px rounding tolerance
    await shot(page, '04-tickets-table-scrolls');
  });

  test('POS stacks product grid above cart instead of a fixed-width cart overflowing the screen', async ({ page }) => {
    await login(page);
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    await shot(page, '05-pos-stacked');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376);
  });
});

test.describe('desktop viewport (1280x800) — confirm unchanged', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sidebar is always visible, no hamburger', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).not.toBeVisible();
    await shot(page, '06-desktop-unchanged');
  });
});
