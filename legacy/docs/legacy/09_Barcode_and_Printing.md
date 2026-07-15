# Barcode & Server-Side Printing

## 1. Overview
Fitur ini mencakup integrasi Barcode Scanner (QR Code) pada aplikasi mobile dan pencetakan struk thermal (Receipt Printing) yang dieksekusi dari sisi server (Server-Side) untuk mengatasi keterbatasan browser mobile.

---

## 2. Barcode Scanner (Detail Teknis)

Fitur scanner ini memungkinkan kamera HP berperan sebagai alat input cepat (seperti scanner kasir), mengeliminasi kebutuhan mengetik manual No. Service yang panjang.

### 2.1 Cara Kerja (Under the Hood)
Proses scanning berjalan sepenuhnya di browser (Client-Side) tanpa mengirim stream video ke server:
1.  **Akses Kamera**: Aplikasi memanggil API browser `navigator.mediaDevices.getUserMedia`.
2.  **Rendering**: Stream video ditampilkan secara real-time pada elemen HTML `<div>`.
3.  **Frame Sampling**: Library mengambil gambar (frame) dari video stream sekitar 10 kali per detik (10 FPS).
4.  **Decoding**: Setiap frame dianalisis piksel-nya untuk mencari pola hitam-putih khas QR Code atau Barcode 1D.
5.  **Result**: Jika pola ditemukan dan valid, library mengembalikan string text (misal: `SRV-20260111-001`) dan menghentikan scanning sementara.

### 2.2 Mengapa Wajib HTTPS?
Ini adalah syarat mutlak dari Browser Security Policy (Chrome, Safari, Firefox, dll).
-   **Security Restriction**: Browser modern **memblokir** akses ke fitur sensitif (Kamera, Microphone, GPS) jika website diakses melalui protokol tidak aman (`http://`).
-   **Pengecualian**: Akses `http://localhost` masih diizinkan untuk development di komputer yang sama.
-   **Masalah di HP**: Saat membuka aplikasi di HP, kita menggunakan IP Address LAN (misal: `http://192.168.1.50`). Ini dianggap **Tidak Aman (Insecure)** oleh browser, sehingga kamera diblokir.
-   **Solusi**: Kita menggunakan **HTTPS** (via `vite-plugin-mkcert` saat dev) agar browser di HP "percaya" dan mengizinkan akses kamera.

### 2.3 Libraries & Fungsinya

#### A. `html5-qrcode` (Frontend)
Library utama untuk fitur scanner.
-   **Fungsi**: Menangani permission kamera, render viewfinder UI, dan algoritma decoding gambar menjadi text.
-   **Kenapa dipilih**: Paling stabil, support cross-platform (Android/iOS), dan bisa switch kamera depan/belakang/macro.

#### B. `qrcode` (Backend & Frontend Utility)
Library untuk **membuat (Generate)** QR code, bukan membaca.
-   **Fungsi Backend**: `PrintService` menggunakannya untuk mengubah No. Service menjadi Buffer Gambar (PNG) yang bisa dicetak oleh thermal printer.
-   **Fungsi Frontend**: Mengubah No. Service menjadi string SVG untuk ditampilkan di layar.


---

## 3. Server-Side Printing
Pencetakan struk service note menggunakan printer thermal 80mm yang terhubung ke Server (Windows PC), **bukan** via Bluetooth HP.

### Masalah yang Diatasi
- **Mobile Freeze**: `window.print()` di HP sering menyebabkan blank screen atau crash.
- **Konsistensi Layout**: CSS print browser sulit diatur presisi untuk kertas 80mm.
- **Konektivitas**: Tidak perlu setting bluetooth printer di setiap HP karyawan. Cukup 1 printer di kasir/server.

### Arsitektur Teknis
1. **Frontend**:
   - User menekan tombol "Cetak Struk (Server)".
   - Mengirim request POST ke API `/service/:id/print`.
   - Menampilkan notifikasi sukses/gagal berdasarkan response server.

2. **Backend**:
   - **Endpoint**: `POST /service/:id/print` (di `service.controller.ts`)
   - **Service**: `PrintService` (di `print.service.ts`)
   - **Data Fetch**: Mengambil data Service, Customer, dan Device dari DB.
   - **ESC/POS Generation**: Menggunakan library `node-thermal-printer` untuk generate buffer command native printer (bukan HTML to PDF).
   - **QR Code**: Generate buffer QR Image menggunakan library `qrcode` (width 350px).
   - **Delivery**:
     - Menulis buffer ke file temporary (`temp_print.bin`).
     - Menggunakan command shell Windows `COPY /B temp.bin \\localhost\PrinterName` untuk mengirim data raw ke printer.

### Konfigurasi
- **Environment Variable**: `PRINTER_INTERFACE`
  - Format: `\\ComputerName\ShareName` atau `\\localhost\ShareName`
  - Default: `\\localhost\ReceiptPrinter`

### Struktur Struk (Receipt Layout)
Layout dibuat manual agar rapi di kertas 80mm:
1. **Header**: Nama Toko & Alamat (Centered).
2. **Metadata**: No. Service (Bold), Tanggal (dd/mm/yyyy).
3. **Customer Info**: Nama & Telepon.
4. **Unit Details**:
   - Unit: (Brand + Model)
   - Keluhan
   - Kondisi (Comma-separated)
   - Kelengkapan (Comma-separated)
5. **Est. Biaya**: Range biaya atau "Menunggu Konfirmasi".
6. **QR Code**: Besar (350px) agar mudah discan.
7. **Footer**: Note pengambilan.

### Troubleshooting Error Code
- **Network path not found**: Nama printer salah atau belum di-share.
- **Access denied**: Permission issue pada user Windows yg menjalankan backend.
