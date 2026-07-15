import { IKanibalRepository, ForfeitedDevice } from "@domain/repositories/kanibal-repository.port";
import { TransactionContext } from "@shared/types/db-context";

export interface ForfeitServiceDeviceInput {
    serviceId: string;
    deviceName?: string;
    notes?: string;
}

export class ForfeitServiceDeviceUseCase {
    constructor(private readonly repository: IKanibalRepository) { }

    async execute(input: ForfeitServiceDeviceInput, tx: TransactionContext, tenantId?: string): Promise<ForfeitedDevice> {
        return await this.repository.saveForfeitedDevice({
            serviceId: input.serviceId,
            deviceName: input.deviceName,
            notes: input.notes,
            forfeitedDate: new Date(),
            status: 'UTUH'
        }, tx);
    }
}
