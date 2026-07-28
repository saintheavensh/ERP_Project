import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// P7 — mobile responsive sweep (plan/P7-plus-phase5-completion-plan.md P7.1-P7.5).
// Every page listed here previously rendered a bare <table> (or fixed-width row)
// with no overflow-x-auto wrapper, forcing whole-page horizontal scroll on a
// phone. This walks each one at 375px and asserts the page itself never
// exceeds the viewport width — the same bar every P1.5-era fix was held to.

const SHOTS = 'test-results/p7-mobile-sweep';
mkdirSync(SHOTS, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function login(page: Page, email = 'admin@demo.com', password = 'admin123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

async function assertNoOverflow(page: Page, path: string, shotName: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(bodyWidth, `${path} overflowed: ${bodyWidth}px > 376px`).toBeLessThanOrEqual(376);
  await shot(page, shotName);
}

test.describe('mobile viewport (375x667) — P7 fixed pages', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('finance pages (P7.1)', async ({ page }) => {
    await login(page);
    await assertNoOverflow(page, '/finance/ledger', '01-finance-ledger');
    await assertNoOverflow(page, '/finance/payables', '02-finance-payables');
    await assertNoOverflow(page, '/finance/receivables', '03-finance-receivables');
  });

  // S3 (penyederhanaan) — keempat daftar pembelian yang dulu terpisah kini satu
  // halaman bertab. Yang diperiksa tetap sama: tiap tab tak boleh meluber.
  test('purchasing list pages (P7.2)', async ({ page }) => {
    await login(page);
    await assertNoOverflow(page, '/inventory/purchasing', '04-purchasing-all');
    await assertNoOverflow(page, '/inventory/purchasing?status=menunggu', '05-purchasing-menunggu');
    await assertNoOverflow(page, '/inventory/purchasing?status=nota', '06-purchasing-nota');
    await assertNoOverflow(page, '/inventory/purchasing?status=selesai', '07-purchasing-selesai');
  });

  test('purchasing new-PO form (P7.3)', async ({ page }) => {
    await login(page);
    await assertNoOverflow(page, '/inventory/purchasing/new', '08-purchasing-new');
  });

  test('inventory sub-pages (P7.4)', async ({ page }) => {
    await login(page);
    await assertNoOverflow(page, '/inventory/brands', '10-inventory-brands');
    await assertNoOverflow(page, '/inventory/categories', '11-inventory-categories');
    await assertNoOverflow(page, '/inventory/opname', '12-inventory-opname');
    await assertNoOverflow(page, '/inventory/suppliers', '13-inventory-suppliers');
  });

  test('misc pages (P7.5): ticket intake + customer detail', async ({ page }) => {
    await login(page);
    await assertNoOverflow(page, '/tickets/intake', '14-ticket-intake');

    // Customer detail needs a real id — navigate through the list rather
    // than hardcoding one that might not exist in this dev DB.
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    const firstCustomerLink = page.locator('a[href^="/customers/"]').first();
    if ((await firstCustomerLink.count()) > 0) {
      await firstCustomerLink.click();
      await page.waitForLoadState('networkidle');
      const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(376);
      await shot(page, '15-customer-detail');
    }
  });

  test('POS invoice detail modal does not overflow (P7.5)', async ({ page }) => {
    await login(page);
    await page.goto('/pos/history');
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) > 0) {
      await firstRow.click();
      await page.waitForTimeout(300);
      const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(376);
      await shot(page, '16-pos-invoice-modal');
    }
  });
});

test.describe('desktop viewport (1280x800) — confirm unchanged', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('finance and purchasing pages still render normally', async ({ page }) => {
    await login(page);
    await page.goto('/finance/payables');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible();

    await page.goto('/inventory/purchasing?status=menunggu');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('table').first()).toBeVisible();
  });
});
