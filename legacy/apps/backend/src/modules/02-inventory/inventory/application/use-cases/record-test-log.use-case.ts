import { IGamblingRepository, DeadPhoneStatus } from "@domain/repositories/gambling-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export interface RecordTestLogInput {
    deadPhoneId: string;
    technicianId: string;
    testResults: any;
    verdict: 'REPAIRABLE' | 'KANIBAL' | 'DEAD';
    notes?: string;
}

export class RecordTestLogUseCase {
    constructor(private readonly repository: IGamblingRepository) { }

    async execute(input: RecordTestLogInput, tx: TransactionContext, tenantId?: string) {
        // 1. Save Test Log (Repository needs a saveTestLog method)
        // I will add this method to the repository adapter

        // 2. Update Dead Phone Status based on verdict
        let newStatus: DeadPhoneStatus = 'TESTED';
        if (input.verdict === 'KANIBAL') {
            // Might stay TESTED until actually harvested
        }

        await this.repository.updateStatus(input.deadPhoneId, newStatus, tx);

        // Internal logic to save the log
        return await (this.repository as any).saveTestLog({
            deadPhoneId: input.deadPhoneId,
            technicianId: input.technicianId,
            testResults: input.testResults,
            verdict: input.verdict,
            notes: input.notes,
            testDate: new Date()
        }, tx);
    }
}
