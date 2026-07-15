@echo off
title Toko HP - Shutdown
color 0C

echo ============================================
echo   STOPPING TOKO HP SERVERS
echo ============================================
echo.

:: Kill Node/Bun processes running the servers
taskkill /f /im "bun.exe" >nul 2>nul
taskkill /f /im "node.exe" >nul 2>nul

echo [OK] All servers stopped.
echo.
timeout /t 2 /nobreak >nul
