import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { OpnameService } from "./opname.service";

interface OpnameItem {
    id: number;
    systemStock: number;
    physicalStock: number | null;
    difference: number;
    adjustmentReason: string | null;
    variantName: string | null;
    product: { name: string } | null;
}

interface OpnameSession {
    id: string;
    status: "draft" | "completed" | "cancelled";
    notes: string | null;
    createdAt: string;
    user: { name: string } | null;
    items: OpnameItem[];
}

/**
 * Controller for the Opname Session Detail page
 * Manages session data, item updates, and session finalization
 */
export class OpnameDetailController {
    private sessionId: string;

    // State
    session = $state<OpnameSession | null>(null);
    isLoading = $state(true);
    isSaving = $state(false);
    searchTerm = $state("");
    items = $state<OpnameItem[]>([]);

    constructor(sessionId: string) {
        this.sessionId = sessionId;
    }

    // Derived state
    get filteredItems() {
        return this.items.filter(
            (item) =>
                item.product?.name
                    .toLowerCase()
                    .includes(this.searchTerm.toLowerCase()) ||
                item.variantName
                    ?.toLowerCase()
                    .includes(this.searchTerm.toLowerCase()),
        );
    }

    get totalDifference(): number {
        return this.items.reduce((acc, item) => acc + (item.difference || 0), 0);
    }

    get countedItemsCount(): number {
        return this.items.filter((i) => i.physicalStock !== null).length;
    }

    get totalItemsCount(): number {
        return this.items.length;
    }

    get isDraft(): boolean {
        return this.session?.status === "draft";
    }

    // Actions
    async fetchSession() {
        this.isLoading = true;
        try {
            this.session = await OpnameService.getOpnameSessionDetails(this.sessionId);
            if (this.session) {
                this.items = [...this.session.items];
            }
        } catch (error) {
            toast.error("Failed to fetch session details");
        } finally {
            this.isLoading = false;
        }
    }

    async updateItem(item: OpnameItem) {
        try {
            const result = await OpnameService.updateOpnameItem(item.id, {
                physicalStock: item.physicalStock ?? 0,
                reason: item.adjustmentReason ?? undefined,
            });
            item.difference = result.difference;
            toast.success(`Updated ${item.product?.name}`);
        } catch (error) {
            toast.error("Failed to update item");
        }
    }

    updateItemDifference(item: OpnameItem) {
        item.difference = (item.physicalStock || 0) - item.systemStock;
    }

    async handleFinalize() {
        if (
            !confirm(
                "Are you sure you want to finalize this session? This will update system stock levels.",
            )
        )
            return;

        this.isSaving = true;
        try {
            await OpnameService.finalizeOpnameSession(this.sessionId);
            toast.success("Session finalized successfully");
            await this.fetchSession();
        } catch (error) {
            toast.error("Failed to finalize session");
        } finally {
            this.isSaving = false;
        }
    }

    async handleCancel() {
        if (!confirm("Cancel this session? All counts will be lost.")) return;

        try {
            await OpnameService.cancelOpnameSession(this.sessionId);
            toast.success("Session cancelled");
            goto("/inventory/opname");
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    }

    handleBack() {
        goto("/inventory/opname");
    }

    handlePrint() {
        if (!this.session) {
            toast.error("No session data to print");
            return;
        }

        const sessionDate = new Date(this.session.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        const itemRows = this.items
            .map(
                (item) => `
                <tr>
                    <td>${item.product?.name ?? "-"}</td>
                    <td>${item.variantName ?? "-"}</td>
                    <td style="text-align:center">${item.systemStock}</td>
                    <td style="text-align:center">${item.physicalStock ?? "-"}</td>
                    <td style="text-align:center;color:${(item.difference || 0) < 0 ? "#dc2626" : (item.difference || 0) > 0 ? "#16a34a" : "inherit"}">${item.difference ?? "-"}</td>
                    <td>${item.adjustmentReason ?? "-"}</td>
                </tr>`,
            )
            .join("");

        const printContent = `<!DOCTYPE html>
<html>
<head>
    <title>Laporan Stock Opname - ${this.session.id}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        th { background: #f3f4f6; padding: 8px 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
        td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
        .summary { margin-top: 20px; padding: 12px 16px; background: #f9fafb; border-radius: 6px; font-size: 14px; }
        .summary p { margin: 4px 0; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <h1>Laporan Stock Opname</h1>
    <div class="meta">
        <p>Session: ${this.session.id} &nbsp;|&nbsp; Tanggal: ${sessionDate} &nbsp;|&nbsp; Status: ${this.session.status}</p>
        <p>Petugas: ${this.session.user?.name ?? "-"}</p>
        ${this.session.notes ? `<p>Catatan: ${this.session.notes}</p>` : ""}
    </div>

    <table>
        <thead>
            <tr>
                <th>Produk</th>
                <th>Varian</th>
                <th style="text-align:center">Stok Sistem</th>
                <th style="text-align:center">Stok Fisik</th>
                <th style="text-align:center">Selisih</th>
                <th>Alasan</th>
            </tr>
        </thead>
        <tbody>${itemRows}</tbody>
    </table>

    <div class="summary">
        <p><strong>Total Item:</strong> ${this.totalItemsCount}</p>
        <p><strong>Sudah Dihitung:</strong> ${this.countedItemsCount} / ${this.totalItemsCount}</p>
        <p><strong>Total Selisih:</strong> ${this.totalDifference}</p>
    </div>
</body>
</html>`;

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(printContent);
        iframe.contentDocument?.close();
        iframe.contentWindow?.print();

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }
}
