export interface Brand {
    id: string;
    tenantId: string;
    name: string;
    logo?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
}

export type CreateBrandData = Omit<Brand, 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type UpdateBrandData = Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
