import { RegisterService } from "./register.service";
import { AccountsService } from "../accounts/accounts.service";

export class RegisterController {
    loading = $state(true);
    submitting = $state(false);
    status = $state<any>(null);
    register = $state<any>(null);
    accounts = $state<any[]>([]);

    // Dialogs
    showOpenDialog = $state(false);
    showCloseDialog = $state(false);

    // Open Form
    initialCash = $state(0);
    notes = $state("");

    // Close Form
    actualClosing = $state(0);
    closingNotes = $state("");

    // Close & Reserve Form
    doReserve = $state(true);
    reserveAmount = $state(0);
    targetAccountId = $state("");

    async init() {
        await this.fetchData();
    }

    async fetchData() {
        try {
            this.loading = true;
            this.status = await RegisterService.getStatus();
            // If we have register data in status, use it
            if (this.status?.register) {
                this.register = this.status.register;
            }
        } catch (e) {
            console.error("Failed to fetch register status", e);
        } finally {
            this.loading = false;
        }
    }

    async fetchAccounts() {
        try {
            this.accounts = await AccountsService.getAll();
            // Pre-select reserve account logic logic if needed
            // For now, let UI handle or set default if found
            const pref = this.accounts.find((a) =>
                a.name.toLowerCase().includes("cadangan"),
            );
            if (pref) {
                this.targetAccountId = pref.id;
            }
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        }
    }

    async handleOpen() {
        try {
            this.submitting = true;
            await RegisterService.open({
                initialCash: this.initialCash,
                notes: this.notes,
            });
            this.showOpenDialog = false;
            await this.fetchData();
        } catch (e: any) {
            console.error("Failed to open register", e);
            throw e; // View can handle alert/toast
        } finally {
            this.submitting = false;
        }
    }

    async handleClose() {
        try {
            this.submitting = true;
            await RegisterService.close({
                actualClosing: this.actualClosing,
                notes: this.closingNotes,
                reserve: this.doReserve
                    ? {
                        amount: this.reserveAmount,
                        targetAccountId: this.targetAccountId,
                    }
                    : undefined,
            });
            this.showCloseDialog = false;
            await this.fetchData();
        } catch (e: any) {
            console.error("Failed to close register", e);
            throw e;
        } finally {
            this.submitting = false;
        }
    }

    // derived helpers could go here or be processed in template.
    // Ideally difference calc could be a getter
    get difference() {
        if (this.register?.status === "closed") {
            return (this.register.actualClosing || 0) - (this.register.expectedClosing || 0);
        }
        return 0;
    }
}
