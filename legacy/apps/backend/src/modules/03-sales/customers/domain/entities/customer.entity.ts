export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    points: number;
    debt: number;
    createdAt: Date;
    updatedAt?: Date | null;
}

export type CreateCustomerData = Omit<Customer, 'id' | 'points' | 'debt' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomerData = Partial<CreateCustomerData>;

export interface CustomerSale {
    id: string;
    totalAmount: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    createdAt: Date;
    payments?: any[]; // Simplified for domain
}
