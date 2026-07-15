@echo off
title POS New Majmu - Stop All

echo ========================================================
echo   Stopping ALL Servers (V1 & V2)...
echo ========================================================
echo.

:: Stop Port 8080 (V1 Python)
echo Stopping port 8080 (Python)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Stop Port 3000 (V2 API)
echo Stopping port 3000 (API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Stop Port 5173 (V2 Web)
echo Stopping port 5173 (Web)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo SUCCESS: All servers stopped (8080, 3000, 5173).
timeout /t 3 >nul
exit
