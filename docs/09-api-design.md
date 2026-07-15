# API Design Principles

Dokumen ini adalah **prinsip & kontrak level tinggi**, bukan spesifikasi OpenAPI lengkap. Spesifikasi detail sebaiknya di-generate setelah tech stack final (lihat [10-tech-stack-infra.md](./10-tech-stack-infra.md)), tapi prinsip di bawah ini harus diikuti dari awal.

## Prinsip Umum

1. **RESTful, resource-based** — `/tickets`, `/inventory-items`, `/purchase-orders`, dst. Aksi non-CRUD (misal transisi stage) tetap pakai sub-resource: `POST /tickets/{id}/transition`.
2. **Tenant scoping via token, bukan URL/body** — `tenant_id` diambil dari JWT claim hasil autentikasi, TIDAK PERNAH dipercaya dari parameter yang dikirim client. Ini mencegah satu tenant mengakses data tenant lain hanya dengan mengganti ID di request.
3. **Versioning eksplisit** — prefix `/v1/...` sejak awal, supaya perubahan breaking di masa depan tidak merusak integrasi lama.
4. **Konsisten envelope response**:
   ```json
   {
     "data": { "...": "..." },
     "meta": { "request_id": "...", "timestamp": "..." },
     "error": null
   }
   ```
5. **Idempotency untuk aksi kritikal** — endpoint seperti "consume part" atau "collect payment" wajib menerima header `Idempotency-Key`, supaya retry jaringan tidak menyebabkan double-deduction stok atau double-charge.
6. **Pagination konsisten** — cursor-based untuk list endpoint bervolume besar (`stock_movement`, `ticket_stage_history`).

## Contoh Endpoint Inti

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/v1/tickets` | Buat Service Ticket baru (Intake) |
| `POST` | `/v1/tickets/{id}/transition` | Pindah ke node berikutnya (dengan validasi Transition Rule + permission) |
| `GET` | `/v1/tickets/{id}` | Detail tiket + current stage + cost breakdown |
| `POST` | `/v1/tickets/{id}/approval-requests` | Kirim permintaan approval ke customer |
| `POST` | `/v1/inventory-items/{id}/reserve` | Reserve stok untuk tiket/POS |
| `POST` | `/v1/inventory-items/{id}/consume` | Konsumsi/deduct stok (hard deduction) |
| `POST` | `/v1/purchase-orders` | Buat PO baru |
| `POST` | `/v1/pos-transactions` | Buat transaksi POS (linked atau standalone) |
| `POST` | `/v1/pos-transactions/{id}/payments` | Catat pembayaran (partial/full) |
| `GET` | `/v1/finance/reports/job-costing` | Laporan margin per tiket |
| `GET/POST` | `/v1/flow-templates` | Kelola Flow Template (admin) |
| `GET/POST` | `/v1/roles`, `/v1/permissions` | Kelola RBAC |

## Contoh Payload: Transisi Stage Tiket

Request:
```json
POST /v1/tickets/TCK-00123/transition
{
  "to_node": "customer_approval",
  "actor_id": "usr_456",
  "notes": "Estimasi biaya Rp 350.000, tunggu approval customer"
}
```

Response:
```json
{
  "data": {
    "ticket_id": "TCK-00123",
    "current_node": "customer_approval",
    "events_emitted": ["approval.requested"]
  },
  "meta": { "request_id": "req_789" },
  "error": null
}
```

## Webhook/Event Contract (untuk Integrasi Eksternal)

Karena arsitektur berbasis event (lihat [02-architecture-modular.md](./02-architecture-modular.md)), setiap event internal bisa di-expose sebagai webhook ke sistem pihak ketiga:

```json
{
  "event": "parts.consumed",
  "tenant_id": "tnt_001",
  "occurred_at": "2026-07-08T10:15:00Z",
  "payload": {
    "ticket_id": "TCK-00123",
    "inventory_item_id": "ITM-778",
    "quantity": 1,
    "cost_basis": 85000
  }
}
```

## Error Handling

- Gunakan HTTP status code standar (400 validasi, 401/403 auth/permission, 404 not found, 409 conflict/state invalid, 422 business rule violation).
- Body error konsisten:
  ```json
  { "data": null, "error": { "code": "TRANSITION_NOT_ALLOWED", "message": "Tidak bisa pindah ke stage ini dari stage saat ini" } }
  ```
- Permission check yang gagal HARUS mengembalikan 403 dengan kode `permission_denied` beserta permission apa yang kurang — membantu debugging tanpa membocorkan detail sensitif.
