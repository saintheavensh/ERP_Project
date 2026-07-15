export interface Supplier {
    id: string;
    name: string;
    contact?: string | null;
    phone?: string | null;
    address?: string | null;
    image?: string | null;
    isActive?: boolean | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export type CreateSupplierData = Omit<Supplier, 'createdAt' | 'updatedAt'>;
export type UpdateSupplierData = Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>;
