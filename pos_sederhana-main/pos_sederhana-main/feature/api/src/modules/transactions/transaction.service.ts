import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { transactions, transactionItems, transactionItemBatches, type NewTransaction, type NewTransactionItem, type NewTransactionItemBatch } from './schema.js';
import { products, batches, stockMovements } from '../products/schema.js';
import crypto from 'crypto';
import { getShopConfig } from '../../config/shop.js';

/**
 * URL server V1 (Python) yang sudah berjalan dan menangani pencetakan.
 * V2 tidak menjalankan Python sendiri — ia mendelegasikan cetak ke V1
 * melalui endpoint /api/print yang sudah terbukti stabil.
 */
const V1_PRINT_URL = 'http://localhost:8080/api/print';

interface CartItem {
  id?: string; // ID dari Master Data Produk (Opsional untuk fallback manual)
  name: string;
  price: number;
  qty: number;
}

export interface CheckoutPayload {
  items: CartItem[];
  customerName?: string;
  paymentMethod: 'TUNAI' | 'TEMPO';
  paymentSubMethod?: 'CASH' | 'QRIS' | 'TRANSFER' | 'TUNAI';
  cashPaid: number;
}

export class TransactionService {
  static async getHistory() {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt)).all();
  }

  static async getReport() {
    const all = await db.select().from(transactions).all();
    
    const summary = all.reduce((acc, tx) => {
      acc.totalRevenue += tx.total;
      acc.totalCogs += tx.cogs;
      acc.totalProfit += tx.grossProfit;
      acc.transactionCount += 1;
      return acc;
    }, {
      totalRevenue: 0,
      totalCogs: 0,
      totalProfit: 0,
      transactionCount: 0
    });

    return summary;
  }

  static async getTransactionById(id: string) {
    const header = await db.select().from(transactions).where(eq(transactions.id, id)).get();
    if (!header) return null;

    const items = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, id)).all();
    return { ...header, items };
  }

  static async checkout(data: CheckoutPayload) {
    const { items, customerName, paymentMethod, paymentSubMethod, cashPaid } = data;
    
    console.log(`[AUDIT] [CHECKOUT_START] Method: ${paymentMethod} (${paymentSubMethod || '-'}), Customer: ${customerName || 'N/A'}`);

    if (!items || items.length === 0) {
      console.error(`[AUDIT] [CHECKOUT_ERROR] Keranjang kosong`);
      throw new Error("Keranjang kosong!");
    }

    if (paymentMethod === 'TEMPO' && !customerName) {
      console.error(`[AUDIT] [CHECKOUT_ERROR] Nama pelanggan kosong untuk TEMPO`);
      throw new Error("Nama Pelanggan wajib diisi untuk Tempo!");
    }

    // Kalkulasi
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const total = subtotal;

    const transactionId = crypto.randomUUID();
    const receiptNo = `INV-${Date.now()}`;
    const changeAmount = Math.max(cashPaid - total, 0);
    const amountDue = Math.max(total - cashPaid, 0);
    const status = amountDue <= 0 ? 'LUNAS' : 'BELUM_LUNAS';

    const txData: NewTransaction = {
      id: transactionId,
      receiptNo,
      customerName: customerName || null,
      paymentMethod,
      paymentSubMethod: paymentSubMethod || 'CASH',
      totalQty,
      subtotal,
      total,
      cashPaid,
      changeAmount,
      amountDue,
      cogs: 0, // Will be updated
      grossProfit: 0, // Will be updated
      status,
      createdAt: new Date(),
    };

    try {
      await db.transaction(async (tx) => {
        let totalCogs = 0;

        // 1. Simpan Header (Initial)
        tx.insert(transactions).values(txData).run();

        // 2. Simpan & Proses Items (FIFO Logic V2)
        for (const item of items) {
          const itemId = crypto.randomUUID();
          let remainingQty = item.qty;
          let itemCogs = 0;

          // Simpan baris item transaksi
          tx.insert(transactionItems).values({
            id: itemId,
            transactionId,
            productId: item.id || null,
            name: item.name,
            price: item.price,
            qty: item.qty,
            total: item.price * item.qty
          }).run();

          // LOGIKA FIFO: Potong dari Batch tertua
          if (item.id) {
            const availableBatches = tx.select()
              .from(batches)
              .where(and(eq(batches.productId, item.id), sql`${batches.currentStock} > 0`))
              .orderBy(batches.createdAt)
              .all();

            for (const batch of availableBatches) {
              if (remainingQty <= 0) break;

              const deductQty = Math.min(batch.currentStock, remainingQty);
              const costAtSale = batch.buyPrice;
              
              // Potong stok di Batch
              tx.update(batches)
                .set({ 
                  currentStock: sql`${batches.currentStock} - ${deductQty}`,
                  updatedAt: new Date()
                })
                .where(eq(batches.id, batch.id))
                .run();

              // Catat Audit Batch per Item (FIFO Detail)
              tx.insert(transactionItemBatches).values({
                id: crypto.randomUUID(),
                transactionItemId: itemId,
                batchId: batch.id,
                qty: deductQty,
                buyPrice: costAtSale
              }).run();

              // Catat pergerakan stok
              tx.insert(stockMovements).values({
                id: crypto.randomUUID(),
                productId: item.id,
                batchId: batch.id,
                type: 'OUT',
                delta: -deductQty,
                reason: `PENJUALAN: ${receiptNo}`,
                createdAt: new Date()
              }).run();

              itemCogs += (deductQty * costAtSale);
              remainingQty -= deductQty;
            }

            // Update total stok produk (snapshot)
            tx.update(products)
              .set({ 
                currentStock: sql`${products.currentStock} - ${item.qty}`,
                updatedAt: new Date() 
              })
              .where(eq(products.id, item.id))
              .run();
          }

          totalCogs += itemCogs;
        }

        // 3. Final Update Header with COGS and Profit
        const finalGrossProfit = total - totalCogs;
        tx.update(transactions)
          .set({ 
            cogs: totalCogs,
            grossProfit: finalGrossProfit 
          })
          .where(eq(transactions.id, transactionId))
          .run();
        
        // Update local object for return
        txData.cogs = totalCogs;
        txData.grossProfit = finalGrossProfit;
        
        console.log(`[AUDIT] [DB_SAVE_SUCCESS] Checkout complete for ${receiptNo}. COGS: ${totalCogs}, Profit: ${finalGrossProfit}`);
      });
    } catch (err) {
      console.error(`[AUDIT] [DB_ERROR] Gagal menyimpan ke DB:`, err);
      throw new Error("Gagal menyimpan transaksi ke database");
    }

    // Cetak struk: mendelegasikan ke V1 server (Python) via HTTP
    const shop = getShopConfig();
    const printPayload = {
      shop: {
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        cashier: shop.cashier,
        customerName: customerName || '-',
        footerMessage: shop.footerMessage,
        footerSubMessage: shop.footerSubMessage,
      },
      items,
      payment: {
        subtotal,
        total,
        cash: cashPaid,
        change: changeAmount,
        paymentMethod,
        paymentSubMethod: txData.paymentSubMethod,
        status,
        amountDue,
      },
      datetime: {
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID'),
      },
    };

    console.log(`[AUDIT] [PRINT_TRIGGER] Sending to V1 Print Engine...`);

    fetch(V1_PRINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printPayload),
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          console.log('[AUDIT] [PRINT_SUCCESS] Struk berhasil dicetak via V1:', result.message);
        } else {
          console.error('[AUDIT] [PRINT_FAILED] V1 Print gagal:', result.message);
        }
      })
      .catch(err => {
        console.error('[AUDIT] [PRINT_CONNECTION_ERROR] Tidak bisa menghubungi V1 Print Server:', err.message);
      });

    return { success: true, message: "Transaksi berhasil dan sedang dicetak", data: txData };
  }

  static async payTempo(transactionId: string, amount: number) {
    const tx = await db.select().from(transactions).where(eq(transactions.id, transactionId)).get();
    if (!tx) {
      console.error(`[AUDIT] [PAY_TEMPO_ERROR] Transaksi ${transactionId} tidak ditemukan`);
      throw new Error("Transaksi tidak ditemukan");
    }
    if (tx.status === 'LUNAS') throw new Error("Transaksi sudah lunas");

    const newAmountDue = tx.amountDue - amount;
    const newCashPaid = tx.cashPaid + amount;

    console.log(`[AUDIT] [PAY_TEMPO_START] ID: ${transactionId}, Amount: ${amount}, New Sisa: ${newAmountDue}`);

    if (newAmountDue <= 0) {
      db.update(transactions).set({
        amountDue: 0,
        status: 'LUNAS',
        cashPaid: newCashPaid,
        changeAmount: Math.abs(newAmountDue),
      }).where(eq(transactions.id, transactionId)).run();
      console.log(`[AUDIT] [PAY_TEMPO_COMPLETED] Transaksi LUNAS`);
    } else {
      db.update(transactions).set({
        amountDue: newAmountDue,
        cashPaid: newCashPaid,
      }).where(eq(transactions.id, transactionId)).run();
      console.log(`[AUDIT] [PAY_TEMPO_PARTIAL] Transaksi dicicil, sisa: ${newAmountDue}`);
    }

    return { success: true, message: "Cicilan berhasil dibayar" };
  }
}
