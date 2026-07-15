# Inventory & POS Application

Aplikasi web modern untuk manajemen stok, penjualan (POS), dan servis, dengan fokus pada kemudahan penggunaan dan akurasi data.

## 🚀 Instalasi & Menjalankan

### Persyaratan
- [Bun](https://bun.sh/) (Runtime & Package Manager)

### Setup Awal
```bash
# 1. Install Dependencies
bun install

# 2. Setup Layanan
# Jalankan perintah ini untuk setup database & user admin default
bun run db:push
bun run db:seed
```

### Menjalankan Aplikasi
Buka dua terminal terpisah:

**Terminal 1 (root folder)**
```bash
bun run dev
# Buka browser di http://localhost:5173

---

## 📖 Panduan Penggunaan

### 1. Login & Role Behavior
*   **Email**: `admin` (Default)
*   **Password**: `admin` (Default)

Sistem mendukung 2 mode role behavior yang bisa diatur oleh Owner di menu Pengaturan:
*   **Mode Flexible** (Default): User langsung masuk ke dashboard setelah login dan bisa berganti role kapan saja via dropdown switcher di header.
*   **Mode Strict**: User diwajibkan memilih satu role spesifik setelah login, dan tidak bisa berganti role di tengah jalan (harus logout).

### 2. Manajemen Master Data (Setup Awal)
Sebelum transaksi, pastikan data master terisi:
1.  **Menu Manajemen > Supplier**: Tambahkan supplier & merk barang.
2.  **Menu Manajemen > Kategori**: Buat kategori produk (e.g. "Sparepart", "Aksesoris").
3.  **Menu Manajemen > Produk**:
    *   Klik "Tambah Produk".
    *   Isi Nama, Kode (SKU), dan Kategori.
    *   *Note: Stok awal akan 0. Stok hanya bisa ditambah lewat Pembelian.*
4.  **Menu Manajemen > Customers**: Tambahkan pelanggan tetap (optional). Default "Walk-in Costumer" tersedia untuk POS.

### 3. Pembelian (Stok Masuk)
Untuk menambah stok:
1.  **Menu Transaksi > Pembelian > Input Pembelian**.
2.  Pilih Supplier.
3.  Pilih Produk.
4.  **Input Varian**: Ketik jenis kualitas (e.g. "Original", "OEM").
5.  Input Qty & Harga Beli/Jual.
6.  Simpan. Stok akan bertambah sesuai batch.

### 4. Penjualan (POS)
Untuk kasir/jualan sehari-hari:
1.  **Menu Transaksi > Penjualan**.
2.  Cari produk (Nama/SKU). Pilih varian yang tersedia.
3.  Masukkan ke keranjang.
4.  Pilih Customer (atau biarkan default).
5.  Klik "Bayar".
6.  Pilih metode pembayaran (Tunai/Transfer) & Nominal.
7.  Cetak Struk.
    *   *Sistem otomatis memotong stok dari batch tertua (FIFO).*

### 5. Retur Pembelian (Barang Rusak)
Jika ada barang rusak yang mau dikembalikan ke supplier:
1.  **Menu Transaksi > Retur Pembelian**.
2.  Pilih Tab **"Gudang Retur"**.
3.  Klik **"Tambah Manual"**.
4.  Pilih Produk & Batch asal (sumber barang rusak).
5.  Input Jumlah & Alasan. Simpan -> Stok berkurang, masuk 'Staging'.
6.  Di list Gudang Retur, centang item yang mau dikirim balik (harus 1 supplier).
7.  Klik **"Proses Retur"** untuk mencetak dokumen jalan.

### 6. Service Tracking
Untuk mencatat servis HP/Elektronik:
1.  **Menu Transaksi > Service**.
2.  Buat tiket baru (Data Pelanggan, Perangkat, Keluhan).
3.  Update status (Antri -> Dikerjakan -> Selesai).
4.  Cetak Nota pengambilan.

---

## 📂 Dokumentasi Teknis
Untuk developer yang ingin mengembangkan aplikasi:
*   Baca **`docs/core_concepts.md`** untuk pemahaman logika bisnis.
*   Baca **`docs/development-standards.md`** untuk aturan coding.

---

## ☁️ Production Deployment

### 1. Environment Variables
Buat file `.env.production` di setiap folder app dengan mengikuti template `.env.example`.
Variabel utama yang dibutuhkan:
- `DATABASE_URL`: Connection string PostgreSQL.
- `JWT_SECRET`: Kode rahasia untuk autentikasi.
- `PUBLIC_API_URL`: URL public backend.
- `PUBLIC_SENTRY_DSN`: (Optional) DSN untuk error tracking.

### 2. Build & Deploy
Gunakan perintah berikut untuk persiapan production:
```bash
# Di root folder
# 1. Type check (Backend & Frontend)
bun run check

# 2. Build Frontend
cd apps/frontend
npm run build:prod

# 3. Build/Run Backend
cd ../backend
bun src/main.ts (atau gunakan PM2 untuk production)
```

### 3. Monitoring
Sistem sudah terintegrasi dengan **Sentry** untuk pelacakan error secara realtime. Pastikan `PUBLIC_SENTRY_DSN` sudah terkonfigurasi untuk mengaktifkannya di production.

---

## 🛠️ Stack Teknologi
- **Frontend**: SvelteKit 5 (Runes), TailwindCSS, TanStack Query.
- **Backend**: Hono, Drizzle ORM, Inversify (DI).
- **Database**: PostgreSQL (Supabase).
- **Architecture**: Hybrid Feature-Based Clean Architecture.
