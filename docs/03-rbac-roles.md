# RBAC & Role Management

## Filosofi

RBAC di FlowServ bekerja di **dua level**:

1. **Level Modul** — role boleh akses modul apa saja (Inventory, POS, Finance, dst) — RBAC "klasik".
2. **Level Flow Node** — role boleh eksekusi *aksi spesifik* di titik tertentu dalam alur kerja (lihat [02-architecture-modular.md](./02-architecture-modular.md)).

Level kedua inilah yang membuat RBAC ini lebih granular dari kebanyakan aplikasi sejenis: bukan cuma "bisa akses Inventory", tapi "bisa approve stock adjustment di atas Rp 500.000", misalnya.

## Hierarki Role (Default — Bisa Dikustomisasi per Tenant)

| Role | Scope | Deskripsi Singkat |
|---|---|---|
| **Platform Super Admin** | Seluruh platform | Provisioning tenant, billing, monitoring — di luar struktur tenant |
| **Tenant Owner/Admin** | 1 tenant (semua cabang) | Full access, konfigurasi Flow Template & Role di tenant-nya |
| **Branch Manager** | 1 atau beberapa cabang | Approve transaksi di atas threshold, lihat laporan cabang, kelola staf cabang |
| **Senior Technician** | 1 cabang | Eksekusi & approve node teknis (QC, diagnosis kompleks) |
| **Technician (Junior)** | 1 cabang | Eksekusi node dasar (diagnosis awal, update progress repair) |
| **Cashier/Kasir** | 1 cabang | Transaksi POS, terima pembayaran |
| **Inventory Staff** | 1 cabang (atau gudang pusat) | Kelola stok, purchase order, stock opname |
| **Finance Staff** | 1 tenant (lintas cabang) | Lihat & kelola laporan keuangan, approve refund |
| **Customer Service (CS)** | 1 cabang | Intake tiket, komunikasi ke customer |
| **Auditor/Viewer** | 1 tenant (read-only) | Akses baca untuk kebutuhan audit eksternal |

> Role di atas adalah **starting point**, bukan daftar final/kaku — Tenant Owner bisa membuat custom role dengan kombinasi permission sendiri lewat UI RBAC Management (lihat [08-ui-ux.md](./08-ui-ux.md)).

## Contoh Permission Matrix

Notasi: ✅ penuh · ➕ dengan approval/threshold · ❌ tidak bisa

| Aksi | Junior Tech | Senior Tech | Branch Mgr | Kasir | Inventory Staff | Finance |
|---|---|---|---|---|---|---|
| Buat tiket servis | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update diagnosis | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve quote ke customer | ❌ | ➕ (< Rp X) | ✅ | ❌ | ❌ | ❌ |
| Reserve/consume part | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Adjust stok manual | ❌ | ❌ | ➕ | ❌ | ✅ | ❌ |
| Proses pembayaran POS | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Void transaksi POS | ❌ | ❌ | ✅ | ➕ (approval) | ❌ | ❌ |
| Approve refund | ❌ | ❌ | ➕ | ❌ | ❌ | ✅ |
| Lihat laporan finance cabang | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Konfigurasi Flow Template | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ *(Tenant Owner only)* |

*Nilai threshold (Rp X) dan aksi mana yang butuh approval tetap dikonfigurasi per tenant — bukan angka hardcoded di kode. Default awal (bisa diubah admin tenant kapan saja): approve quote di atas Rp 200.000 butuh Senior Technician, di atas Rp 1.000.000 butuh Branch Manager; adjust stok manual di atas Rp 500.000 butuh approval Branch Manager; void transaksi POS selalu butuh approval Branch Manager.*

## Scoping: Tenant vs Branch vs Global

- Setiap User terikat ke 1 Tenant.
- Setiap User bisa punya 1+ Role, dan setiap penetapan Role bisa di-scope ke Branch tertentu (misal: Branch Manager Cabang A, bukan otomatis jadi Branch Manager di semua cabang).
- Permission check harus selalu mempertimbangkan 3 hal: **Role**, **Tenant**, **Branch** — jangan hanya cek Role saja.

## Untuk Developer/AI Agent: Implementasi

- Simpan permission sebagai data (bukan if/else hardcoded per role) — idealnya tabel `role_permissions` dengan foreign key ke `permissions` dan `flow_nodes`.
- Setiap Flow Node (lihat dok 02 & 04) harus mendefinisikan `required_permission` yang di-check sebelum aksi dieksekusi.
- Saat membuat fitur baru yang butuh kontrol akses, **jangan** buat pengecekan role baru yang hardcoded (`if role == "manager"`) — tambahkan permission baru ke tabel dan biarkan admin tenant yang assign ke role mana pun.
