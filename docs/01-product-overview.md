# Product Overview

## Masalah yang Ingin Diselesaikan

Service center (elektronik, otomotif, peralatan rumah tangga, dll.) pada umumnya menghadapi pola masalah yang sama, terlepas dari industrinya:

1. **Inventory, POS, dan Finance berjalan sendiri-sendiri.** Stok dicatat manual atau di sistem terpisah, transaksi kasir tidak otomatis mengurangi stok secara real-time, dan laporan keuangan baru "sinkron" di akhir bulan lewat rekonsiliasi manual.
2. **Alur servis kaku.** Semua tiket — dari servis ringan sampai perbaikan kompleks — dipaksa lewat urutan langkah yang sama, karena alurnya hardcoded di aplikasi.
3. **Margin per pekerjaan tidak terlihat sampai akhir bulan.** Biaya part + jam kerja teknisi tidak dikalkulasi real-time, jadi pemilik baru tahu untung/rugi setelah laporan bulanan keluar.
4. **RBAC terlalu kasar.** Biasanya hanya ada "Admin" dan "Staff" — tidak ada kontrol granular siapa boleh approve diskon, siapa boleh void transaksi, atau siapa boleh ubah harga.
5. **Menambah lini bisnis baru itu mahal.** Kalau service center ingin ekspansi ke jenis servis baru atau cabang dengan SOP berbeda, biasanya perlu request fitur baru ke vendor software.

## Visi Produk

Membangun **mesin alur kerja modular** (modular workflow engine) untuk service center — di mana Inventory Flow dan Service Flow disusun dari komponen yang bisa dikonfigurasi ulang, terintegrasi real-time ke POS dan Finance, dengan RBAC granular sebagai lapisan kontrol di setiap langkah.

Bukan aplikasi "satu ukuran untuk semua", tapi **platform yang bentuknya mengikuti bisnis penggunanya** — bukan sebaliknya.

## Target Pengguna

| Persona | Kebutuhan Utama |
|---|---|
| **Tenant Owner / Direktur** | Visibilitas lintas cabang, laporan finansial real-time, kontrol konfigurasi alur kerja |
| **Branch Manager** | Kelola operasional cabang, approve transaksi di atas threshold, pantau performa teknisi |
| **Teknisi** | Antrian tiket yang jelas, akses cepat ke riwayat servis & stok part, minim entri data ganda |
| **Kasir (Cashier)** | Transaksi cepat & akurat, terhubung otomatis ke tiket servis atau penjualan langsung |
| **Staff Finance** | Laporan real-time, job costing per tiket, rekonsiliasi otomatis |
| **Staff Inventory/Gudang** | Kontrol stok, purchase order, alert stok menipis |
| **Customer (end-user)** | Transparansi status servis, approval biaya tambahan tanpa harus telepon |

## Diferensiator Inti

1. **Modular Workflow Engine** — Flow Template & Flow Node yang bisa dikonfigurasi, bukan hardcoded. Detail: [02-architecture-modular.md](./02-architecture-modular.md)
2. **Event-driven, single source of truth** — satu perubahan status tiket otomatis update Inventory, POS, dan Finance secara bersamaan, tanpa sinkronisasi manual.
3. **Real-time job costing** — margin per tiket servis terlihat sejak part dipakai, bukan menunggu tutup buku.
4. **RBAC granular per node alur kerja** — bukan cuma "boleh akses modul X", tapi "boleh eksekusi aksi spesifik ini, di titik ini".
5. **Konfigurasi per tenant & per cabang** — satu platform, SOP berbeda-beda per pelanggan SaaS, bahkan per cabang dalam satu tenant.

## Model Bisnis (Ringkas)

Multi-tenant SaaS, kemungkinan tier berlangganan berdasarkan jumlah cabang/user/volume tiket. *(Detail pricing/billing belum dibahas di dokumen ini — bisa dibuat dokumen terpisah kalau diperlukan.)*

## Yang BUKAN Fokus Produk Ini (Non-Goals)

Supaya scope tidak melebar, penting untuk eksplisit apa yang **tidak** coba diselesaikan produk ini di versi awal:

- Bukan general-purpose ERP (tidak mencoba menggantikan modul HR, payroll, atau manufacturing planning)
- Bukan CRM marketing/sales pipeline lengkap (fokus ke operasional servis, bukan lead generation)
- Bukan e-commerce storefront publik (fokus B2B SaaS untuk operator service center)
