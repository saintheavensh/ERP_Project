# Glosarium

| Istilah | Arti |
|---|---|
| **Tenant** | Satu perusahaan pelanggan SaaS (1 tenant = 1 organisasi dengan data terisolasi) |
| **Branch** | Cabang/outlet di dalam satu tenant |
| **Flow Template** | Definisi urutan stage/node untuk satu jenis proses (servis atau inventory) yang bisa dikonfigurasi |
| **Flow Node** | Satu langkah/stage dalam Flow Template |
| **Transition Rule** | Syarat yang harus dipenuhi untuk pindah dari satu Flow Node ke Flow Node berikutnya |
| **Service Ticket** | Entitas yang merepresentasikan satu pekerjaan servis, dari intake sampai closed |
| **Change Order** | Sub-flow saat teknisi menemukan masalah baru di tengah perbaikan, butuh approval tambahan |
| **RBAC** | Role-Based Access Control — kontrol akses berdasarkan peran pengguna |
| **Reservation (soft-lock)** | Stok ditandai akan dipakai, tapi belum dikurangi secara fisik dari sistem |
| **Consumption (hard deduction)** | Stok benar-benar dikurangi karena sudah dipakai/terjual |
| **Reorder Point** | Ambang batas stok minimum yang memicu pembuatan Purchase Order otomatis |
| **Stock Opname** | Penghitungan fisik stok secara berkala untuk dicocokkan dengan catatan sistem |
| **COGS** | Cost of Goods Sold — biaya pokok barang/part yang terpakai dalam satu tiket/transaksi |
| **Job Costing** | Perhitungan biaya dan margin per pekerjaan/tiket secara individual |
| **Event-Driven Core** | Arsitektur di mana perubahan state memicu event yang otomatis mengupdate modul lain (Inventory, POS, Finance) |
| **Event Bus** | Mekanisme yang mendistribusikan event dari satu sumber (Service Ticket/Inventory) ke banyak subscriber (Finance, POS, dll.) |
| **Idempotency Key** | Identifier unik di request API untuk mencegah aksi yang sama dieksekusi dua kali akibat retry jaringan |
