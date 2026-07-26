@echo off
REM ============================================================
REM  FlowServ dev launcher
REM  Membuka API + Web di DUA terminal terpisah.
REM
REM  Kenapa tidak pakai `npm run dev` (concurrently) di root?
REM  Di Windows, `tsx watch` (server API) TIDAK jalan saat
REM  dibungkus concurrently -- proses server-nya tak pernah
REM  bind ke port 3001 (jadi hanya web yang muncul). Menjalankan
REM  tiap server di terminal-nya sendiri = cara yang andal.
REM
REM  Login: admin@demo.com / admin123  (di http://localhost:5174)
REM ============================================================
start "FlowServ API (port 3001)" cmd /k "cd /d %~dp0flowserv-api && npm run dev"
start "FlowServ Web (port 5174)" cmd /k "cd /d %~dp0flowserv-web && npm run dev"
echo Dua terminal dibuka: API (3001) + Web (5174).
echo Tunggu API mencetak "FlowServ API starting on port 3001..." sebelum login.
