import { writable, derived } from 'svelte/store';

function createCart() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,
        addItem: (name, price, qty) => update(items => {
            const numPrice = Number(price);
            const numQty = Number(qty);
            const existingItemIndex = items.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
            
            if (existingItemIndex !== -1) {
                const newItems = [...items];
                // Pastikan qty lama dikonversi ke angka sebelum dijumlahkan
                newItems[existingItemIndex].qty = Number(newItems[existingItemIndex].qty) + numQty;
                return newItems;
            }
            return [...items, { name, price: numPrice, qty: numQty }];
        }),
        removeItem: (index) => update(items => items.filter((_, i) => i !== index)),
        clear: () => set([]),
        set: set
    };
}

export const cartItems = createCart();

export const subtotal = derived(cartItems, $items => 
    $items.reduce((acc, item) => acc + (Number(item.price) * Number(item.qty)), 0)
);

export const total = subtotal;

export const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
};

export const parseFormattedNumber = (str) => {
    return parseInt(String(str).replace(/\D/g, ''), 10) || 0;
};
