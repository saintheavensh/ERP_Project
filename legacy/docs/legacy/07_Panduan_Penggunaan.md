# 📱 Panduan Penggunaan Aplikasi Toko HP

## Daftar Isi
1. [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
2. [Akses dari Smartphone](#akses-dari-smartphone)
3. [Akses dari Komputer Lain](#akses-dari-komputer-lain)
4. [Menghentikan Aplikasi](#menghentikan-aplikasi)
5. [Troubleshooting](#troubleshooting)

---

## Cara Menjalankan Aplikasi

### Langkah 1: Double-click START_APP.bat
```
📁 coba/
├── 🚀 START_APP.bat  <-- Double-click ini!
├── 🛑 STOP_APP.bat
├── apps/
│   ├── backend/
│   └── frontend/
```

### Langkah 2: Tunggu hingga browser terbuka
Aplikasi akan otomatis:
1. ✅ Menjalankan Backend Server (port 3000)
2. ✅ Menjalankan Frontend Server (port 5173)
3. ✅ Membuka browser ke http://localhost:5173

### Langkah 3: Login
- Gunakan kredensial yang sudah terdaftar
- Default: (sesuaikan dengan akun yang sudah dibuat)

---

## Akses dari Smartphone

### Langkah 1: Cari IP Address Komputer Server

Buka Command Prompt dan ketik:
```cmd
ipconfig
```

Cari baris "IPv4 Address", contoh:
```
IPv4 Address. . . . . . . : 192.168.1.100
```

### Langkah 2: Pastikan di Jaringan WiFi yang Sama
- Komputer server dan smartphone harus terhubung ke WiFi yang sama
- Atau terhubung ke router/LAN yang sama

### Langkah 3: Buka di Browser Smartphone
Ketik di browser smartphone:
```
http://192.168.1.100:5173
```
(Ganti `192.168.1.100` dengan IP komputer Anda)

### Langkah 4: Install sebagai Aplikasi (PWA)

**Android (Chrome):**
1. Buka aplikasi di Chrome
2. Tap ikon ⋮ (menu) di kanan atas
3. Pilih "Add to Home screen" / "Tambahkan ke Layar utama"
4. Ketik nama "Toko HP"
5. Tap "Add" / "Tambahkan"
6. Icon aplikasi akan muncul di home screen!

**iPhone (Safari):**
1. Buka aplikasi di Safari
2. Tap ikon Share (kotak dengan panah ke atas)
3. Scroll ke bawah, pilih "Add to Home Screen"
4. Ketik nama "Toko HP"
5. Tap "Add"

### Hasil:
Aplikasi akan terlihat seperti app native, tanpa address bar browser!

---

## Akses dari Komputer Lain

### Setup (sama seperti smartphone):
1. Pastikan di jaringan yang sama
2. Buka browser di komputer lain
3. Ketik: `http://IP_KOMPUTER_SERVER:5173`

### Contoh:
Jika IP server adalah `192.168.1.100`:
- Komputer B: buka `http://192.168.1.100:5173`
- Smartphone A: buka `http://192.168.1.100:5173`

---

## Menghentikan Aplikasi

### Opsi 1: Double-click STOP_APP.bat
Ini akan menghentikan semua server.

### Opsi 2: Tutup jendela CMD
Tutup kedua jendela Command Prompt yang berjudul:
- "Toko HP - Backend"
- "Toko HP - Frontend"

---

## Troubleshooting

### ❌ "Bun is not installed"
**Solusi:** Install Bun dari https://bun.sh

### ❌ Tidak bisa akses dari smartphone
**Checklist:**
- [ ] Komputer server dan smartphone di WiFi yang sama?
- [ ] IP address benar? (cek ulang dengan `ipconfig`)
- [ ] Firewall Windows mengizinkan koneksi?

**Cara buka Firewall:**
1. Windows Key + R
2. Ketik `wf.msc` → Enter
3. Klik "Inbound Rules" → "New Rule"
4. Port → TCP → 5173, 3000 → Allow

### ❌ Aplikasi lambat
- Pastikan tidak ada proses berat lain yang berjalan
- Restart aplikasi dengan STOP_APP.bat lalu START_APP.bat

### ❌ Login gagal
- Pastikan backend server berjalan (cek jendela CMD "Backend")
- Cek database sudah ter-seed dengan `bun run seed` di folder backend

---

## 📊 Arsitektur Jaringan

```
   ┌─────────────── WiFi Router ───────────────┐
   │                 192.168.1.1                │
   │                                            │
   │  ┌────────────┐                            │
   │  │  SERVER    │ 192.168.1.100              │
   │  │  (Backend  │                            │
   │  │  +Frontend)│                            │
   │  └─────┬──────┘                            │
   │        │                                   │
   │        │ http://192.168.1.100:5173         │
   │        │                                   │
   │  ┌─────┴─────┐  ┌──────────────┐  ┌───────┴────────┐
   │  │ Komputer  │  │  Komputer    │  │  Smartphone    │
   │  │ Kasir     │  │  Gudang      │  │  Admin         │
   │  │ .101      │  │  .102        │  │  .103          │
   │  └───────────┘  └──────────────┘  └────────────────┘
   │
   └──────────────────────────────────────────────────────┘
```

---

## ⚠️ Catatan Penting

1. **Server harus selalu menyala** - Komputer yang menjalankan START_APP.bat harus tetap hidup selama aplikasi digunakan.

2. **Data tersimpan di server** - Semua data disimpan di komputer server (file `store.db`).

3. **Backup rutin** - File database ada di `apps/backend/data/store.db`. Backup file ini secara rutin!

4. **Untuk multiple branches (cabang)** - Memerlukan setup cloud server. Hubungi developer untuk implementasi.
