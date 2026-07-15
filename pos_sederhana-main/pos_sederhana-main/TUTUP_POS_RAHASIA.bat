@echo off
chcp 65001 >nul
title POS New Majmu - Mematikan Server
echo ========================================================
echo   POS New Majmu - Menutup Server...
echo ========================================================
echo.

echo   Mencari proses server di port 8080 (V1)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo   Server V1 ditemukan! Membunuh proses PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo   Mencari proses server di port 3000 (V2 API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   Server V2 API ditemukan! Membunuh proses PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo   Mencari proses server di port 5173 (V2 Web)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo   Server V2 Frontend ditemukan! Membunuh proses PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo   Server V1 dan V2 berhasil dimatikan.

echo.
echo   Semua layanan Kasir POS telah dihentikan.
echo   Jendela ini akan tertutup otomatis.
timeout /t 3 >nul
exit
