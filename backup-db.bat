@echo off
REM ============================================================
REM  FlowServ — backup database (pg_dump), B2.7
REM  Double-click untuk backup manual. Hasil ada di folder backups\.
REM  Untuk jadwal harian, lihat instruksi schtasks di backup-db.ps1.
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-db.ps1"
pause
