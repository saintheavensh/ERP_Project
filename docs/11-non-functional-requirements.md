# Non-Functional Requirements

## Multi-Tenancy & Isolasi Data

- Setiap request wajib membawa identitas tenant lewat token autentikasi (JWT claim), **tidak pernah** dari parameter yang dikirim client.
- Setiap query database wajib difilter `tenant_id` di level aplikasi (ORM middleware/interceptor), **dan** diperkuat dengan Row-Level Security di database sebagai lapisan kedua (defense in depth).
- Tidak ada tabel/endpoint yang mengembalikan data lintas tenant, kecuali eksplisit untuk Platform Super Admin.

## Keamanan

- Password di-hash (bcrypt/argon2), tidak pernah disimpan/di-log dalam bentuk plain text.
- Semua endpoint API wajib melalui permission check di level backend — **jangan hanya mengandalkan UI menyembunyikan tombol**; UI hiding bukan security boundary.
- **Audit log lintas modul (wajib, bukan opsional)**: tabel `audit_logs` mencatat setiap aksi signifikan — siapa (actor), aksi apa, di entitas mana, kapan, dari IP mana, dan detail before/after kalau relevan. Cakupan minimal: perubahan role/permission, void transaksi, adjust stok manual, approve refund, transisi stage tiket, perubahan Flow Template, perubahan pengaturan tenant. Implementasi disarankan sebagai middleware/interceptor lintas modul, bukan ditulis manual di tiap fungsi — supaya tidak ada aksi yang lolos tidak tercatat.
- Enkripsi data in-transit (TLS) wajib; enkripsi at-rest untuk data finansial/personal direkomendasikan.

## Kepatuhan Data (Konteks Indonesia)

- Karena target pengguna berbasis Indonesia, perhatikan **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** — terutama terkait consent penyimpanan data customer (nama, kontak, riwayat servis) dan hak customer untuk meminta penghapusan data.
- Kalau memungkinkan, tentukan lokasi data center (data residency) sesuai kebutuhan compliance klien enterprise.

## Skalabilitas (Target Ilustratif — Sesuaikan dengan Kebutuhan Nyata)

| Metrik | Target Awal (MVP) | Target Enterprise |
|---|---|---|
| Concurrent users per tenant | 50 | 500+ |
| Tiket servis per hari per tenant | 200 | 5.000+ |
| Response time API (p95) | < 500ms | < 300ms |
| Uptime | 99.5% | 99.9% |

*(Angka di atas adalah starting point untuk perencanaan kapasitas, bukan SLA kontraktual — sesuaikan dengan data riil setelah ada traffic.)*

## Observability

- Logging terstruktur (JSON) dengan `request_id` dan `tenant_id` di setiap log entry, supaya mudah trace masalah per tenant.
- Monitoring metrik kunci: latency API, error rate, queue depth (untuk event processing), stock discrepancy rate.
- Alerting untuk kondisi kritikal: event processing gagal/tertunda (bisa berarti Finance/Inventory tidak sinkron), permission check bypass yang tidak terduga.

## Backup & Disaster Recovery

- Backup database harian minimal, dengan retention sesuai kebutuhan audit (rekomendasi awal: 30 hari).
- Uji restore backup secara berkala (bukan cuma percaya backup berjalan tanpa pernah dites).
