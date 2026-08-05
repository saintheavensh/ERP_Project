# Menjalankan FlowServ dengan Docker

> Berkas yang **sama** dipakai di komputer lokal dan di VPS. Itu seluruh gunanya:
> kalau lokal jalan, VPS jalan — karena yang dijalankan memang gambar yang sama
> persis, bukan "mirip".

---

## Versi Node

**Node 24 (LTS aktif).** Dipakai di kedua Dockerfile dan dicatat di `.nvmrc`.

⚠️ **Node yang terpasang di komputer ini v25.1.0, dan itu BUKAN LTS.** Node
bernomor **ganjil** (23, 25, …) adalah rilis "Current" — umurnya pendek dan tidak
pernah naik jadi LTS. Kalau `npm run dev` di root berperilaku aneh, memasang
**Node 24 LTS** hampir pasti jawabannya:

```
nvm install 24 && nvm use 24     # atau unduh dari nodejs.org, pilih "LTS"
```

Di dalam Docker ini tidak jadi soal — kontainer selalu memakai Node 24, apa pun
yang terpasang di komputer Anda.

---

## Pertama kali (lokal maupun VPS)

```bash
cp .env.example .env
```

Isi tiga nilai yang **wajib**. Compose menolak jalan tanpa ketiganya — sengaja,
supaya tidak ada yang menyala dengan kata sandi kosong:

```bash
# kata sandi database
openssl rand -base64 24

# kunci penanda tangan token login
openssl rand -base64 48
```

| Variabel | Isi |
|---|---|
| `POSTGRES_PASSWORD` | hasil perintah pertama |
| `JWT_SECRET` | hasil perintah kedua |
| `PUBLIC_API_URL` | `http://localhost/api` (lokal) atau `https://toko-anda.com/api` (VPS) |

Lalu:

```bash
docker compose up -d --build
```

Bangunan pertama memakan beberapa menit (mengunduh Node, Postgres, Nginx).
Sesudahnya jauh lebih cepat — lapisan dependensi dipakai ulang selama
`package-lock.json` tidak berubah.

Aplikasi terbuka di **http://localhost** (port 80, lewat Nginx).

### Mengisi data awal

Database yang baru dibuat masih kosong. Untuk data contoh (tenant demo, 4 peran,
akun uji, katalog device):

```bash
docker compose exec api npm run db:push
docker compose exec api npm run db:seed
```

⚠️ **Jangan `db:reset` di VPS.** Perintah itu MENGHAPUS seluruh skema lalu
membuatnya ulang. Ia menolak jalan kecuali `DATABASE_URL` memuat `localhost`, dan
penjaga itu memang ada untuk momen ini.

---

## Perintah harian

```bash
docker compose ps                  # apa saja yang hidup
docker compose logs -f api         # log API
docker compose logs -f web
docker compose restart api
docker compose down                # matikan (data TETAP aman di volume)
docker compose up -d --build       # setelah menarik kode baru
```

---

## HTTPS (hanya di VPS, butuh domain)

Arahkan domain Anda ke IP VPS lebih dulu, tunggu DNS-nya jadi, baru:

```bash
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
    -d toko-anda.com --email anda@email.com --agree-tos --no-eff-email
```

Lalu buka `deploy/nginx.conf`, hapus tanda komentar pada blok `listen 443` dan
pada pengalihan `return 301`, ganti `toko-anda.com`, dan:

```bash
docker compose restart nginx
```

Perpanjangan (sertifikat Let's Encrypt berumur 90 hari) — pasang di cron bulanan:

```bash
docker compose run --rm certbot renew && docker compose restart nginx
```

---

## Cadangan

```bash
sh deploy/backup.sh
```

Di VPS, pasang di cron:

```
0 2 * * * cd /opt/flowserv && sh deploy/backup.sh >> /var/log/flowserv-backup.log 2>&1
```

Skripnya **memeriksa hasilnya** — berkas gzip yang rusak atau di bawah 1 KB
dihapus dan dilaporkan gagal. Cadangan yang tidak pernah diperiksa bukan cadangan.

---

## Printer TETAP di PC toko

Agen printer Python (`printer-agent/`) **tidak dijalankan di VPS** dan tidak ada
di `docker-compose.yml`. Ia harus berada di komputer yang tersambung ke printer
fisik, karena ia bicara langsung ke spooler Windows.

Alurnya tetap sama setelah pindah ke VPS: browser kasir memanggil
`127.0.0.1:9100` di komputernya sendiri. Halaman HTTPS yang memanggil
`http://127.0.0.1` **tidak** diblokir sebagai mixed content — browser
memperlakukan `localhost`/`127.0.0.1` sebagai asal tepercaya.

---

## Kebutuhan VPS

| | |
|---|---|
| RAM | **1 GB cukup**, 2 GB nyaman |
| Disk | 20–25 GB |
| CPU | 1 vCPU untuk satu toko |
| OS | Debian/Ubuntu + Docker Engine |

Perkiraan pemakaian RAM: Postgres ±100 MB (sudah disetel untuk mesin kecil di
`docker-compose.yml`), API ±150 MB, Web ±150 MB, Nginx ±20 MB, OS ±150 MB.
Batas memori tiap layanan ditulis eksplisit di `docker-compose.yml`.

---

## Yang BELUM diuji, dan harus diuji sebelum dipercaya

Docker Desktop tidak bisa menyala saat berkas-berkas ini ditulis, jadi:

- [ ] `docker compose up -d --build` benar-benar berhasil dari nol
- [ ] Aplikasi terbuka di `http://localhost` dan **bisa login**
- [ ] Halaman yang dirender server (SSR) memuat datanya — ini yang membuktikan
      pemisahan `API_URL` (internal) vs `PUBLIC_API_URL` (browser) sudah benar
- [ ] Terima unit → cetak → POS berjalan di dalam Docker
- [ ] `sh deploy/backup.sh` menghasilkan berkas yang lolos pemeriksaan
- [ ] HTTPS di VPS sungguhan (butuh domain + IP publik)

Yang **sudah** diverifikasi tanpa Docker: `docker compose config` sah dan menolak
`.env` yang belum diisi; build produksi SvelteKit dengan `adapter-node` berhasil;
`JWT_SECRET` benar-benar mematikan server di `NODE_ENV=production` bila kosong,
dan tetap longgar di dev.
