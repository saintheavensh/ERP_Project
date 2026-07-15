# Daftar Fitur per Modul

Status: 🟢 MVP (wajib ada di rilis pertama) · 🟡 Phase 2 (menyusul) · ⚪ Ide/belum diprioritaskan

## 1. Core Platform (Multi-Tenant & RBAC)
- 🟢 Provisioning tenant baru (self-service atau lewat Super Admin)
- 🟢 Manajemen role & permission per tenant (termasuk custom role)
- 🟢 Manajemen cabang (branch) dalam 1 tenant
- 🟢 Flow Template Builder (buat/edit/clone alur servis & inventory)
- 🟢 Audit log lintas modul (siapa melakukan apa, di entitas mana, kapan)
- 🟢 Pencarian global (sparepart & tiket servis dalam 1 pencarian)
- 🟢 Konfigurasi printer: device, template per ukuran kertas, assignment per jenis dokumen
- 🟡 SSO/integrasi login enterprise (SAML/OAuth)

## 2. Service Ticket Management
- 🟢 Buat & kelola tiket servis (intake sampai closed)
- 🟢 Assign teknisi (manual atau auto-assign berdasar beban kerja)
- 🟢 Kanban board tiket per stage
- 🟢 Customer approval via portal/WA/SMS
- 🟢 Change order (temuan baru di tengah perbaikan)
- 🟢 Checklist QC per jenis servis
- 🟡 Estimasi waktu selesai otomatis (berdasar riwayat servis serupa)
- 🟡 Foto before/after per tiket
- ⚪ AI-assisted diagnosis suggestion (berdasar riwayat servis serupa)

## 3. Inventory Management
- 🟢 Master data part/barang per kategori, merk sparepart, dan kompatibilitas device model
- 🟢 Katalog produk: perbandingan harga per merk sparepart & supplier
- 🟢 Stok masuk (goods receipt) dari Purchase Order, dengan FIFO batch tracking per supplier
- 🟢 Reservasi part otomatis saat tiket masuk stage Parts Reservation
- 🟢 Konsumsi part otomatis saat teknisi tandai "used" (FIFO — batch tertua dulu)
- 🟢 Alert stok menipis (reorder point)
- 🟢 Purchase Order (manual & auto-trigger)
- 🟡 Multi-gudang/multi-lokasi stok
- 🟡 Stock opname/audit terjadwal
- ⚪ Prediksi kebutuhan stok berbasis riwayat servis (forecasting)

## 4. POS & Finance
- 🟢 Transaksi POS terhubung ke tiket servis
- 🟢 Transaksi POS berdiri sendiri (penjualan langsung part/aksesoris)
- 🟢 Pembayaran partial/DP (down payment)
- 🟢 Job costing real-time per tiket
- 🟢 Laporan P&L per cabang & konsolidasi tenant
- 🟢 Approval refund & void dengan threshold
- 🟢 Mode Simpel (default) vs Mode Akuntan (toggle di Pengaturan) — sembunyikan istilah akuntansi untuk Owner/Branch Manager
- 🟡 Integrasi payment gateway (QRIS, kartu, dsb.)
- 🟡 Ekspor laporan ke format akuntansi standar
- ⚪ Rekonsiliasi bank otomatis

## 5. Customer Portal
- 🟢 Tracking status tiket real-time
- 🟢 Approve/reject quote biaya
- 🟢 Riwayat servis per asset/customer
- 🟡 Notifikasi WA/SMS otomatis per perubahan stage
- ⚪ Rating & review pasca-servis

## 6. Reporting & Analytics
- 🟢 Dashboard performa per cabang (jumlah tiket, revenue, margin)
- 🟢 Dashboard performa teknisi (jumlah tiket selesai, waktu rata-rata)
- 🟡 Analisis part paling sering dipakai/rusak
- ⚪ Prediksi churn customer / repeat customer analysis

## 7. Notifikasi & Integrasi
- 🟢 Notifikasi in-app (perubahan stage, approval pending)
- 🟡 Integrasi WhatsApp Business API
- 🟡 Webhook untuk integrasi pihak ketiga (akuntansi eksternal, dll.)
- ⚪ API publik untuk marketplace/partner integration
