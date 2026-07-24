@echo off
REM Stops the FlowServ printer agent (all printer-agent.exe processes --
REM PyInstaller's --onefile build runs a bootloader + child process, both
REM sharing this image name, so both are stopped together).

tasklist /FI "IMAGENAME eq printer-agent.exe" 2>NUL | find /I "printer-agent.exe" >NUL
if not %ERRORLEVEL%==0 (
    echo Printer agent was not running.
    goto :end
)

taskkill /IM printer-agent.exe /F >NUL 2>&1
if %ERRORLEVEL%==0 (
    echo Printer agent stopped.
) else (
    echo Could not stop the printer agent. Try Task Manager if this keeps happening.
)

:end
pause
