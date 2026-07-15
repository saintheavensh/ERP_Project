import { config } from './config.js';

export const SHOP_CONFIG = {
    name: 'NEW MAJMU Service',
    address: 'Jl. Anyar Kp Bojong Kukun Rt01/Rw09\nMajalaya - Bandung',
    phone: '0813-9511-0110',
    cashier: 'Majmu Service',
    footerMessage: 'TERIMA KASIH ATAS KUNJUNGAN ANDA',
    footerSubMessage: 'Barang yang sudah dibeli tidak dapat ditukarkan kembali'
};

export const PrintService = {
    buildReceiptData: (shopConfig, items, cash, change, options = {}) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const timestamp = now.toISOString();
        
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        const deviceId = options.deviceId || localStorage.getItem('pos_device_id') || 'UNKNOWN';
        const customerName = options.customerName || '-';
        const paymentMethod = options.paymentMethod || 'TUNAI';
        
        const amount_due = paymentMethod === 'TEMPO' ? Math.max(subtotal - cash, 0) : 0;
        const status = (paymentMethod === 'TEMPO' && amount_due > 0) ? 'BELUM_LUNAS' : 'LUNAS';

        return {
            receipt_no: `POS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
            customer_name: customerName,
            device_id: deviceId,
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
                change: change,
                amountDue: amount_due,
                paymentMethod: paymentMethod,
                paymentSubMethod: options.paymentSubMethod || 'TUNAI',
                status: status
            },
            shop: {
                name: shopConfig.name,
                address: shopConfig.address,
                phone: shopConfig.phone,
                cashier: 'Kasir Utama', // Akan ditimpa oleh server.py berdasarkan device_id
                footerMessage: shopConfig.footerMessage,
                footerSubMessage: shopConfig.footerSubMessage,
                customerName: customerName // Tambahan untuk print engine
            },
            datetime: {
                date: dateStr,
                time: timeStr,
                iso: timestamp
            }
        };
    },

    sendToPrintServer: async (receiptData) => {
        try {
            const url = `${config.printBase}/api/print`;
            
            // Abort controller for timeout (sekarang 5 detik sesuai rekomendasi)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

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
                if (networkErr.name === 'AbortError') {
                    return { success: false, message: `Timeout 5 Detik: Printer tidak merespons. Pastikan printer nyala dan kabel terhubung.` };
                }
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
