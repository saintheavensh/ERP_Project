#!/bin/sh
# FlowServ — cadangan database harian.
#
# Pasang di VPS lewat cron, mis. tiap hari pukul 02:00:
#   0 2 * * * cd /opt/flowserv && sh deploy/backup.sh >> /var/log/flowserv-backup.log 2>&1
#
# Kenapa ini bukan hal opsional: data toko ini tidak ada di tempat lain. Tanpa
# cadangan, satu disk rusak = seluruh riwayat servis, stok, dan piutang hilang.
# PHASES.md sudah menandainya (10.5 dan 11.6) jauh sebelum baris ini ditulis.

set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Dibaca dari .env yang sama dengan yang dipakai Compose, supaya kredensialnya
# tak pernah ditulis dua kali di dua tempat yang bisa berbeda.
POSTGRES_USER=$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2-)
POSTGRES_DB=$(grep -E '^POSTGRES_DB=' .env | cut -d= -f2-)
: "${POSTGRES_USER:=flowserv}"
: "${POSTGRES_DB:=flowserv}"

OUT="$BACKUP_DIR/flowserv-$STAMP.sql.gz"

# `pg_dump` dijalankan DI DALAM kontainer db — jadi VPS tidak perlu memasang
# klien Postgres sama sekali, dan versinya dijamin cocok dengan servernya.
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$OUT"

# Cadangan yang tidak pernah diperiksa bukan cadangan. Berkas gzip yang terpotong
# (disk penuh di tengah dump) tetap terlihat "ada" di daftar berkas — pemeriksaan
# ini yang membedakannya, dan lebih baik gagal sekarang daripada ketahuan saat
# benar-benar dibutuhkan.
if ! gzip -t "$OUT"; then
  echo "GAGAL: $OUT rusak, dihapus." >&2
  rm -f "$OUT"
  exit 1
fi

SIZE=$(wc -c < "$OUT")
if [ "$SIZE" -lt 1024 ]; then
  echo "GAGAL: $OUT hanya $SIZE byte — dump-nya hampir pasti kosong." >&2
  rm -f "$OUT"
  exit 1
fi

echo "OK: $OUT ($SIZE byte)"

# Buang yang lebih tua dari KEEP_DAYS.
find "$BACKUP_DIR" -name 'flowserv-*.sql.gz' -type f -mtime "+$KEEP_DAYS" -delete

# Cara mengembalikan (JANGAN dijalankan tanpa sengaja — ini menimpa data):
#   gunzip -c backups/flowserv-XXXX.sql.gz | docker compose exec -T db \
#       psql -U flowserv -d flowserv
