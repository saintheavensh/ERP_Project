// Single place to round computed money values. IDR amounts are whole IEEE-754
// doubles today, but once H6 adds percentage-based margin/tax, float rounding
// starts to matter — changing to a decimal library later only touches this file.
export const roundMoney = (n: number): number => Math.round(n * 100) / 100;
export const toMoneyString = (n: number): string => roundMoney(n).toFixed(2);
