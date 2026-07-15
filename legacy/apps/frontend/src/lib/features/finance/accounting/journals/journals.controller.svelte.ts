import { JournalsService } from "./journals.service";

export class JournalsController {
    loading = $state(true);
    journals = $state<any[]>([]);
    selectedJournal = $state<any | null>(null);

    async init() {
        await this.fetchJournals();
    }

    async fetchJournals() {
        try {
            this.loading = true;
            this.journals = await JournalsService.getAll();
        } catch (e) {
            console.error("Failed to fetch journals", e);
        } finally {
            this.loading = false;
        }
    }

    async viewJournal(id: string) {
        if (this.selectedJournal?.id === id) {
            this.selectedJournal = null;
            return;
        }

        try {
            this.selectedJournal = await JournalsService.getById(id);
        } catch (e) {
            console.error("Failed to fetch journal details", e);
        }
    }
}
