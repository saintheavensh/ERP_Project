import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from "node-thermal-printer";
import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import util from "node:util";
import { Logger } from "../../utils/logger/Logger";

const execAsync = util.promisify(exec);

export class PrintService {
    private printer: ThermalPrinter;
    private interface: string;

    constructor() {
        // Default to Windows UNC path format with backslashes
        const defaultPrinter = "\\\\localhost\\ReceiptPrinter";
        const envPrinter = process.env.PRINTER_INTERFACE;

        // Ensure we use backslashes for Windows paths
        this.interface = (envPrinter || defaultPrinter).replace(/\//g, "\\");

        new Logger("Legacy").info("Printer Interface:", { interface: this.interface });

        this.printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: this.interface,
            characterSet: CharacterSet.PC852_LATIN2,
            removeSpecialCharacters: false,
            lineCharacter: "=",
            breakLine: BreakLine.WORD,
            options: {
                timeout: 5000
            }
        });
    }

    async printServiceNote(service: any) {
        this.printer.clear();

        // Header
        this.printer.alignCenter();
        this.printer.bold(true);
        this.printer.setTextSize(1, 1);
        this.printer.println("SAINT HEAVENS");
        this.printer.bold(false);
        this.printer.setTextSize(0, 0);
        this.printer.println("Service & Sparepart Handphone");
        this.printer.println("Jl. Raya No. 123 (0812-3456-7890)");
        this.printer.drawLine();

        this.printer.bold(true);
        this.printer.println("SERVICE DOJO");
        this.printer.bold(false);
        this.printer.newLine();

        // Helper for labeled lines
        const printLine = (label: string, value: string, boldValue = false) => {
            this.printer.print(label + " ");
            if (boldValue) this.printer.bold(true);
            this.printer.print(value);
            if (boldValue) this.printer.bold(false);
            this.printer.newLine();
        };

        const formatDate = (date: any) => {
            if (!date) return "-";
            const d = new Date(date);
            return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID");
        };

        this.printer.alignLeft();
        printLine("No. Service:", service.no, true);
        printLine("Tanggal:    ", formatDate(service.dateIn));
        printLine("Customer:   ", service.customer?.name || "-", true);
        printLine("Telepon:    ", service.customer?.phone || "-");

        this.printer.drawLine();

        // Unit Details
        // 'device' is the correct DB column (JSON), not 'phone'
        const device = service.device || {};
        const unitName = `${device.brand || ""} ${device.model || ""}`.trim() || "-";
        printLine("Unit:       ", unitName);
        printLine("Keluhan:    ", service.complaint || "-");

        // Handle Arrays (Condition & Completeness)
        // Ensure they are arrays before joining
        const conditions = Array.isArray(device.condition) ? device.condition.join(", ") : (device.condition || "-");
        const items = Array.isArray(device.completeness) ? device.completeness.join(", ") : (device.completeness || "-");

        printLine("Kondisi:    ", conditions);
        printLine("Klengkapan: ", items);

        this.printer.newLine();

        // Cost Estimation Logic
        let costText = "Menunggu Konfirmasi";

        // Priority 1: Diagnosis String Range (e.g. "100k - 200k")
        // Diagnosis might be stored as JSON string or object
        let diagnosisObj: any = null;
        if (typeof service.diagnosis === 'string' && service.diagnosis.startsWith('{')) {
            try { diagnosisObj = JSON.parse(service.diagnosis); } catch { }
        } else if (typeof service.diagnosis === 'object') {
            diagnosisObj = service.diagnosis;
        }

        if (diagnosisObj?.estimatedCost) {
            costText = diagnosisObj.estimatedCost;
        }
        // Priority 2: Numeric Cost Estimate
        else if (service.costEstimate && service.costEstimate > 0) {
            costText = `Rp ${service.costEstimate.toLocaleString('id-ID')}`;
        }

        printLine("Est. Biaya: ", costText, true); // Bold the cost
        this.printer.newLine();

        this.printer.newLine();

        // QR Code
        this.printer.alignCenter();
        try {
            // Generate standard Buffer for QR
            // Width 350 is good for 80mm (approx 500-570 printable width)
            const buffer = await QRCode.toBuffer(service.no, { width: 350 });
            // Print Image
            await this.printer.printImageBuffer(buffer);
        } catch (e) {
            new Logger("Legacy").error("QR Print Error", e);
            this.printer.println(`[${service.no}]`);
        }

        this.printer.newLine();
        this.printer.println(service.no);

        // Footer
        this.printer.newLine();
        this.printer.println("Harap bawa struk ini saat pengambilan.");
        this.printer.println("Terima Kasih!");

        this.printer.cut();

        try {
            // Execute Print
            // For Windows Shared Printer, we copy file to share path
            // For Network, we use execute() if driver supports it, strictly for TCP/IP usually
            // Here we use a workaround for Windows USB/Shared printers:
            // Write to a temporary file and COPY it to the printer share.

            const buffer = this.printer.getBuffer();
            const tempFile = path.resolve(process.cwd(), "temp_print.bin");
            await fs.writeFile(tempFile, buffer);

            // Using PowerShell/CMD to copy binary to printer
            // Command: COPY /B temp_print.bin \\Computer\Printer
            const cmd = `COPY /B "${tempFile}" "${this.interface}"`;
            new Logger("Legacy").info(`Executing Print Command: ${cmd}`);

            await execAsync(cmd, { shell: "cmd.exe" });

            // Cleanup
            // await fs.unlink(tempFile);
            return { success: true };
        } catch (error) {
            new Logger("Legacy").error("Print Service Error", error);
            return { success: false, error };
        }
    }

    async printProductLabel(item: { productName: string; variantName?: string; code: string; price?: number }) {
        this.printer.clear();
        this.printer.alignCenter();

        // Product Line
        this.printer.bold(true);
        this.printer.setTextSize(1, 1);
        this.printer.println(item.productName.toUpperCase());
        this.printer.setTextSize(0, 0);
        if (item.variantName && item.variantName !== "Standard" && item.variantName !== "Default" && item.variantName !== "") {
            this.printer.println(`(${item.variantName})`);
        }
        this.printer.bold(false);

        // Price Line (Optional)
        if (item.price) {
            this.printer.println(`Rp ${item.price.toLocaleString('id-ID')}`);
        }

        this.printer.newLine();

        // QR Code
        try {
            const buffer = await QRCode.toBuffer(item.code, { width: 300 });
            await this.printer.printImageBuffer(buffer);
        } catch (e) {
            this.printer.println(`[${item.code}]`);
        }

        this.printer.newLine();
        this.printer.println(item.code);

        this.printer.cut();

        try {
            const buffer = this.printer.getBuffer();
            const tempFile = path.resolve(process.cwd(), "temp_label.bin");
            await fs.writeFile(tempFile, buffer);
            const cmd = `COPY /B "${tempFile}" "${this.interface}"`;
            await execAsync(cmd, { shell: "cmd.exe" });
            return { success: true };
        } catch (error) {
            new Logger("Legacy").error("Label Print Error", error);
            return { success: false, error };
        }
    }
}
