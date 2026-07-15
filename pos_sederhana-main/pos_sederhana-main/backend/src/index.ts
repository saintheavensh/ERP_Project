import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db.js';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Transaction, Device, Invite, CartItem, DebtPayment } from './types.js';
import type { Context } from 'hono';

const app = new Hono();

// Enable CORS for frontend access
app.use('/*', cors());

// Helper untuk ambil IP (Support Proxy & Local)
const getClientIP = (c: Context) => {
    const info = getConnInfo(c);
    const forwarded = c.req.header('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return info.remote.address || '0.0.0.0';
};

// 1. Get History (with Search)
app.get('/api/history', (c) => {
  try {
    const q = c.req.query('q') || '';
    const query = `
      SELECT t.*, d.name as cashier_db_name, d.is_blocked as device_blocked
      FROM transactions t
      LEFT JOIN devices d ON t.device_info = d.device_id
      WHERE t.receipt_no LIKE ? OR t.customer_name LIKE ? 
      ORDER BY t.created_at DESC
    `;
    const rows = db.prepare(query).all(`%${q}%`, `%${q}%`) as Transaction[];
    return c.json({ success: true, data: rows });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ success: false, message: errorMessage }, 500);
  }
});

// 2. Save Transaction (with Active Check)
app.post('/api/transactions', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      receipt_no, customer_name, total, cash_paid, 
      change_amount, amount_due, payment_method, status, 
      items_json, device_id 
    } = body;

    // A. Check Status (Must Active & Not Blocked)
    const device = db.prepare('SELECT name, is_blocked, is_active FROM devices WHERE device_id = ?').get(device_id) as Device | undefined;
    
    // Khusus ADMIN-PC, kita izinkan masuk meskipun tidak ditemukan di DB (Fallback aman)
    if (device_id !== 'ADMIN-PC') {
        if (!device || device.is_active === 0) {
            return c.json({ success: false, message: 'BUTUH KALIBRASI: Perangkat belum terdaftar.' }, 401);
        }
        
        if (device.is_blocked === 1) {
            return c.json({ success: false, message: 'AKSES DIBLOKIR: Hubungi Admin.' }, 403);
        }
    }

    const cashier_name = device?.name || 'NEW MAJMU Service';

    const stmt = db.prepare(`
      INSERT INTO transactions (
        receipt_no, customer_name, cashier_name, total, cash_paid, 
        change_amount, amount_due, payment_method, status, 
        items_json, device_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      receipt_no, customer_name, cashier_name, total, cash_paid, 
      change_amount, amount_due, payment_method, status, 
      JSON.stringify(items_json), device_id
    );

    return c.json({ success: true, id: result.lastInsertRowid });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ success: false, message: errorMessage }, 500);
  }
});

// 2b. Delete Transaction
app.delete('/api/transactions/:id', async (c) => {
    try {
        const id = c.req.param('id');
        db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        // Hapus juga riwayat pembayaran hutang terkait jika ada
        db.prepare('DELETE FROM debt_payments WHERE transaction_id = ?').run(id);
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// 3. Device Management
app.get('/api/devices', (c) => {
    try {
        const rows = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all() as Device[];
        return c.json({ success: true, data: rows });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Admin buat Undangan (Invite)
app.post('/api/devices/invite', async (c) => {
    try {
        const { name } = await c.req.json();
        const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
        
        db.prepare('INSERT INTO invites (pairing_token, name) VALUES (?, ?)')
          .run(token, name);
          
        return c.json({ success: true, token, name });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Cek Detail Undangan (Pre-pairing check)
app.get('/api/devices/invite/:token', (c) => {
    try {
        const token = c.req.param('token');
        const invite = db.prepare('SELECT name FROM invites WHERE pairing_token = ?').get(token) as Invite | undefined;
        if (!invite) return c.json({ success: false, message: 'Kode tidak valid atau kadaluarsa.' }, 404);
        return c.json({ success: true, name: invite.name });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// HP melakukan "Ketuk Pintu" (Claim)
app.post('/api/devices/claim', async (c) => {
    try {
        const { device_id, token, metadata } = await c.req.json();
        const ip = getClientIP(c);

        // Update tabel invites dengan data HP yang mencoba masuk
        const result = db.prepare(`
            UPDATE invites 
            SET claiming_device_id = ?, claiming_metadata = ?, claiming_ip = ? 
            WHERE pairing_token = ?
        `).run(device_id, metadata, ip, token);

        if (result.changes === 0) {
            return c.json({ success: false, message: 'Kode tidak valid atau sudah kadaluarsa.' }, 401);
        }

        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Admin menyetujui Pendaftaran (Approve)
app.post('/api/devices/approve', async (c) => {
    try {
        const { token } = await c.req.json();

        // 1. Ambil data dari antrean (invites)
        const invite = db.prepare('SELECT * FROM invites WHERE pairing_token = ?').get(token) as Invite | undefined;
        if (!invite || !invite.claiming_device_id) {
            return c.json({ success: false, message: 'Permintaan tidak ditemukan.' }, 404);
        }

        // 2. Pindahkan ke tabel devices asli
        db.prepare(`
            REPLACE INTO devices (device_id, name, metadata, last_ip, is_active, is_blocked) 
            VALUES (?, ?, ?, ?, 1, 0)
        `).run(invite.claiming_device_id, invite.name, invite.claiming_metadata, invite.claiming_ip);

        // 3. Hapus undangan
        db.prepare('DELETE FROM invites WHERE pairing_token = ?').run(token);

        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Admin menolak Pendaftaran (Deny)
app.post('/api/devices/deny', async (c) => {
    try {
        const { token } = await c.req.json();
        db.prepare('UPDATE invites SET claiming_device_id = NULL, claiming_metadata = NULL, claiming_ip = NULL WHERE pairing_token = ?').run(token);
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Admin cek antrean pendaftaran (Polling)
app.get('/api/devices/invites', (c) => {
    try {
        const pending = db.prepare('SELECT * FROM invites WHERE claiming_device_id IS NOT NULL').all() as Invite[];
        return c.json({ success: true, data: pending });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

app.post('/api/devices/ping', async (c) => {
    try {
        const { device_id, metadata } = await c.req.json();
        const ip = getClientIP(c);
        
        const device = db.prepare('SELECT is_blocked, is_active FROM devices WHERE device_id = ?').get(device_id) as Device | undefined;
        
        // Khusus ADMIN-PC, kita izinkan ping meskipun data record belum sempurna
        if (device_id !== 'ADMIN-PC') {
            if (!device || device.is_active === 0) {
                return c.json({ success: false, needs_pairing: true, message: 'Butuh Kalibrasi.' }, 401);
            }

            if (device.is_blocked === 1) {
                return c.json({ success: false, is_blocked: true, message: 'Akses diblokir.' }, 403);
            }
        }

        db.prepare('UPDATE devices SET last_ip = ?, metadata = ? WHERE device_id = ?').run(
            ip, metadata, device_id
        );
        
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

app.put('/api/devices/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const { name } = await c.req.json();
        db.prepare('UPDATE devices SET name = ? WHERE device_id = ?').run(name, id);
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Toggle Block
app.put('/api/devices/:id/block', async (c) => {
    try {
        const id = c.req.param('id');
        const { is_blocked } = await c.req.json();
        db.prepare('UPDATE devices SET is_blocked = ? WHERE device_id = ?').run(is_blocked ? 1 : 0, id);
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// Delete Device
app.delete('/api/devices/:id', async (c) => {
    try {
        const id = c.req.param('id');
        db.prepare('DELETE FROM devices WHERE device_id = ?').run(id);
        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

// 4. Pay Debt (Cicilan Tempo)
app.post('/api/transactions/pay-debt', async (c) => {
    try {
        const { transaction_id, amount } = await c.req.json();
        
        // 1. Simpan cicilan
        db.prepare('INSERT INTO debt_payments (transaction_id, amount) VALUES (?, ?)').run(transaction_id, amount);
        
        // 2. Update status & sisa hutang
        const trx = db.prepare('SELECT total, amount_due, cash_paid FROM transactions WHERE id = ?').get(transaction_id) as Transaction | undefined;
        if (trx) {
            const newAmountDue = Math.max(trx.amount_due - amount, 0);
            const newCashPaid = trx.cash_paid + amount;
            const newStatus = newAmountDue <= 0 ? 'LUNAS' : 'BELUM_LUNAS';

            db.prepare('UPDATE transactions SET amount_due = ?, cash_paid = ?, status = ? WHERE id = ?')
                .run(newAmountDue, newCashPaid, newStatus, transaction_id);
        }

        return c.json({ success: true });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

import { networkInterfaces } from 'os';

// Helper untuk ambil IP Lokal Laptop (untuk QR Code)
function getLocalIP() {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Pilih IPv4 dan bukan internal (127.0.0.1)
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

app.get('/api/server-info', (c) => {
    return c.json({ 
        success: true, 
        local_ip: getLocalIP(),
        port: 3000,
        frontend_port: 5173
    });
});

const port = 3000;
console.log(`🚀 POS Database Server running on http://localhost:${port}`);
console.log(`🌐 Network Access: http://${getLocalIP()}:${port}`);

serve({
  fetch: app.fetch,
  port
});
