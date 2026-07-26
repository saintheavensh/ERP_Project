# ============================================================
#  FlowServ — peluncur satu-klik untuk PILOT (LAN)
#  Menyalakan: API (0.0.0.0:3001) + Web (vite --host) + Printer Agent,
#  dan mengarahkan browser klien ke API lewat IP LAN supaya HP/tablet
#  di WiFi yang sama bisa dipakai. Postgres dianggap sudah jalan.
#
#  Jalankan lewat: start-flowserv.bat  (double-click)
#  Login: admin@demo.com / admin123
# ============================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# --- Deteksi IPv4 LAN privat (lewati loopback/APIPA) ---
$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -match '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))\.' } |
  Select-Object -First 1 -ExpandProperty IPAddress
if (-not $ip) { $ip = 'localhost' }

Write-Host "IP LAN terdeteksi: $ip" -ForegroundColor Cyan

# --- Peringatan Postgres (best-effort; tidak menghentikan) ---
$pg = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $pg) {
  Write-Host "PERINGATAN: PostgreSQL (localhost:5432) sepertinya belum jalan. Nyalakan dulu servisnya." -ForegroundColor Yellow
}

# Repo path tidak mengandung spasi, jadi tak perlu kutip di dalam perintah cmd.
$apiCmd   = "cd /d $root\flowserv-api && npm run dev"
# Port web dipaksa (--strictPort) supaya URL yang dicetak di bawah SELALU benar,
# tidak bergeser ke 5174/5175 saat 5173 dipakai aplikasi lain. set VAR tanpa
# spasi sebelum && supaya nilai URL tidak kebawa spasi.
# Port khusus FlowServ (bukan 5173 default vite) supaya tak bentrok dengan
# aplikasi lain yang mungkin memakai 5173/5174 di mesin yang sama.
$webPort  = 5188
$webCmd   = "cd /d $root\flowserv-web && set PUBLIC_API_URL=http://${ip}:3001&& npm run dev -- --host --port $webPort --strictPort"

$agentExe = Join-Path $root 'printer-agent\dist\printer-agent.exe'
if (Test-Path $agentExe) {
  $agentCmd = "cd /d $root\printer-agent\dist && printer-agent.exe"
} else {
  $agentCmd = "cd /d $root\printer-agent && python printer_agent.py"
}

Write-Host "Membuka 3 jendela: API, Web, Printer Agent..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList '/k', $apiCmd
Start-Process cmd -ArgumentList '/k', $webCmd
Start-Process cmd -ArgumentList '/k', $agentCmd

Write-Host ""
Write-Host "=== FlowServ berjalan ===" -ForegroundColor Green
Write-Host "Di komputer ini : http://localhost:$webPort"
Write-Host "Dari HP/tablet  : http://${ip}:$webPort   (WiFi yang sama)"
Write-Host "Cek API         : http://${ip}:3001/v1/health"
Write-Host "Printer agent   : http://localhost:9100/health"
Write-Host ""
Write-Host "Login: admin@demo.com / admin123"
Write-Host "Kalau jendela Web menampilkan error 'Port $webPort is in use', tutup"
Write-Host "aplikasi lain yang memakai port itu lalu jalankan ulang."
