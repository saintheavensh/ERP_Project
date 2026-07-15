import { TransactionContext } from "../../../../../shared/types/db-context";

export type ForfeitedDeviceStatus = 'UTUH' | 'HARVESTED';

export interface ForfeitedDevice {
    id: string;
    serviceId?: string;
    deviceName?: string;
    forfeitedDate: Date;
    status: ForfeitedDeviceStatus;
    notes?: string;
}

export interface PartHarvestLog {
    id: string;
    forfeitedDeviceId?: string;
    deadPhoneId?: string;
    partType: string;
    partCondition?: string;
    targetServiceId?: string;
    technicianId?: string;
    harvestDate: Date;
    newBatchId?: string;
    notes?: string;
}

export interface KanibalFilters {
    status?: ForfeitedDeviceStatus;
    search?: string;
}

export interface IKanibalRepository {
    saveForfeitedDevice(device: Partial<ForfeitedDevice>, tx: TransactionContext): Promise<ForfeitedDevice>;
    saveHarvestLog(log: Partial<PartHarvestLog>, tx: TransactionContext): Promise<PartHarvestLog>;
    findForfeitedDevices(tx: TransactionContext, filters?: KanibalFilters): Promise<ForfeitedDevice[]>;
    findForfeitedDeviceById(id: string, tx: TransactionContext): Promise<ForfeitedDevice | null>;
    updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus, tx: TransactionContext): Promise<void>;
}
