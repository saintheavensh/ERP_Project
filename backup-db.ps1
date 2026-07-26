# ============================================================
#  FlowServ — backup database (pg_dump), B2.7
#  Membuat 1 file backup ber-timestamp di folder backups\,
#  lalu menghapus backup lebih tua dari 14 hari.
#
#  Jalankan manual : backup-db.bat  (double-click)
#  Jadwalkan harian (contoh jam 22:00), jalankan sekali di PowerShell admin:
#    schtasks /Create /SC DAILY /ST 22:00 /TN "FlowServ Backup" ^
#      /TR "powershell -NoProfile -ExecutionPolicy Bypass -File `"%CD%\backup-db.ps1`""
#
#  Restore ke DB kosong:
#    createdb -U postgres flowserv_restore
#    pg_restore -h localhost -p 5432 -U postgres -d flowserv_restore --clean --if-exists <file.dump>
# ============================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# --- Baca DATABASE_URL dari flowserv-api\.env (tidak di-hardcode) ---
$envFile = Join-Path $root 'flowserv-api\.env'
if (-not (Test-Path $envFile)) { throw "Tidak menemukan $envFile" }
$dbLine = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $dbLine) { throw "DATABASE_URL tidak ada di .env" }
$dbUrl = ($dbLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"')

# --- Parse postgres://user:pass@host:port/dbname ---
if ($dbUrl -notmatch '^postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
  throw "Format DATABASE_URL tidak dikenali"
}
$pgUser = $matches[1]; $pgPass = $matches[2]; $pgHost = $matches[3]; $pgPort = $matches[4]; $pgDb = $matches[5]

# --- Cari pg_dump (PATH dulu, lalu folder instalasi PostgreSQL) ---
$pgDump = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
if (-not $pgDump) {
  $pgDump = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $pgDump) { throw "pg_dump tidak ditemukan (install PostgreSQL atau tambahkan ke PATH)" }

# --- Output ber-timestamp (format custom -Fc, aman untuk pg_restore) ---
$backupDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $backupDir "$pgDb-$stamp.dump"

Write-Host "Backup '$pgDb' -> $outFile ..." -ForegroundColor Cyan
$env:PGPASSWORD = $pgPass
try {
  & $pgDump -h $pgHost -p $pgPort -U $pgUser -d $pgDb -Fc -f $outFile
  if ($LASTEXITCODE -ne 0) { throw "pg_dump gagal (exit $LASTEXITCODE)" }
} finally {
  $env:PGPASSWORD = $null
}

$sizeKB = [math]::Round((Get-Item $outFile).Length / 1KB, 1)
Write-Host "OK: $outFile ($sizeKB KB)" -ForegroundColor Green

# --- Prune backup > 14 hari ---
$keepDays = 14
Get-ChildItem $backupDir -Filter "$pgDb-*.dump" -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$keepDays) } |
  ForEach-Object { Write-Host "Hapus backup lama: $($_.Name)"; Remove-Item $_.FullName -Force }
