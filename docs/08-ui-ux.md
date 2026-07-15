# UI/UX: Prinsip Desain & Layar Utama

## Prinsip Desain

1. **Dashboard = meja kerja pribadi per role** — saat login, yang muncul HANYA hal yang relevan untuk pekerjaan role itu hari ini. Teknisi tidak perlu lihat laporan finance; kasir tidak perlu lihat pengaturan Flow Template. Fokus ke 1 workflow, bukan admin panel serba-ada yang menampilkan semua fitur ke semua orang.
2. **Real-time by default** — perubahan status tiket, stok, pembayaran harus terlihat live (websocket/polling), bukan perlu refresh manual.
3. **Mobile-first untuk teknisi** — teknisi bekerja di lantai servis/lapangan, bukan di depan komputer, jadi layar teknisi harus nyaman dipakai di tablet/HP.
4. **Konfigurasi adalah fitur UI kelas satu** — Flow Template Builder dan RBAC management harus punya UI yang jelas, bukan "hidden setting" yang cuma bisa diubah lewat database/kode.
5. **Minim entri data ganda** — data yang sudah diinput di satu tempat (misal saat Diagnosis) harus otomatis muncul di tempat lain yang relevan (Quote, Invoice), tidak diketik ulang.
6. **Sederhana untuk pengguna awam** — asumsikan sebagian staff (kasir, teknisi) tidak terbiasa pakai software. Konsekuensinya: tombol besar dan jelas, bahasa sehari-hari (bukan istilah teknis seperti "reserve" atau "reconcile"), maksimal 1 aksi utama per layar, navigasi datar (aksi umum maksimal 2 klik dari layar utama), hindari teks instruksi panjang — kalau perlu penjelasan, pakai ikon/visual dulu baru teks singkat.

## Layar-Layar Utama

### 1. Dashboard (per role) — "Meja Kerja" Masing-Masing

Setiap role melihat dashboard berbeda, dirancang seperti meja kerja pribadi — bukan satu admin panel yang sama untuk semua orang dengan menu disembunyikan/ditampilkan.

- **Teknisi**: HANYA antrian tiket yang di-assign ke dirinya, diurutkan prioritas. Satu tombol besar per tiket ("Mulai Kerjakan" / "Lanjutkan"). Tidak ada menu finance, inventory global, atau pengaturan yang terlihat sama sekali.
- **Kasir**: HANYA daftar tiket siap dibayar + tombol "Transaksi Baru". Tidak ada akses ke data teknisi, inventory, atau laporan.
- **Inventory Staff**: HANYA stok & purchase order cabangnya. Tidak ada akses ke detail tiket servis atau laporan finance.
- **Branch Manager**: KPI cabangnya, approval pending, performa teknisi — lebih luas dari role lain karena perannya memang lintas fungsi, tapi tetap dikelompokkan per kategori, bukan satu tabel data mentah raksasa.
- **Tenant Owner**: satu-satunya role yang benar-benar lintas cabang & lintas modul (revenue, margin, tiket aktif, grafik tren) — karena perannya memang untuk melihat gambaran besar, bukan operasional harian.

Prinsipnya: kalau suatu role tidak butuh suatu data/fitur untuk pekerjaan hariannya, JANGAN ditampilkan sama sekali — bukan ditampilkan lalu di-disable.

### 2. Ticket Board (Kanban)
- Kolom = stage dari Flow Template aktif (dinamis, ikut konfigurasi — bukan kolom fixed)
- Card tiket menampilkan: customer, asset, teknisi assigned, umur tiket di stage saat ini
- Drag-and-drop antar stage (dengan validasi Transition Rule + permission check di belakang layar)

### 3. Ticket Detail View
- Timeline riwayat perubahan stage (audit trail)
- Live cost breakdown (part + labor, margin real-time)
- Attachment (foto sebelum/sesudah, catatan)
- Panel approval (kalau sedang menunggu Customer Approval)

### 4. Flow Template Builder (Admin)
- Visual builder untuk susun/edit node & transition rule
- Preview flow sebagai diagram sebelum di-publish
- Clone dari Flow Template existing sebagai starting point
- *(Ini fitur UI yang paling menunjukkan diferensiasi modular produk — prioritaskan UX yang mudah dipahami non-developer)*

### 5. Inventory Dashboard
- Level stok per item, alert stok menipis
- Daftar Purchase Order & statusnya
- Riwayat pergerakan stok per item (batch FIFO & supplier asal)

### 6. Katalog Produk
- Browse per kategori (LCD, Baterai, dst.); tiap produk menampilkan merk sparepart & device model yang kompatibel
- Tabel perbandingan harga antar supplier untuk produk yang sama (nama supplier, harga terakhir, tanda supplier utama)
- Diakses Inventory Staff & Branch Manager untuk bantu keputusan beli

### 7. Pencarian Global (Smart Search)
- Satu kolom pencarian, bisa diakses dari mana saja (top bar, semua role)
- Hasil dikelompokkan 2 bagian: **Sparepart** (cari via nama/SKU/device model — ketik "a3s" langsung muncul semua part kompatibel) dan **Tiket Servis** (cari via ID tiket, nama/no. HP customer, atau info asset)
- Toleran typo, bukan cuma exact match (lihat catatan implementasi di [10-tech-stack-infra.md](./10-tech-stack-infra.md))

### 8. POS/Kasir Screen
- Layar simpel, cepat, touch-friendly
- Bisa mulai dari tiket servis (auto-fill item) atau transaksi baru (retail langsung)
- Tombol besar untuk aksi umum (bayar, void, diskon — sesuai permission)

### 9. Finance Reports Dashboard
- **Mode Simpel (default untuk Tenant Owner/Branch Manager)**: angka sehari-hari saja — "Uang Masuk Hari Ini", "Perkiraan Untung Bulan Ini", grafik tren sederhana. Tidak ada istilah akuntansi (COGS, ledger, jurnal).
- **Mode Akuntan (toggle di Pengaturan, atau default untuk role Finance Staff)**: P&L per cabang/periode/konsolidasi tenant, job costing report per tiket/kategori, export ke Excel/PDF
- Satu sumber data yang sama — bedanya cuma tampilan dan istilah, bukan angkanya

### 10. Customer Portal (eksternal)
- Status tiket real-time, akses via **magic link** (token unik dikirim WA/SMS, sekali pakai, expire 7 hari) — tanpa perlu akun/password (detail: [10-tech-stack-infra.md](./10-tech-stack-infra.md))
- Approve/reject quote dengan 1 tap
- Riwayat servis asset mereka

### 11. RBAC Management (Admin)
- Daftar role & permission matrix secara visual (bukan tabel database mentah)
- Assign role ke user, dengan scope cabang

### 12. Audit Log Viewer
- Daftar aksi tercatat: siapa (actor), aksi apa, di entitas mana, kapan, dari IP mana
- Filter per user, jenis aksi, rentang tanggal, entitas
- Diakses oleh Tenant Owner, Branch Manager (cabangnya saja), dan role Auditor/Viewer

### 13. Pengaturan Printer (Admin/Branch Manager)
- **Kelola Device**: daftar printer terhubung per cabang (nama, jenis koneksi, ukuran kertas)
- **Kelola Template**: pilih ukuran kertas (58mm/80mm/A4) → susun field yang ditampilkan → **preview WYSIWYG** yang dirender pakai kode yang sama persis dengan hasil cetak asli (bukan mockup terpisah)
- **Assignment**: tentukan jenis dokumen (Struk, Label, Invoice A4) diarahkan ke device mana. Toggle cepat "Pakai 1 printer untuk semua" mengisi semua assignment ke 1 device yang sama — atau atur manual per jenis dokumen untuk kontrol penuh
- Detail arsitektur lengkap: [14-printer-integration.md](./14-printer-integration.md)

## Struktur Navigasi (Ringkas)

```
Sidebar (berubah sesuai role):
├─ Dashboard
├─ Pencarian (global, selalu terlihat di top bar)
├─ Tiket Servis (Kanban/List)
├─ Inventory
│   ├─ Stok
│   ├─ Katalog Produk
│   └─ Purchase Order
├─ POS/Kasir
├─ Finance & Laporan (Mode Simpel/Akuntan)
├─ Pengaturan (khusus Admin)
│   ├─ Flow Template Builder
│   ├─ Role & Permission
│   ├─ Cabang
│   ├─ Printer (Device, Template, Assignment)
│   └─ Audit Log
└─ Profil/Logout
```

## Catatan

Dokumen ini adalah **panduan level konsep**, belum berupa wireframe/mockup visual. Kalau siap masuk ke tahap desain visual, gunakan ini sebagai brief untuk membuat wireframe di Figma atau sejenisnya.
