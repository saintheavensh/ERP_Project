export interface Device {
    id: string;
    brand: string;
    model: string;
    series?: string | null;
    code?: string | null;
    image?: string | null;
    colors?: string[] | null;
    specs?: string | null;
    chipset?: string | null;
    specifications?: any;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export type CreateDeviceData = Omit<Device, 'createdAt' | 'updatedAt'>;
export type UpdateDeviceData = Partial<Omit<Device, 'id' | 'createdAt' | 'updatedAt'>>;
