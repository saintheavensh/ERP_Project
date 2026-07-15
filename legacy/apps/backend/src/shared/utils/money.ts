/**
 * Money utilities for integer-based currency values.
 * Centralizes rounding, subtotal and net amount calculations,
 * and comparison with a small floating-point tolerance.
 */

export const MONEY_TOLERANCE = 0.01;

/**
 * Round a monetary value to the nearest integer unit.
 * Assumes all values are already in smallest currency units.
 */
export function roundMoney(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value);
}

/**
 * Multiply a unit price by quantity with consistent rounding.
 */
export function multiplyMoney(price: number, qty: number): number {
    return roundMoney(price * qty);
}

/**
 * Sum an array of monetary values with consistent rounding at the end.
 */
export function sumMoney(values: number[]): number {
    const total = values.reduce((acc, v) => acc + v, 0);
    return roundMoney(total);
}

/**
 * Compute net amount from goods, shipping fee, and discount.
 */
export function computeNetAmount(
    goodsAmount: number,
    shippingFee: number = 0,
    discountAmount: number = 0
): number {
    return roundMoney(goodsAmount + shippingFee - discountAmount);
}

/**
 * Compare two monetary values with a small tolerance to absorb FP noise.
 */
export function moneyEquals(a: number, b: number, tolerance: number = MONEY_TOLERANCE): boolean {
    return Math.abs(a - b) <= tolerance;
}

