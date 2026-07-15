# Panduan Setup Printer Thermal (Server-Side)

Agar fitur **Cetak Struk** dari HP bisa berjalan, Printer Thermal yang tercolok di Komputer Server/Kasir harus di-share terlebih dahulu.

Ikuti langkah-langkah berikut di Komputer Windows Anda.

---

## 1. Pastikan Printer Terinstal
Pastikan driver printer thermal (Epson, POS-58, POS-80, dll) sudah terinstal dan bisa nge-print "Test Page" biasa.
Nama printer tidak harus specific, tapi kita akan mengubah "Share Name"-nya.

## 2. Cara Share Printer
Fitur ini membutuhkan printer yang "Di-Share" agar Backend bisa mengirim perintah cetak.

1. Buka **Start Menu**, ketik `Printers & Scanners` lalu buka.
2. Klik pada nama Printer Thermal Anda (misal: `POS-80` atau `Epson TM-T82`).
3. Klik tombol **Manage** (Kelola).
4. Klik menu **Printer Properties** (bukan "Printing Preferences").
5. Pindah ke tab **Sharing**.
6. Centang kotak **☑ Share this printer**.
7. Pada kolom **Share name**, ganti menjadi nama yang mudah, **WAJIB** tanpa spasi.
   - Rekomendasi: `ReceiptPrinter`
8. Klik **Apply** lalu **OK**.

> **PENTING**: Nama `ReceiptPrinter` ini yang akan dipakai di config aplikasi.

---

## 3. Konfigurasi Aplikasi (File .env)
Buka file `.env` di folder `apps/backend/`. Pastikan ada baris berikut:

```env
PRINTER_INTERFACE=\\localhost\ReceiptPrinter
```

Jika Anda memberi nama lain saat sharing (misal `KasirUtama`), maka ubah menjadi:
```env
PRINTER_INTERFACE=\\localhost\KasirUtama
```

*Note: Jangan lupa restart backend server (`bun run dev`) setelah mengubah .env.*

---

## 4. Testing
1. Buka Aplikasi di HP atau Browser PC.
2. Buat Service Baru atau Buka Detail Service yang sudah ada.
3. Klik tombol **Cetak Struk (Server)**.
4. Jika berhasil, printer akan mencetak struk layout baru.

## 5. Troubleshooting (Masalah Umum)

### Muncul Error: "The network path was not found"
- **Penyebab**: Printer belum di-share, atau nama share salah.
- **Solusi**: Cek lagi langkah No. 2. Pastikan Share name persis sama dengan di `.env`.

### Muncul Error: "Access is denied"
- **Penyebab**: Windows membatasi akses share printer.
- **Solusi**: Coba restart service "Print Spooler" di Windows Services, atau restart komputer.

### Struk kosong / pendek
- **Penyebab**: Ukuran kertas salah.
- **Solusi**: Sistem ini dioptimalkan untuk kertas **80mm**. Jika pakai 58mm, mungkin terpotong.
