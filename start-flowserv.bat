@echo off
REM ============================================================
REM  FlowServ — peluncur satu-klik PILOT (LAN)
REM  Double-click file ini. Menyalakan API + Web + Printer Agent
REM  dan mencetak URL untuk diakses dari HP/tablet di WiFi sama.
REM  (Pastikan PostgreSQL sudah jalan.)
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-flowserv.ps1"
pause
