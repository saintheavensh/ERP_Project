import { cart } from './state.svelte';

export const submitCheckout = async () => {
    if (cart.items.length === 0) throw new Error("Keranjang kosong!");
    if (cart.paymentMethod === 'TEMPO' && !cart.customerName) throw new Error("Nama Pelanggan wajib diisi untuk utang (Tempo)!");
    if (cart.paymentMethod === 'TUNAI' && cart.cashPaid < cart.total) throw new Error("Uang Tunai kurang dari total!");

    const payload = {
        items: cart.items,
        paymentMethod: cart.paymentMethod,
        paymentSubMethod: cart.paymentSubMethod,
        customerName: cart.customerName,
        cashPaid: cart.cashPaid
    };

    const res = await fetch('http://localhost:3000/api/transactions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.message || "Gagal melakukan transaksi");
    }

    // Transaksi selesai, bersihkan state
    cart.clear();
    return data;
};
