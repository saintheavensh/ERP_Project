import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
    // Handle null, undefined, or NaN
    const safeAmount = amount ?? 0;
    if (isNaN(safeAmount)) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(safeAmount);
}

// Simple Code 128 B implementation for SVG generation
// This is a minimal implementation sufficient for standard alphanumeric service numbers
export function generateBarcodeSvg(text: string, height: number = 40): string {
    const code128BTable = [
        "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
        "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
        "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
        "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
        "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
        "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
        "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
        "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
        "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
        "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
        "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
    ];

    const startCode = 104; // Start B
    const stopCode = 106;

    let encoded = [code128BTable[startCode]];
    let checksum = startCode;

    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) - 32;
        encoded.push(code128BTable[charCode]);
        checksum += charCode * (i + 1);
    }

    const checkDigit = checksum % 103;
    encoded.push(code128BTable[checkDigit]);
    encoded.push(code128BTable[stopCode]);

    const bars = encoded.join("");
    let svgPath = "";
    let x = 0;

    // Width of a module (bar or space)
    const w = 1.5;

    for (let i = 0; i < bars.length; i++) {
        const barWidth = parseInt(bars[i]) * w;
        if (i % 2 === 0) { // Bar
            svgPath += `M${x},0h${barWidth}v${height}h-${barWidth}z `;
        }
        x += barWidth;
    }

    // Total width + padding
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" style="width: 100%; height: 100%;"><path d="${svgPath}" fill="black"/></svg>`;
}

import QRCode from "qrcode";

export async function generateQrCodeSvg(text: string): Promise<string> {
    try {
        return await QRCode.toString(text, {
            type: "svg",
            margin: 0,
            width: 100, // scalable via SVG
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        });
    } catch (err) {
        console.error("QR Generation Error", err);
        return "";
    }
}
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}
