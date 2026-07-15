// Svelte 5 Runes untuk State Management Keranjang

export interface CartItem {
	id?: string; // ID Produk dari Master Data
	name: string;
	price: number;
	qty: number;
}

export class CartState {
	items = $state<CartItem[]>([]);
	paymentMethod = $state<'TUNAI' | 'TEMPO'>('TUNAI');
	paymentSubMethod = $state<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
	customerName = $state<string>('');
	cashPaid = $state<number>(0);

	// Derived state (berubah otomatis saat reaktif $state berubah)
	totalQty = $derived(this.items.reduce((sum, item) => sum + item.qty, 0));
	subtotal = $derived(this.items.reduce((sum, item) => sum + item.price * item.qty, 0));
	total = $derived(this.subtotal);
	
	// Khusus tunai
	changeAmount = $derived(Math.max(this.cashPaid - this.total, 0));
	
	// Khusus tempo
	amountDue = $derived(Math.max(this.total - this.cashPaid, 0));

	addItem(name: string, price: number, qty: number, productId?: string) {
		const existingItem = this.items.find(
			(item) => 
				item.name.toLowerCase() === name.toLowerCase() && 
				item.id === productId
		);
		if (existingItem) {
			existingItem.qty += qty;
		} else {
			this.items.push({ id: productId, name, price, qty });
		}
	}

	removeItem(index: number) {
		this.items.splice(index, 1);
	}

	clear() {
		this.items = [];
		this.cashPaid = 0;
		this.customerName = '';
		this.paymentMethod = 'TUNAI';
	}
}

// Singleton state instance untuk kasir
export const cart = new CartState();
