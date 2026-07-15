import { AssetsService } from "./assets.service";
import { AccountsService } from "../accounts/accounts.service";
import {
    SettingsService,
    type AccountMappingSettings,
    type AccountMappingType,
} from "$lib/features/settings/settings.service";

export class AssetsController {
    // State
    loading = $state(true);
    assets = $state<any[]>([]);
    accounts = $state<any[]>([]);
    showAddDialog = $state(false);
    showDeprDialog = $state(false);
    submitting = $state(false);
    processingDepr = $state(false);
    deprPeriod = $state(new Date().toISOString().slice(0, 7)); // YYYY-MM
    editingId = $state<string | null>(null);
    accountMappings = $state<AccountMappingSettings | null>(null);

    // Form State
    form = $state({
        name: "",
        category: "tool" as any,
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchaseCost: 0,
        salvageValue: 0,
        usefulLifeMonths: 24,
        notes: "",
        sourceAccountId: "1-1001",
        accountId: "1-4001",
    });

    splitProperty = $state(false);
    landPortion = $state(0);
    depreciationMode = $state<"auto" | "manual">("auto");
    manualMonthlyDepr = $state(0);

    // Initialization
    async init() {
        await Promise.all([
            this.fetchAssets(),
            this.fetchAccounts(),
            this.fetchAccountMappings(),
        ]);
    }

    async fetchAssets() {
        try {
            this.loading = true;
            this.assets = await AssetsService.getAll();
        } catch (e) {
            console.error("Failed to fetch assets", e);
        } finally {
            this.loading = false;
        }
    }

    async fetchAccounts() {
        try {
            this.accounts = await AccountsService.getAll();
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        }
    }

    async fetchAccountMappings() {
        try {
            this.accountMappings = await SettingsService.getAccountMappings();
            this.applyDefaultMappings();
        } catch (e) {
            console.error("Failed to fetch account mappings", e);
        }
    }

    private applyDefaultMappings() {
        if (!this.accountMappings) return;
        const cashMapping = this.accountMappings.mappings.find(
            (m) => m.type === "default_cash"
        );
        if (cashMapping) {
            this.form.sourceAccountId = cashMapping.accountId;
        }
        const toolMapping = this.accountMappings.mappings.find(
            (m) => m.type === "asset_tool"
        );
        if (toolMapping) {
            this.form.accountId = toolMapping.accountId;
        }
    }

    // Logic
    handleCategoryChange() {
        if (!this.accounts.length || !this.accountMappings) return;

        const categoryToMappingType: Record<string, AccountMappingType> = {
            tool: "asset_tool",
            equipment: "asset_equipment",
            furniture: "asset_furniture",
            vehicle: "asset_vehicle",
            building: "asset_building",
            land: "asset_land",
            other: "asset_other",
        };

        const mappingType = categoryToMappingType[this.form.category];
        if (mappingType) {
            const mapping = this.accountMappings.mappings.find(
                (m) => m.type === mappingType
            );
            if (mapping) {
                const found = this.accounts.find((a) => a.id === mapping.accountId);
                if (found) this.form.accountId = found.id;
            }
        }

        // Apply default cash source if exists
        const cashMapping = this.accountMappings.mappings.find(
            (m) => m.type === "default_cash"
        );
        if (cashMapping) {
            const cashAccount = this.accounts.find(
                (a) => a.id === cashMapping.accountId
            );
            if (cashAccount) this.form.sourceAccountId = cashAccount.id;
        }

        // Property reset logic
        if (this.form.category === "property") {
            this.splitProperty = true;
            const buildingMapping = this.accountMappings.mappings.find(
                (m) => m.type === "asset_building"
            );
            if (buildingMapping) {
                const building = this.accounts.find((a) => a.id === buildingMapping.accountId);
                if (building) this.form.accountId = building.id;
            }
        } else {
            this.splitProperty = false;
            this.landPortion = 0;
        }
    }

    handleManualDeprChange() {
        if (this.depreciationMode === "manual" && this.manualMonthlyDepr > 0) {
            const depreciableAmount = this.form.purchaseCost - this.form.salvageValue;
            if (depreciableAmount > 0) {
                const months = depreciableAmount / this.manualMonthlyDepr;
                this.form.usefulLifeMonths = Math.max(1, Math.ceil(months));
            }
        }
    }

    async handleSubmit() {
        try {
            this.submitting = true;
            if (this.editingId) {
                await AssetsService.update(this.editingId, {
                    ...this.form,
                    purchaseDate: new Date(this.form.purchaseDate),
                });
            } else {
                if (
                    this.form.category === "building" &&
                    this.splitProperty &&
                    this.landPortion > 0
                ) {
                    const buildingCost = this.form.purchaseCost - this.landPortion;

                    // 1. Create Building
                    await AssetsService.create({
                        ...this.form,
                        name: `${this.form.name} (Bangunan)`,
                        purchaseCost: buildingCost,
                        purchaseDate: new Date(this.form.purchaseDate),
                    });

                    // 2. Create Land
                    const landMapping = this.accountMappings?.mappings.find(
                        (m) => m.type === "asset_land"
                    );
                    await AssetsService.create({
                        ...this.form,
                        name: `${this.form.name} (Tanah)`,
                        category: "land",
                        purchaseCost: this.landPortion,
                        salvageValue: 0,
                        usefulLifeMonths: 0,
                        purchaseDate: new Date(this.form.purchaseDate),
                        accountId:
                            landMapping?.accountId ??
                            this.accounts.find((a) => a.id.includes("1-4005"))?.id,
                    });
                } else {
                    await AssetsService.create({
                        ...this.form,
                        purchaseDate: new Date(this.form.purchaseDate),
                    });
                }
            }
            this.closeDialog();
            await this.fetchAssets();
        } catch (e: any) {
            console.error("Failed to save asset", e);
            throw e; // Let UI handle alert/toast or handle here?
            // Controller usually shouldn't show UI directly (alert/confirm) but throwing allows UI to capture.
            // Or better, expose error state.
        } finally {
            this.submitting = false;
        }
    }

    async handleProcessDepreciation() {
        try {
            this.processingDepr = true;
            const res = await AssetsService.processDepreciation(this.deprPeriod);
            this.showDeprDialog = false;
            await this.fetchAssets();
            return res;
        } catch (e: any) {
            console.error("Failed to process depreciation", e);
            throw e;
        } finally {
            this.processingDepr = false;
        }
    }

    async deleteAsset(id: string) {
        try {
            this.loading = true;
            await AssetsService.delete(id);
            await this.fetchAssets();
        } catch (e) {
            console.error("Failed to delete asset", e);
            throw e;
        } finally {
            this.loading = false;
        }
    }

    openAddDialog() {
        this.editingId = null;
        this.resetForm();
        this.showAddDialog = true;
    }

    closeDialog() {
        this.showAddDialog = false;
        this.editingId = null;
        this.resetForm();
    }

    private resetForm() {
        this.form = {
            name: "",
            category: "tool" as any,
            purchaseDate: new Date().toISOString().slice(0, 10),
            purchaseCost: 0,
            salvageValue: 0,
            usefulLifeMonths: 24,
            notes: "",
            sourceAccountId: "1-1001",
            accountId: "1-4001",
        };
        this.splitProperty = false;
        this.landPortion = 0;
        this.applyDefaultMappings();
    }

    // Derived Getters
    get monthlyDepr() {
        if (this.form.usefulLifeMonths <= 0) return 0;
        const actualCost =
            this.form.category === "building" && this.splitProperty
                ? this.form.purchaseCost - this.landPortion
                : this.form.purchaseCost;

        return Math.floor(
            (actualCost - this.form.salvageValue) / this.form.usefulLifeMonths
        );
    }

    get costPerHour() {
        return Math.ceil(this.monthlyDepr / 160);
    }

    get allAssetAccounts() {
        return this.accounts.filter((a) => a.typeId === "ASSET");
    }

    get sourceAccounts() {
        const cashBank = this.accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.name.toLowerCase().includes("kas") ||
                    a.name.toLowerCase().includes("bank"))
        );
        const liability = this.accounts.filter((a) => a.typeId === "LIABILITY");
        return [...cashBank, ...liability];
    }
}
