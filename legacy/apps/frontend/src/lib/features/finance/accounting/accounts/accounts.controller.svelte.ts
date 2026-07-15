import { AccountsService } from "./accounts.service";
import {
    SettingsService,
    type AccountMappingSettings,
} from "$lib/features/settings/settings.service";

/**
 * Controller for the Chart of Accounts page
 * Manages state and business logic for account management
 */
export class AccountsController {
    // Data State
    loading = $state(true);
    accounts = $state<any[]>([]);
    accountTree = $state<any[]>([]);
    accountTypes = $state<any[]>([]);
    viewMode = $state<"flat" | "tree">("tree");
    searchQuery = $state("");
    expandedNodes = $state<Set<string>>(new Set());

    // Create Account State
    showCreateDialog = $state(false);
    creating = $state(false);
    createForm = $state({
        code: "",
        name: "",
        typeId: "",
        parentId: "",
        description: "",
    });

    // Guide State
    showGuide = $state(false);

    // Configuration State
    showConfigDialog = $state(false);
    mappingSettings = $state<AccountMappingSettings | null>(null);
    savingConfig = $state(false);

    // Transfer State
    showTransferDialog = $state(false);
    transferring = $state(false);
    transferForm = $state({
        fromAccountId: "",
        toAccountId: "",
        amount: 0,
        description: "Setoran Dana Cadangan",
    });

    /**
     * Initialize and fetch data
     */
    async init() {
        await this.fetchAccounts();
    }

    /**
     * Fetch accounts data from API
     */
    async fetchAccounts() {
        try {
            this.loading = true;
            const [flat, tree, types] = await Promise.all([
                AccountsService.getAll(),
                AccountsService.getTree(),
                AccountsService.getTypes(),
            ]);
            this.accounts = flat;
            this.accountTree = tree;
            this.accountTypes = types;

            // Expand first level by default
            for (const node of tree) {
                this.expandedNodes.add(node.id);
            }
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Handle fund transfer between accounts
     */
    async handleTransfer() {
        try {
            this.transferring = true;
            await AccountsService.transfer(this.transferForm);
            this.showTransferDialog = false;
            this.transferForm = {
                fromAccountId: "",
                toAccountId: "",
                amount: 0,
                description: "Setoran Dana Cadangan",
            };
            await this.fetchAccounts();
        } catch (e: any) {
            console.error("Failed to transfer funds", e);
            alert(e.response?.data?.error || "Gagal mentransfer dana");
        } finally {
            this.transferring = false;
        }
    }

    /**
     * Load account mappings configuration
     */
    async loadMappings() {
        try {
            this.mappingSettings = await SettingsService.getAccountMappings();
        } catch (e) {
            console.error("Failed to load mappings", e);
        }
    }

    /**
     * Save account mappings configuration
     */
    async saveMappings() {
        if (!this.mappingSettings) return;
        try {
            this.savingConfig = true;
            await SettingsService.setAccountMappings(this.mappingSettings);
            this.showConfigDialog = false;
            alert("Konfigurasi berhasil disimpan");
        } catch (e) {
            console.error("Failed to save mappings", e);
            alert("Gagal menyimpan konfigurasi");
        } finally {
            this.savingConfig = false;
        }
    }

    /**
     * Get mapping groups for configuration display
     */
    getMappingGroups(): Record<string, any[]> {
        if (!this.mappingSettings) return {};

        const groups: Record<string, any[]> = {
            "Kas & Bank": [],
            Pendapatan: [],
            "Beban & HPP": [],
            "Hutang/Piutang & Modal": [],
            "Aset Tetap": [],
        };

        for (const m of this.mappingSettings.mappings) {
            if (m.type === "default_cash") groups["Kas & Bank"].push(m);
            else if (["sales_revenue", "service_revenue"].includes(m.type))
                groups["Pendapatan"].push(m);
            else if (
                ["cogs_sales", "cogs_service", "depreciation_expense"].includes(
                    m.type
                )
            )
                groups["Beban & HPP"].push(m);
            else if (
                [
                    "accounts_payable",
                    "accounts_receivable",
                    "owner_equity",
                ].includes(m.type)
            )
                groups["Hutang/Piutang & Modal"].push(m);
            else groups["Aset Tetap"].push(m);
        }

        return groups;
    }

    /**
     * Create a new account
     */
    async handleCreateAccount() {
        try {
            this.creating = true;
            await AccountsService.create({
                ...this.createForm,
                parentId: this.createForm.parentId || undefined,
            });

            this.showCreateDialog = false;
            this.createForm = {
                code: "",
                name: "",
                typeId: "",
                parentId: "",
                description: "",
            };
            await this.fetchAccounts();
        } catch (e: any) {
            console.error("Failed to create account", e);
            alert(e.response?.data?.error || "Gagal membuat akun");
        } finally {
            this.creating = false;
        }
    }

    /**
     * Delete an account
     */
    async handleDeleteAccount(id: string) {
        const account = this.accounts.find((a) => a.id === id);
        if (!account) return;

        if (account.isSystem) {
            alert("Aset Sistem tidak dapat dihapus");
            return;
        }

        if (account.balance !== 0) {
            alert("Akun tidak dapat dihapus karena masih memiliki saldo. Silakan transfer saldo terlebih dahulu.");
            return;
        }

        if (!confirm(`Hapus akun ${account.name}? Tindakan ini tidak dapat dibatalkan.`))
            return;

        try {
            await AccountsService.delete(id);
            await this.fetchAccounts();
        } catch (e: any) {
            console.error("Failed to delete account", e);
            alert(e.response?.data?.error || "Gagal menghapus akun");
        }
    }

    /**
     * Toggle tree node expansion
     */
    toggleNode(id: string) {
        if (this.expandedNodes.has(id)) {
            this.expandedNodes.delete(id);
        } else {
            this.expandedNodes.add(id);
        }
        this.expandedNodes = new Set(this.expandedNodes);
    }

    // Derived values
    get filteredAccounts(): any[] {
        if (!this.searchQuery) return this.accounts;
        const q = this.searchQuery.toLowerCase();
        return this.accounts.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.code.toLowerCase().includes(q)
        );
    }

    // Helpers
    formatCurrency(val: number): string {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    }

    getTypeColor(typeId: string): string {
        switch (typeId) {
            case "ASSET":
                return "bg-blue-100 text-blue-700";
            case "LIABILITY":
                return "bg-red-100 text-red-700";
            case "EQUITY":
                return "bg-purple-100 text-purple-700";
            case "REVENUE":
                return "bg-green-100 text-green-700";
            case "EXPENSE":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }
}
