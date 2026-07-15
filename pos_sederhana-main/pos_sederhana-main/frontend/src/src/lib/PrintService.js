export const SHOP_CONFIG = {
    name: 'NEW MAJMU Service',
    address: 'Jl. Anyar Kp Bojong Kukun Rt01/Rw09\nMajalaya - Bandung',
    phone: '0813-9511-0110',
    cashier: 'Majmu Service',
    footerMessage: 'TERIMA KASIH ATAS KUNJUNGAN ANDA',
    footerSubMessage: 'Barang yang sudah dibeli tidak dapat ditukarkan kembali'
};

export const PrintService = {
    buildReceiptData: (shopConfig, items, cash, change) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

        return {
            shop: {
                name: shopConfig.name,
                address: shopConfig.address,
                phone: shopConfig.phone,
                cashier: shopConfig.cashier,
                footerMessage: shopConfig.footerMessage,
                footerSubMessage: shopConfig.footerSubMessage,
            },
            items: items.map(i => ({
                name: i.name,
                qty: i.qty,
                price: i.price,
                total: i.price * i.qty
            })),
            payment: {
                subtotal: subtotal,
                total: subtotal,
                cash: cash,
                change: change
            },
            datetime: {
                date: dateStr,
                time: timeStr
            }
        };
    },

    sendToPrintServer: async (receiptData) => {
        try {
            // Kita ambil origin secara dinamis sehingga akses HP (LAN IP) juga tetap mendeteksi port 8080 miliknya.
            let origin = window.location.origin;
            if (!origin || origin === 'null' || origin.includes('file://')) {
                origin = 'http://localhost:8080';
            }
            if (!origin.includes(':8080')) {
                origin = `${window.location.protocol}//${window.location.hostname}:8080`;
            }
            const url = `${origin}/api/print`;
            
            // Abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            let res;
            try {
                res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptData),
                    signal: controller.signal
                });
            } catch (networkErr) {
                clearTimeout(timeoutId);
                console.error("Fetch API error:", networkErr);
                return { success: false, message: `Koneksi ke POS Print Server terputus. Pastikan print server (server.py) berjalan di localhost:8080.` };
            }
            
            clearTimeout(timeoutId);
            const responseText = await res.text();
            
            if (!res.ok) {
                return { success: false, message: `Server error (${res.status}): ${responseText}` };
            }

            try {
                const responseData = JSON.parse(responseText);
                return responseData; 
            } catch (jsonErr) {
                return { success: true, message: 'Print berhasil (respons non-JSON dari server)' };
            }
        } catch (err) {
            console.error('Print Request Error:', err);
            return { success: false, message: err.message || 'Unknown network error' };
        }
    }
};
