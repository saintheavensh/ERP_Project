# SIJA-INVENTORY Frontend

Aplikasi Manajemen Inventaris dan Layanan Servis berbasis role. Dibangun menggunakan Svelte 5 (Runes) dan SvelteKit.

## Fitur Utama & Roles
- **Super Admin / Owner**: Analitik lengkap, manajemen user, approval.
- **Manager**: Pengelolaan produk (CRUD, pricing), batch updating.
- **Warehouse**: Manajemen stok fisik, lokasi, cetak label barcode, stock opname.
- **Teknisi**: Katalog sparepart, permintaan barang.
- **Kasir**: Modul Point of Sales (POS), tracking pembayaran.

---

## 🚀 Cara Install

1. Pastikan Anda sudah menginstall [Bun](https://bun.sh/) atau Node.js.
2. Clone repository ini.
3. Masuk ke folder aplikasi frontend:
   ```bash
   cd apps/frontend
   ```
4. Install semua dependensi:
   ```bash
   bun install
   ```

---

## 🔐 Environment Variables

Aplikasi ini membutuhkan file environment untuk berjalan. Copy `.env.example` ke `.env` (untuk development) atau buat file `.env.production` (untuk production).

| Variable | Deskripsi | Default Pengembangan |
|---|---|---|
| `PUBLIC_API_URL` / `VITE_API_BASE_URL` | Base URL Backend API | `http://localhost:4000` |
| `PUBLIC_SENTRY_DSN` | DSN Key untuk Sentry Error Tracking | - |
| `PUBLIC_APP_ENV` | Mode Environment (`development` / `production`) | `development` |

---

## 🛠️ API Integration

Frontend ini berkomunikasi secara terpusat dengan backend melalui service layer yang berada di `src/lib/features/*/services/`. 

Metode API terpusat digunakan melalui instance Axios (`src/lib/shared/lib/api-client.ts`). Interceptor secara otomatis akan menghandle token JWT dari cookie (karena `withCredentials: true`) dan redirect ke `/login` apabila respons `401 Unauthorized`.

### Endpoints Utama yang Digunakan
1. **Auth**: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
2. **Products**: `/api/products` (GET, POST, PATCH, DELETE), `/api/products/bulk`
3. **Inventory**: `/api/inventory/stock`, `/api/inventory/locations`

### Contoh Request & Response

#### Request Mengambil Data Parts (Teknisi)
```typescript
import { api } from '$lib/shared/lib/api-client';

const response = await api.get('/products', {
    params: { category: 'sparepart', limit: 50 }
});
```

#### Contoh Response Sukses
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "123",
        "name": "Baterai iPhone 11",
        "sku": "SP-IP11-BAT",
        "price": 250000,
        "stock": 10
      }
    ],
    "total": 1
  }
}
```

---

## 🚢 Deployment Steps

Aplikasi ini menggunakan Vite build process dengan performa yang dioptimasi (Lazy Loaded Components).

1. Persiapkan build environment:
   ```bash
   # Pastikan .env.production sudah dibuat dan public variable sudah distel
   PUBLIC_API_URL=https://api.yourdomain.com
   PUBLIC_SENTRY_DSN=your-sentry-dsn
   PUBLIC_APP_ENV=production
   ```

2. Lakukan Type-Checking dan Build Production:
   ```bash
   bun run check
   bun run build:prod
   ```

3. Preview Build secara lokal:
   ```bash
   bun run preview
   ```

4. **Upload/Deploy**: 
   Hasil kompilasi akan berada di dalam folder `build/` atau `.svelte-kit/output/` tergantung adapter SvelteKit yang digunakan. Anda bisa mendelploy aplikasi ke Node server, Vercel, Netlify, atau Cloudflare Pages.

---

## 🚑 Troubleshooting

- **Error: 401 Unauthorized secara beruntun**
  Pastikan Backend API dan Frontend berjalan pada root domain/CORS yang diizinkan untuk berbagi Cookie, atau pastikan backend tidak menghapus session di tengah jalan.
  
- **Error: "Failed to load products" di tampilan Kasir/Manager**
  Verifikasi `PUBLIC_API_URL`. Jika backend merespon HTTP 200 tetapi Payload berisi `"success": false`, AppError akan terpicu oleh interceptor. Periksa Tab Network di browser.
  
- **Component tidak merender / UI Blank saat Role berpindah**
  Fitur proteksi route di layout (Auth Guards) mungkin belum mendeteksi sesi baru. Pastikan koneksi internet stabil (Pengecekan API `/auth/me`). Jika blank persisten, bersihkan LocalStorage dan reload.

- **Performa Tabel melambat (Warehouse / Manager) saat data banyak**
  Tabel ini telah dioptimasi dengan Lazy Loading. Namun jika perangkat client memiliki resource RAM terbatas saat meload thousands of items, pertimbangkan untuk mengirim query parameter `limit` dan menggunakan Pagination ketimbang un-paginated layout.
