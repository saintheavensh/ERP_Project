@echo off
REM Starts the FlowServ printer agent (dist\printer-agent.exe) in the background.
REM Manual only -- NOT registered to autorun at Windows boot. Run this .bat
REM whenever you want the agent up during development; run stop-agent.bat when
REM you're done. For a cashier machine's permanent setup, see the "auto-start
REM on boot" note in README.md instead.

setlocal
set AGENT_DIR=%~dp0
set AGENT_EXE=%AGENT_DIR%dist\printer-agent.exe

tasklist /FI "IMAGENAME eq printer-agent.exe" 2>NUL | find /I "printer-agent.exe" >NUL
if %ERRORLEVEL%==0 (
    echo Printer agent is already running.
    goto :end
)

if not exist "%AGENT_EXE%" (
    echo ERROR: %AGENT_EXE% not found.
    echo Build it first from printer-agent\:
    echo   python -m PyInstaller --onefile --name printer-agent --collect-data escpos printer_agent.py
    goto :end
)

echo Starting printer agent...
start "FlowServ Printer Agent" /MIN "%AGENT_EXE%"

timeout /t 2 /nobreak >NUL
curl -s -o NUL -w "" http://127.0.0.1:9100/health 2>NUL
if %ERRORLEVEL%==0 (
    echo Printer agent started. Listening on http://127.0.0.1:9100
) else (
    echo Started, but health check did not respond yet. Give it a moment and check http://127.0.0.1:9100/health
)
echo This window can be closed -- the agent keeps running in the background.
echo Use stop-agent.bat to stop it.

:end
pause
