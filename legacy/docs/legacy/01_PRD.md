# Product Requirements Document (PRD)

## Saint Heavens POS & Service Management System

---

## 1. Ringkasan Eksekutif

### 1.1 Visi Produk
Sistem manajemen toko terintegrasi untuk toko aksesoris handphone yang menggabungkan Point of Sale (POS), manajemen inventaris, service center, dan Customer Relationship Management (CRM) dalam satu platform.

### 1.2 Target Pengguna
- **Admin**: Pemilik/manager toko dengan akses penuh
- **Kasir**: Staff penjualan di counter
- **Teknisi**: Staff service center

### 1.3 Masalah yang Diselesaikan
1. Pencatatan penjualan manual yang rawan error
2. Stok tidak akurat karena tidak terintegrasi
3. Tracking service handphone yang sulit
4. Hutang pelanggan yang sulit dipantau
5. Tidak ada laporan bisnis real-time

---

## 2. Fitur Utama

### 2.1 Modul Autentikasi
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Login | Login dengan username/password | P0 |
| Role-based Access | 3 role: admin, kasir, teknisi | P0 |
| Session Management | Token-based authentication | P0 |

### 2.2 Modul Inventaris (Inventory)

#### 2.2.1 Manajemen Produk
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| CRUD Produk | Tambah, edit, hapus produk | P0 |
| Kategori Produk | Pengelompokan berdasarkan kategori | P0 |
| Kode Produk/SKU | Identifikasi unik per produk | P0 |
| Gambar Produk | Upload foto produk | P1 |
| Minimum Stock Alert | Notifikasi stok rendah | P1 |

#### 2.2.2 Product Batches (Lot Tracking)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Batch per Pembelian | Setiap pembelian = batch baru | P0 |
| Variant Tracking | Original, OEM, Copy, dll | P0 |
| FIFO Stock | First-In-First-Out untuk penjualan | P0 |
| Harga Beli per Batch | Tracking HPP akurat | P0 |
| Harga Jual per Batch | Fleksibilitas harga jual | P0 |

### 2.3 Modul Pembelian (Purchases)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Buat PO (Purchase Order) | Input pembelian dari supplier | P0 |
| Multi-item per PO | Banyak produk dalam 1 PO | P0 |
| Auto-create Batch | Batch otomatis saat pembelian | P0 |
| Riwayat Pembelian | History semua pembelian | P0 |
| Filter & Search | Cari berdasarkan tanggal, supplier | P1 |

### 2.4 Modul Retur Pembelian (Purchase Returns)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Buat Retur | Kembalikan barang ke supplier | P1 |
| Pilih Batch | Retur dari batch spesifik | P1 |
| Alasan Retur | Dokumentasi alasan | P1 |
| Stock Adjustment | Otomatis kurangi stok | P1 |

### 2.5 Modul Penjualan (Sales/POS)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Quick Sale | Penjualan cepat (walk-in) | P0 |
| Member Sale | Penjualan ke pelanggan terdaftar | P0 |
| Multi Payment | Cash, Transfer, QRIS, Tempo | P0 |
| Diskon | Diskon per transaksi | P0 |
| Auto Batch Selection | FIFO otomatis pilih batch | P0 |
| Hutang/Tempo | Catat penjualan tempo | P0 |
| Cetak Struk | Print receipt | P1 |

### 2.6 Modul Pelanggan (Customers)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| CRUD Pelanggan | Tambah, edit, hapus pelanggan | P0 |
| Credit Limit | Batas maksimal hutang | P0 |
| Debt Tracking | Pantau total hutang | P0 |
| Payment History | Riwayat pembayaran hutang | P0 |
| Diskon Member | Diskon otomatis per pelanggan | P1 |

### 2.7 Modul Service Center
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Terima Service | Input data device & keluhan | P0 |
| Status Tracking | antrian → dicek → konfirmasi → dikerjakan → selesai → diambil | P0 |
| Assign Teknisi | Tugaskan ke teknisi | P0 |
| Estimasi Biaya | Input perkiraan biaya | P0 |
| Biaya Aktual | Input biaya setelah selesai | P0 |
| Catatan Diagnosa | Dokumentasi masalah | P1 |
| Service History | Riwayat service per pelanggan | P1 |

### 2.8 Modul Supplier
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| CRUD Supplier | Tambah, edit, hapus supplier | P0 |
| Kontak Info | Telepon, alamat | P0 |
| Riwayat Pembelian | History transaksi per supplier | P1 |

### 2.9 Modul Kategori
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| CRUD Kategori | Tambah, edit, hapus kategori | P0 |
| Deskripsi | Keterangan kategori | P1 |

### 2.10 Modul Barang Rusak (Defective Items)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Catat Barang Rusak | Input barang cacat/rusak | P1 |
| Sumber Kerusakan | Manual, retur, service | P1 |
| Status Processing | Pending, processed | P1 |

### 2.11 Modul Notifikasi
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Low Stock Alert | Notif stok di bawah minimum | P1 |
| Service Update | Notif perubahan status service | P1 |
| Mark as Read | Tandai sudah dibaca | P1 |

### 2.12 Modul Laporan (Reports)
| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Dashboard Overview | Ringkasan bisnis | P0 |
| Sales Report | Laporan penjualan | P1 |
| Purchase Report | Laporan pembelian | P1 |
| Profit Report | Laporan keuntungan | P2 |
| Stock Report | Laporan stok | P1 |

---

## 3. User Stories

### 3.1 Sebagai Admin
- Saya ingin melihat dashboard dengan ringkasan penjualan, service, dan stok hari ini
- Saya ingin menambah produk baru dengan kategori dan harga jual
- Saya ingin melihat laporan laba rugi bulanan
- Saya ingin mengatur credit limit untuk pelanggan

### 3.2 Sebagai Kasir
- Saya ingin membuat transaksi penjualan dengan cepat
- Saya ingin mencari produk berdasarkan nama atau kode
- Saya ingin memilih metode pembayaran (cash/transfer/tempo)
- Saya ingin mencetak struk untuk pelanggan

### 3.3 Sebagai Teknisi
- Saya ingin melihat daftar service yang ditugaskan ke saya
- Saya ingin update status service yang sedang dikerjakan
- Saya ingin mencatat diagnosa dan solusi perbaikan
- Saya ingin input biaya aktual setelah selesai

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Response time API < 200ms untuk operasi standar
- Dashboard load < 2 detik
- Support 10 concurrent users minimum

### 4.2 Security
- Password hashing (bcrypt)
- JWT token authentication
- CORS protection
- Input validation dengan Zod

### 4.3 Usability
- Responsive design (desktop-first)
- Keyboard shortcuts untuk POS
- Toast notifications untuk feedback

### 4.4 Reliability
- SQLite database (file-based, easy backup)
- Error logging
- Data validation di frontend dan backend

---

## 5. Batasan & Asumsi

### 5.1 Batasan
- Single-store (tidak multi-cabang)
- Offline-first tidak didukung (butuh internet)
- Tidak ada integrasi payment gateway
- Tidak ada fitur akuntansi lengkap

### 5.2 Asumsi
- User memiliki browser modern (Chrome, Firefox, Edge)
- Koneksi internet stabil
- Single currency (IDR)
- Timezone Indonesia (WIB)

---

## 6. Roadmap

### Phase 1 (MVP) ✅
- Autentikasi & role management
- CRUD produk, kategori, supplier
- Pembelian dengan batch tracking
- Penjualan dengan multi-payment
- Pelanggan dengan credit limit

### Phase 2 (In Progress)
- Service center management
- Notifikasi system
- Purchase returns
- Defective items tracking

### Phase 3 (Planned)
- Reporting dashboard
- Data export (Excel/PDF)
- Activity logs
- Backup/restore

### Phase 4 (Future)
- Mobile app (PWA)
- Barcode scanner integration
- WhatsApp notification
- Multi-branch support
