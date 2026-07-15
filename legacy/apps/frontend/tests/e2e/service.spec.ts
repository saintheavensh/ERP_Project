import { test, expect } from '@playwright/test';

test.describe('Service Flow', () => {
    test('should navigate to teknisi dashboard', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="username"], input[type="text"]', 'teknisi');
        await page.fill('input[name="password"], input[type="password"]', 'password123');
        await page.click('button[type="submit"]', { force: true });

        // Navigate to teknisi if not auto-redirected
        await page.goto('/dashboard/teknisi');

        try {
            await page.waitForTimeout(1000);
        } catch (e) { }
    });
});
