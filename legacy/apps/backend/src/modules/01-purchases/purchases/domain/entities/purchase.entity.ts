export type PurchaseStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "VERIFIED" | "COMPLETED" | "CANCELLED";

export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}

export interface IPurchaseEvent {
    name: string;
    payload: any;
    timestamp: Date;
}

export interface PurchaseItemProps {
    id?: string | undefined;
    productId: string;
    variantId?: string | undefined;
    qtyOrdered: number;
    qtyReceived: number;
    buyPrice: number;
    sellPrice: number;
    batchId?: string | undefined;
}

export class PurchaseItem {
    private props: PurchaseItemProps;

    constructor(props: PurchaseItemProps) {
        this.validate(props);
        this.props = props;
    }

    private validate(props: PurchaseItemProps) {
        if (props.qtyReceived > props.qtyOrdered) {
            throw new DomainError(`Cannot receive more than ordered for product ${props.productId}. Ordered: ${props.qtyOrdered}, Received: ${props.qtyReceived}`);
        }
        if (props.qtyOrdered <= 0) {
            throw new DomainError(`Ordered quantity must be greater than 0 for product ${props.productId}`);
        }
    }

    get id() { return this.props.id; }
    get productId() { return this.props.productId; }
    get variantId() { return this.props.variantId; }
    get qtyOrdered() { return this.props.qtyOrdered; }
    get qtyReceived() { return this.props.qtyReceived; }
    get buyPrice() { return this.props.buyPrice; }
    get sellPrice() { return this.props.sellPrice; }
    get batchId() { return this.props.batchId; }

    updateReceivedQty(qty: number) {
        if (qty < 0) {
            throw new DomainError(`Received quantity cannot be negative for product ${this.props.productId}`);
        }
        if (qty > this.props.qtyOrdered) {
            throw new DomainError(`Cannot receive more than ordered for product ${this.props.productId}. Ordered: ${this.props.qtyOrdered}, Received: ${qty}`);
        }
        this.props.qtyReceived = qty;
    }

    updatePricing(buyPrice: number, sellPrice: number) {
        this.props.buyPrice = buyPrice;
        this.props.sellPrice = sellPrice;
    }

    updateBatchId(batchId: string) {
        this.props.batchId = batchId;
    }

    toSnapshot() {
        return { ...this.props };
    }
}

export interface PurchaseOrderProps {
    id: string;
    supplierId: string;
    userId?: string | undefined;
    totalAmount: number;
    status: PurchaseStatus;
    items: PurchaseItem[];
    date?: Date | undefined;
    referenceNumber?: string | undefined;
    notes?: string | undefined;
    receivedAt?: Date | undefined;
    receivedBy?: string | undefined;
    verifiedAt?: Date | undefined;
    verifiedBy?: string | undefined;
    cancelledAt?: Date | undefined;
    cancelledBy?: string | undefined;
    shippingFee?: number | undefined;
    discountAmount?: number | undefined;
    shippingExpenseAccountId?: string | undefined;
    paymentDueDate?: Date | undefined;
}

export class PurchaseOrder {
    private props: PurchaseOrderProps;
    private _events: IPurchaseEvent[] = [];

    constructor(props: PurchaseOrderProps) {
        this.props = props;
    }

    get id() { return this.props.id; }
    get status() { return this.props.status; }
    get items() { return this.props.items; }
    get supplierId() { return this.props.supplierId; }
    get totalAmount() { return this.props.totalAmount; }
    get userId() { return this.props.userId; }
    get referenceNumber() { return this.props.referenceNumber; }
    get notes() { return this.props.notes; }
    get shippingFee() { return this.props.shippingFee; }
    get discountAmount() { return this.props.discountAmount; }
    get paymentDueDate() { return this.props.paymentDueDate; }
    get shippingExpenseAccountId() { return this.props.shippingExpenseAccountId; }

    receiveItems(receivedItems: { productId: string, variantId?: string, qty: number }[], receivedBy: string) {
        if (this.props.status !== "ORDERED" && this.props.status !== "DRAFT") {
            throw new DomainError(`Cannot receive items in status ${this.props.status}`);
        }

        for (const received of receivedItems) {
            const item = this.props.items.find(i => i.productId === received.productId && i.variantId === received.variantId);
            if (!item) {
                throw new DomainError(`Product ${received.productId} not found in this purchase order`);
            }
            item.updateReceivedQty(received.qty);
        }

        this.props.status = "RECEIVED";
        this.props.receivedAt = new Date();
        this.props.receivedBy = receivedBy;
    }

    verify(
        verifiedBy: string,
        itemPricing: { productId: string, variantId?: string | undefined, buyPrice: number, sellPrice: number }[],
        options: { shippingFee?: number | undefined, discountAmount?: number | undefined, shippingExpenseAccountId?: string | undefined, referenceNumber?: string | undefined, paymentDueDate?: Date | undefined }
    ) {
        if (this.props.status !== "RECEIVED") {
            throw new DomainError("Must be in RECEIVED status to verify");
        }

        let totalGoodsAmount = 0;
        for (const pricing of itemPricing) {
            const item = this.props.items.find(i => i.productId === pricing.productId && i.variantId === pricing.variantId);
            if (item) {
                item.updatePricing(pricing.buyPrice, pricing.sellPrice);
                totalGoodsAmount += pricing.buyPrice * item.qtyReceived;
            }
        }

        this.props.shippingFee = options.shippingFee || 0;
        this.props.discountAmount = options.discountAmount || 0;
        this.props.shippingExpenseAccountId = options.shippingExpenseAccountId;
        this.props.referenceNumber = options.referenceNumber || this.props.referenceNumber;
        this.props.paymentDueDate = options.paymentDueDate;
        this.props.totalAmount = totalGoodsAmount + (this.props.shippingFee) - (this.props.discountAmount);

        this.props.status = "VERIFIED";
        this.props.verifiedAt = new Date();
        this.props.verifiedBy = verifiedBy;
    }

    complete() {
        if (this.props.status !== "VERIFIED") {
            throw new DomainError(`Cannot complete purchase from status ${this.props.status}. Must be VERIFIED first.`);
        }

        this.props.status = "COMPLETED";

        this.addEvent("PurchaseCompleted", {
            purchaseId: this.id,
            totalAmount: this.totalAmount,
            items: this.props.items.map(i => i.toSnapshot()),
            timestamp: new Date()
        });
    }

    cancel(userId: string, reason?: string) {
        if (this.props.status === "COMPLETED" || this.props.status === "VERIFIED") {
            throw new DomainError("Cannot cancel a completed or verified purchase order.");
        }
        this.props.status = "CANCELLED";
        this.props.cancelledAt = new Date();
        this.props.cancelledBy = userId;
        if (reason) {
            this.props.notes = this.props.notes ? `${this.props.notes}\nReason: ${reason}` : `Reason: ${reason}`;
        }
        this.addEvent("PurchaseCancelled", {
            purchaseId: this.id,
            timestamp: new Date()
        });
    }

    private addEvent(name: string, payload: any) {
        this._events.push({
            name,
            payload,
            timestamp: new Date()
        });
    }

    get events() {
        return [...this._events];
    }

    clearEvents() {
        this._events = [];
    }

    toSnapshot() {
        return {
            ...this.props,
            items: this.props.items.map(i => i.toSnapshot())
        };
    }
}
