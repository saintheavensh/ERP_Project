import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, generateBarcodeSvg, generateQrCodeSvg, formatDate } from '$lib/shared/lib/utils';

describe('utils', () => {
    describe('cn()', () => {
        it('should merge tailwind classes properly', () => {
            const result = cn('text-red-500', 'text-blue-500', 'font-bold');
            expect(result).toBe('text-blue-500 font-bold'); // Note twMerge keeps last overriding class
        });
        it('should handle conditional classes', () => {
            const condition = true;
            const result = cn('base', condition && 'active', !condition && 'inactive');
            expect(result).toBe('base active');
        });
    });

    describe('formatCurrency()', () => {
        it('should format numbers clearly to IDR', () => {
            // Note: Intl outputs might contain non-breaking spaces based on environment
            // E.g., "Rp 10.000" or "Rp10.000"
            const str = formatCurrency(10000).replace(/\s+/g, ' ');
            expect(str).toMatch(/Rp\s?10\.000/);
        });
        it('should handle null/undefined as Rp 0', () => {
            expect(formatCurrency(null).replace(/\s+/g, ' ')).toMatch(/Rp\s?0/);
            expect(formatCurrency(undefined).replace(/\s+/g, ' ')).toMatch(/Rp\s?0/);
        });
        it('should handle NaN as Rp 0', () => {
            expect(formatCurrency(NaN).replace(/\s+/g, ' ')).toMatch(/Rp\s?0/);
        });
    });

    describe('generateBarcodeSvg()', () => {
        it('should return a valid svg string for text', () => {
            const svg = generateBarcodeSvg('12345');
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
            expect(svg).toContain('<path');
        });
    });

    describe('generateQrCodeSvg()', () => {
        it('should return a valid svg from qrcode generation', async () => {
            const svg = await generateQrCodeSvg('https://example.com');
            expect(svg).toContain('<svg');
        });
    });

    describe('formatDate()', () => {
        it('should handle valid date strings', () => {
            const formatted = formatDate('2023-01-01T10:00:00Z');
            expect(formatted).not.toBe('-');
            // Just check it looks somewhat like a date rather than exact, since formats vary by TZ
        });
        it('should handle null/undefined correctly by returning "-"', () => {
            expect(formatDate(null)).toBe('-');
            expect(formatDate(undefined)).toBe('-');
        });
    });
});
