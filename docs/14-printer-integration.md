# Integrasi Printer: Device, Template Multi-Ukuran, dan Assignment

## Dua Mekanisme Cetak yang Berbeda — Jangan Disamakan

Ini prinsip paling penting di dokumen ini: **kertas thermal (58mm/80mm) dan A4 adalah dua cara cetak yang fundamental berbeda**, bukan cuma beda ukuran template.

| | Thermal (58mm/80mm) | A4 |
|---|---|---|
| Mekanisme | ESC/POS lewat Python Local Agent | Dialog print browser bawaan (`window.print()`) |
| Kenapa | Browser tidak bisa akses printer USB/serial langsung — perlu jembatan lokal | Printer biasa (laser/inkjet) sudah otomatis terdeteksi lewat driver OS; browser print dialog sudah menampilkan semua printer yang terpasang |
| "Pilih printer sesuai yang ada di komputer" | Dikonfigurasi manual sekali di Pengaturan (lihat Printer Device di bawah) | Otomatis — bawaan browser, tidak perlu kita bangun sendiri |

## Arsitektur

```
[Data Transaksi/Tiket di Database — SATU sumber kebenaran]
                    │
                    ▼
        [Printer Template Engine]  ← layout_config (field mana, urutan, gaya)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  [Render Thermal]        [Render A4 (HTML)]
        │                       │
        ▼                       ▼
[Python Local Agent]     [window.print() browser]
        │                       │
        ▼                       ▼
[Printer ESC/POS]        [Printer apapun di OS]
```

Prinsip kunci: **kode render yang dipakai untuk PREVIEW dan untuk CETAK ASLI harus sama persis** — cuma tujuan akhirnya beda (layar vs printer). Kalau preview pakai kode terpisah dari cetak, lama-lama bisa tidak sinkron (preview bilang A, hasil cetak beda). Dengan satu kode render, kondisi itu tidak mungkin terjadi secara struktur.

## Template: Terpisah dari Data, Bisa Diedit Tanpa Mengubah Angka

`printer_templates.layout_config` (lihat `db/schema.ts`) HANYA menyimpan konfigurasi tampilan — field apa saja yang ditampilkan, urutannya, gaya (bold/ukuran font/alignment). **Tidak pernah menyimpan nilai transaksi.** Nilai (harga, tanggal, nama customer, dst.) selalu diambil langsung dari database saat proses cetak/preview dijalankan.

Konsekuensinya: admin bisa bebas mengedit tampilan struk (pindah posisi logo, sembunyikan kolom tertentu, ganti teks footer), tapi **tidak ada mekanisme untuk mengubah angka transaksi lewat editor template** — karena editor template memang tidak pernah menyentuh tabel data transaksi sama sekali.

## Detail Bertambah Sesuai Ukuran Kertas (Template Default)

| | 58mm | 80mm | A4 |
|---|---|---|---|
| Header | Nama toko saja | + alamat, no. HP | + logo, kop surat lengkap |
| Item | Nama (dipotong) + qty x harga | + subtotal per baris rapi | + deskripsi detail per item |
| Info tambahan | — | Nama kasir | + info tiket (keluhan, diagnosis, teknisi), syarat & ketentuan, kolom tanda tangan |
| Footer | Total saja | + catatan singkat (mis. "Garansi 7 hari") | + kebijakan garansi lengkap |

Tenant bisa mulai dari template default ini lalu modifikasi lewat UI (lihat [08-ui-ux.md](./08-ui-ux.md) bagian "Pengaturan Printer").

## Preview WYSIWYG

- **Thermal**: preview dirender sebagai blok monospace dengan lebar karakter PERSIS sama seperti hasil cetak asli (umumnya 32 karakter/baris untuk 58mm, 48 untuk 80mm) — line-break yang muncul di preview akan identik dengan yang tercetak.
- **A4**: preview adalah render HTML/CSS yang SAMA PERSIS dengan yang dikirim ke `window.print()`, ditampilkan dalam container berproporsi A4. Tidak ada mockup terpisah.

## Jenis Dokumen & Assignment ke Printer (Konfigurasi Bebas)

Tiga tabel di `db/schema.ts` yang bekerja sama:

| Tabel | Fungsi |
|---|---|
| `printer_devices` | Printer fisik yang terdaftar per cabang (nama, jenis koneksi, ukuran kertas) |
| `printer_templates` | Layout per kombinasi `document_type` + `paper_size` (mis. "Struk 80mm", "Label Garansi 58mm", "Invoice A4") |
| `printer_assignments` | Untuk 1 cabang, `document_type` tertentu diarahkan ke `printer_device` mana |

Ini yang membuat konfigurasi jadi bebas seperti yang diminta:
- **Mau 1 printer untuk semua jenis dokumen?** Isi semua baris `printer_assignments` di cabang itu dengan `printer_device_id` yang sama.
- **Mau label ke printer A, invoice ke printer B?** Isi baris `printer_assignments` dengan `printer_device_id` yang berbeda per `document_type`.

Tidak ada flag/mode khusus "single printer" di skema — itu murni hasil dari isi data, sehingga tidak butuh logic bercabang di kode.

## Komponen Python Agent (Khusus Thermal)

| Komponen | Pilihan | Catatan |
|---|---|---|
| Server lokal | Flask | Lebih simpel dari FastAPI untuk kebutuhan sesederhana ini |
| Library printer | `python-escpos` | Mendukung koneksi USB, Network, dan Serial ke printer ESC/POS |
| Endpoint | `POST /print` | Body memuat `document_type` + data terkait; agent memilih rendering sesuai `document_type` |
| Scope jaringan | **Hanya localhost** | Agent tidak boleh menerima koneksi dari luar komputer kasir tersebut |

## Contoh Payload

```json
POST http://localhost:5000/print
{
  "document_type": "receipt",
  "printer_template_id": "uuid-template-struk-80mm",
  "transaction_id": "TCK-00123",
  "branch_name": "Cabang Utama",
  "items": [
    { "description": "Ganti LCD", "qty": 1, "price": 350000 },
    { "description": "Jasa Servis", "qty": 1, "price": 50000 }
  ],
  "total": 400000,
  "payment_method": "qris"
}
```

Response:
```json
{ "status": "success" }
```

## Distribusi ke Komputer Kasir

1. Kemas agent jadi satu file executable memakai **PyInstaller** (`pyinstaller --onefile printer_agent.py`).
2. Set agar berjalan otomatis saat komputer kasir menyala.
3. Saat setup pertama kali, admin cabang mendaftarkan device (nama, jenis koneksi, ukuran kertas) lewat layar Pengaturan Printer — tersimpan sebagai baris baru di `printer_devices`.

## Keamanan

- Agent hanya mendengarkan di `127.0.0.1` (localhost), tidak pernah diekspos ke jaringan luar.
- Tidak menyimpan data transaksi secara permanen — hanya proses cetak, lalu selesai.
- Token statis sederhana di header request (opsional) untuk mencegah pemanggilan tidak sengaja dari tab browser lain.

## Prinsip untuk AI Agent

1. Jangan gabungkan logic printer thermal ke backend Hono — tetap jadi service Python terpisah yang berjalan lokal.
2. A4 TIDAK lewat Python agent — pakai `window.print()` di SvelteKit langsung.
3. Kode render template (yang menghasilkan tampilan preview maupun payload cetak) harus 1 fungsi/modul yang sama, dipanggil dari 2 tempat (preview UI dan proses cetak) — jangan duplikasi logic render.
4. Menambah jenis dokumen baru (mis. "Nota Servis") = tambah baris baru di `printer_templates` dengan `document_type` baru, bukan bikin sistem terpisah.
5. Editor template tidak boleh punya kemampuan menulis ke tabel data transaksi (`pos_transactions`, `service_tickets`, dst.) — hanya boleh menulis ke `printer_templates.layout_config`.
