@echo off
title Toko HP - POS System
color 0A

echo ============================================
echo   TOKO HP - POS SYSTEM LAUNCHER
echo ============================================
echo.

:: Set the application directory
cd /d "%~dp0"

:: Check if bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Bun is not installed or not in PATH
    echo Please install Bun from: https://bun.sh
    pause
    exit /b 1
)

echo [1/3] Starting Backend Server...
start "Toko HP - Backend" cmd /c "cd apps\backend && bun run dev"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Server...
start "Toko HP - Frontend" cmd /c "cd apps\frontend && bun run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

echo [3/3] Opening Application in Browser...
start "" "http://localhost:5173"

echo.
echo ============================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ============================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo   To access from other devices on the same network:
echo   1. Find this computer's IP address (run 'ipconfig')
echo   2. Use: http://YOUR_IP:5173
echo.
echo   Press any key to close this launcher window...
echo   (The servers will keep running in background)
echo ============================================
pause >nul
