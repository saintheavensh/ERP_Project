import { OperationalCostsService, type OperationalCost } from "./operational-costs.service";

export class OperationalCostsController {
    loading = $state(true);
    items = $state<OperationalCost[]>([]);
    submitting = $state(false);

    // Dialog state
    showAddDialog = $state(false);

    // Form state
    amount = $state(0);
    category = $state("");
    date = $state(new Date().toISOString().split("T")[0]);
    description = $state("");

    async init() {
        await this.fetchItems();
    }

    async fetchItems() {
        try {
            this.loading = true;
            this.items = await OperationalCostsService.getAll();
        } catch (e) {
            console.error("Failed to fetch operational costs", e);
        } finally {
            this.loading = false;
        }
    }

    resetForm() {
        this.amount = 0;
        this.category = "";
        this.date = new Date().toISOString().split("T")[0];
        this.description = "";
    }

    openAddDialog() {
        this.resetForm();
        this.showAddDialog = true;
    }

    async handleSubmit() {
        try {
            this.submitting = true;
            await OperationalCostsService.create({
                amount: this.amount,
                category: this.category,
                date: this.date,
                description: this.description
            });
            this.showAddDialog = false;
            await this.fetchItems();
        } catch (e: any) {
            console.error("Failed to add operational cost", e);
            throw e;
        } finally {
            this.submitting = false;
        }
    }

    async handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            this.loading = true;
            await OperationalCostsService.delete(id);
            await this.fetchItems();
        } catch (e) {
            console.error("Failed to delete item", e);
        } finally {
            this.loading = false;
        }
    }
}
