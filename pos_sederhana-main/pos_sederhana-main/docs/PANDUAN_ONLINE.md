# Panduan Akses Online (Cloudflare Tunnel)

Aplikasi POS ini mendukung fitur **Smart-Switching**, di mana aplikasi otomatis mendeteksi jalur koneksi (Lokal/Wi-Fi vs Online/Internet).

## Cara Menjalankan Mode Online (Uji Coba)

Jika Anda ingin mengakses POS dari luar toko menggunakan paket data HP, ikuti langkah berikut:

### 1. Persiapan
Pastikan file `cloudflared.exe` ada di folder utama project.

### 2. Jalankan Terowongan (Tunnel)
Buka dua jendela **Git Bash** atau Terminal, lalu ketik perintah berikut:

*   **Terminal 1 (Tampilan/UI):**
    ```bash
    ./cloudflared.exe tunnel --url http://localhost:5173
    ```
*   **Terminal 2 (Database/API):**
    ```bash
    ./cloudflared.exe tunnel --url http://localhost:3000
    ```

### 3. Ambil Link & Update Konfigurasi
1.  Cari link `https://...trycloudflare.com` di masing-masing terminal.
2.  Buka file `frontend/src/lib/config.js`.
3.  Update bagian `apiBase` dengan link dari **Terminal 2**.
4.  Update bagian `printBase` dengan link dari **Terminal 1**.

### 4. Akses dari HP
Buka link dari **Terminal 1** di browser HP Anda. Jika HP baru pertama kali akses, lakukan **Kalibrasi Perangkat** ulang melalui menu Pengaturan Perangkat di Laptop Kasir.

---

> [!TIP]
> **Catatan Penting:** 
> Karena ini mode uji coba gratis, link akan berubah setiap kali Anda mematikan terminal. Jika ingin alamat yang tetap (permanen), Anda disarankan untuk membeli domain sendiri (misal: `.my.id`) dan mendaftarkan akun Cloudflare resmi.
