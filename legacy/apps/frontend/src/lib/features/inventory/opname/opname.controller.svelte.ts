import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { OpnameService } from "./opname.service";
import { CategoriesService } from "../categories/categories.service";
import type { Category } from "@repo/shared";

interface OpnameSession {
    id: string;
    createdAt: string;
    completedAt?: string;
    status: string;
    notes?: string;
    user?: { name: string };
}

/**
 * Controller for the Stock Opname page
 * Manages state and business logic for opname sessions
 */
export class OpnameController {
    // State
    sessions = $state<OpnameSession[]>([]);
    categories = $state<Category[]>([]);
    isLoading = $state(true);
    isCreateDialogOpen = $state(false);

    // Form State
    newSessionNote = $state("");
    selectedCategoryId = $state("");

    /**
     * Initialize the controller by loading sessions and categories
     */
    async init(): Promise<void> {
        await Promise.all([this.fetchSessions(), this.fetchCategories()]);
    }

    /**
     * Fetch all opname sessions
     */
    async fetchSessions(): Promise<void> {
        this.isLoading = true;
        try {
            this.sessions = await OpnameService.getOpnameSessions();
        } catch (error) {
            toast.error("Failed to fetch sessions");
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Fetch all categories for filtering
     */
    async fetchCategories(): Promise<void> {
        try {
            this.categories = await CategoriesService.getAll();
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    /**
     * Open the create session dialog
     */
    openCreateDialog(): void {
        this.resetForm();
        this.isCreateDialogOpen = true;
    }

    /**
     * Close the create session dialog
     */
    closeDialog(): void {
        this.isCreateDialogOpen = false;
        this.resetForm();
    }

    /**
     * Reset form to initial state
     */
    resetForm(): void {
        this.newSessionNote = "";
        this.selectedCategoryId = "";
    }

    /**
     * Create a new opname session
     */
    async handleCreateSession(): Promise<void> {
        try {
            const result = await OpnameService.createOpnameSession({
                notes: this.newSessionNote,
                categoryId: this.selectedCategoryId || undefined,
            });
            toast.success("Stock opname session created");
            this.isCreateDialogOpen = false;
            goto(`/inventory/opname/${result.id}`);
        } catch (error) {
            toast.error("Failed to create session");
        }
    }

    /**
     * Navigate to session detail
     */
    navigateToSession(sessionId: string): void {
        goto(`/inventory/opname/${sessionId}`);
    }

    /**
     * Get the display category name for the selected category
     */
    getSelectedCategoryName(): string {
        const category = this.categories.find(
            (c) => c.id === this.selectedCategoryId
        );
        return category?.name || "Semua Kategori";
    }

    /**
     * Get badge variant based on session status
     */
    getStatusVariant(
        status: string
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (status) {
            case "completed":
                return "default";
            case "draft":
                return "secondary";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    }
}
