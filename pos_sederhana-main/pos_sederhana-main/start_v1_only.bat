@echo off
title POS New Majmu - Production (Python)

echo ========================================================
echo   POS New Majmu - Starting Production (V1)...
echo ========================================================
echo.

:: Kill Port 8080 (V1)
echo Cleaning up existing server processes on port 8080...
:KILL_LOOP
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Killing vite process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":8080" | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 goto KILL_LOOP
echo Port 8080 is clean.

cd /d "%~dp0"

:: Gunakan Windows Terminal (wt.exe) untuk membuka tab terpisah
echo.
echo Membersihkan proses python lama agar kode baru aktif...
taskkill /F /IM python.exe /T 2>nul

:: Menghapus log lama agar encoding UTF-8 bersih dan file tidak membengkak
if exist pos_server.log del pos_server.log
if exist print_engine.log del print_engine.log

:: Menjalankan Windows Terminal dengan 4 Tab
:: Tab 1: Python Backend, Tab 2: Svelte Frontend, Tab 3: Hono Backend, Tab 4: Printer Logs
:: Buat file log jika belum ada agar Get-Content tidak error
if not exist print_engine.log type nul > print_engine.log

powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).Run('wt new-tab -d \"%~dp0.\" --title POS_Backend cmd /k python server.py ; new-tab -d \"%~dp0frontend\" --title POS_Frontend cmd /k npm run dev ; new-tab -d \"%~dp0backend\" --title POS_Database cmd /k npm run dev ; new-tab -d \"%~dp0.\" --title Printer_Logs powershell -Command Get-Content -Path print_engine.log -Wait -Tail 10', 7)"

if %ERRORLEVEL% neq 0 (
    echo Gagal meluncurkan Windows Terminal. Pastikan aplikasi terinstal.
    pause
)
exit
