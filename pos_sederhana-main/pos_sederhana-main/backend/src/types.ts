export interface CartItem {
    name: string;
    price: number;
    qty: number;
    quantity?: number; // compat with old data
}

export interface Transaction {
    id: number;
    receipt_no: string;
    customer_name: string;
    cashier_name: string;
    total: number;
    cash_paid: number;
    change_amount: number;
    amount_due: number;
    payment_method: string;
    status: 'LUNAS' | 'BELUM_LUNAS';
    items_json: string;
    device_info: string;
    created_at: string;
    // Join fields
    cashier_db_name?: string;
    device_blocked?: number;
}

export interface Device {
    device_id: string;
    name: string;
    metadata: string;
    last_ip: string | null;
    is_active: number;
    is_blocked: number;
    created_at: string;
    pairing_token: string | null;
}

export interface Invite {
    pairing_token: string;
    name: string;
    claiming_device_id: string | null;
    claiming_metadata: string | null;
    claiming_ip: string | null;
    created_at: string;
}

export interface DebtPayment {
    id: number;
    transaction_id: number;
    amount: number;
    payment_date: string;
}
