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

  // Tahap B — dua tes berikut dulu menguji DUA template terpisah yang dipilih di
  // form intake. Alur nyata toko tidak begitu: kasir baru memutuskan
  // ditunggu/disimpan SETELAH diagnosis, jadi keduanya kini satu template
  // bercabang dan pemilih di intake sudah dihapus. Yang diuji tetap sama
  // nilainya: cabang Disimpan benar-benar bisa dilalui, dan jalur pintas
  // "tidak ada kerusakan" menutup tiket tanpa bongkar.

  test('cabang Disimpan: dipilih setelah Diagnosis, lalu berjalan sampai tutup', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    // Pemilih alur sudah tidak ada — inilah perubahan intinya.
    await expect(page.locator('#flow')).toHaveCount(0);

    const uniqueName = `Tahap B Disimpan ${Date.now()}`;
    await page.fill('#name', uniqueName);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Xiaomi');
    await page.fill('#model', 'Redmi Note 12');
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.locator('h2', { hasText: 'Current Stage:' })).toContainText('Intake');

    // Percabangan: dari Diagnosis, KEDUA pilihan tersedia — ini keputusan kasir.
    await transitionTo(page, 'Diagnosis');
    await expect(page.locator('#next option', { hasText: 'Ditunggu' })).toHaveCount(1);
    await expect(page.locator('#next option', { hasText: 'Unit Disimpan' })).toHaveCount(1);

    await transitionTo(page, 'Unit Disimpan');
    await transitionTo(page, 'QC Awal');
    await transitionTo(page, 'Pengerjaan');
    await transitionTo(page, 'QC Akhir');
    await transitionTo(page, 'Selesai');

    // Terminal node closes the ticket (structural detection in the flow engine).
    await expect(page.getByText(/already closed/i)).toBeVisible();
  });

  test('jalur pintas Diagnosis -> Selesai menutup tanpa bongkar/QC', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', `Tahap B Pintas ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.fill('#brand', 'Samsung');
    await page.fill('#model', 'A05');
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await transitionTo(page, 'Diagnosis');
    // "Ternyata tidak ada kerusakan" — tutup langsung.
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
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.getByText('1234', { exact: true })).toBeVisible();

    // Edit it — correcting a mis-keyed value. Scoped to the "Sandi / Pola" row
    // specifically: the Customer box's icon-only edit button's accessible name
    // ("Edit Customer") would otherwise substring-match a bare { name: 'Ubah' }.
    const passcodeRow = page.getByText('Sandi / Pola').locator('..');
    await passcodeRow.getByRole('button', { name: 'Ubah' }).click();
    await page.locator('#passcode').fill('5678');
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
    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();

    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.getByText('Sandi / Pola')).toBeVisible();
    // The dash placeholder for an empty devicePasscode. The label sits in an
    // inner flex row; the value <p> is a sibling of that row under the same
    // outer container, hence '../..' rather than '..'.
    await expect(page.getByText('Sandi / Pola').locator('../..').getByText('-', { exact: true })).toBeVisible();
  });

  test('sandi/pola: draw a pattern at intake, recorded precisely + shown on detail', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', `Tahap A Pattern ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');

    // Switch to "Pola" mode and tap the dots 1 -> 2 -> 3 -> 6 -> 9.
    await page.getByRole('button', { name: 'Pola', exact: true }).click();
    const pad = page.getByTestId('pattern-pad');
    for (const i of [1, 2, 3, 6, 9]) {
      await pad.getByRole('button', { name: `Titik ${i}`, exact: true }).click();
    }
    await expect(pad.getByText('Urutan: 1-2-3-6-9')).toBeVisible();

    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });

    // Detail shows the precise pattern (visual grid + textual sequence), not a
    // vague "L terbalik".
    await expect(page.getByText('Pola 1-2-3-6-9', { exact: true })).toBeVisible();
    await expect(page.getByTestId('pattern-pad')).toBeVisible();
  });

  test('sandi/pola: DRAW by dragging across the dots (swipe like a real phone)', async ({ page }) => {
    await login(page);
    await page.goto('/tickets/intake');
    await page.waitForLoadState('networkidle');

    await page.fill('#name', `Tahap A Draw ${Date.now()}`);
    await page.selectOption('#type', 'Smartphone');
    await page.getByRole('button', { name: 'Pola', exact: true }).click();

    // Drag the diagonal 1 -> 5 -> 9 then across to 8, without clicking each dot.
    // viewBox is 0..180, the svg renders at ~160px, so scale screen px by width/180.
    //
    // R1.5C — dulu pola ini 3 titik (1-5-9). Sejak sandi/pola wajib minimal 4,
    // 3 titik ditolak backend, jadi datanya diperpanjang jadi 4. Yang diuji
    // tidak berubah: MENYERET melewati titik, bukan menekan satu per satu.
    const svg = page.getByTestId('pattern-pad').locator('svg');
    const box = (await svg.boundingBox())!;
    const at = (vx: number, vy: number) => ({
      x: box.x + (vx / 180) * box.width,
      y: box.y + (vy / 180) * box.height,
    });
    const p1 = at(30, 30), p5 = at(90, 90), p9 = at(150, 150), p8 = at(90, 150);

    await page.mouse.move(p1.x, p1.y);
    await page.mouse.down();
    await page.mouse.move(p5.x, p5.y, { steps: 8 });
    await page.mouse.move(p9.x, p9.y, { steps: 8 });
    await page.mouse.move(p8.x, p8.y, { steps: 8 });
    await page.mouse.up();

    const pad = page.getByTestId('pattern-pad');
    await expect(pad.getByText('Urutan: 1-5-9-8')).toBeVisible();

    await page.getByRole('button', { name: 'Simpan & Terima Unit' }).click();
    // R1.5D — kasir kini TETAP di form setelah simpan (toast, bukan
    // lemparan halaman). Tes ini butuh halaman tiketnya, jadi ia
    // menempuh jalan yang sama seperti kasir sungguhan.
    await page.getByRole('link', { name: 'Lihat tiket' }).click();
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 20_000 });
    await expect(page.getByText('Pola 1-5-9-8', { exact: true })).toBeVisible();
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
