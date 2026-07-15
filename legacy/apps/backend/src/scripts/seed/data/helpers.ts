/**
 * Shared helpers and constants for database seeding
 */

// ============================================
// USER IDs
// ============================================
export const USER_IDS = {
    admin: "USR-ADMIN001",
    teknisi1: "USR-TEKNIS01",
    teknisi2: "USR-TEKNIS02",
    kasir: "USR-KASIR001",
};

// ============================================
// CATEGORY IDs
// ============================================
export const CATEGORY_IDS = {
    hp: "CAT-HP001",
    sparepart: "CAT-PART001",
    accessory: "CAT-ACC001",
    service: "CAT-SRV001",
};

// ============================================
// SUPPLIER IDs
// ============================================
export const SUPPLIER_IDS = {
    global: "SUP-GLOBAL01",
    lokal: "SUP-LOKAL01",
};

// ============================================
// PRODUCT IDs
// ============================================
export const PRODUCT_IDS = {
    iphone13: "PRD-IP13-001",
    lcdIpX: "PRD-LCD-IPX",
    batreIpX: "PRD-BAT-IPX",
    lcd13Pro: "PRD-LCD-13PRO",
    caseClear: "PRD-CASE-001",
    tempered: "PRD-TG-001",
};

// ============================================
// BATCH IDs
// ============================================
export const BATCH_IDS = {
    iphone13A: "B-IP13-A",
    lcdIpXA: "B-LCDX-A",
    batreIpXA: "B-BATX-A",
    lcd13ProA: "B-LCD13PRO-A",
    caseA: "B-CASE-A",
    tgA: "B-TG-A",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a date in the past
 */
export function getPastDate(daysAgo: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d;
}

/**
 * Get date within a specific month bracket
 * M1: 60-90 days ago, M2: 30-59 days, M3: 0-29 days
 */
export function getMonthDate(month: 1 | 2 | 3, dayWithin: number): Date {
    const offsets: Record<number, number> = { 1: 60, 2: 30, 3: 0 };
    return getPastDate(offsets[month] + dayWithin);
}

/**
 * Pick random item from array
 */
export function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate random phone number
 */
export function randomPhone(): string {
    return `08${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

/**
 * Generate random cost within range
 */
export function randomCost(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate service number with date prefix
 */
export function genSrvNo(date: Date): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SRV-${dateStr}-${random}`;
}

/**
 * Get current year
 */
export const CURRENT_YEAR = new Date().getFullYear();
