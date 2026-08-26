@echo off
setlocal
cd /d "%~dp0"

echo Starting StockFlow from one terminal...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-all-windows.ps1"
set "STOCKFLOW_EXIT=%ERRORLEVEL%"

if not "%STOCKFLOW_EXIT%"=="0" (
  echo.
  echo StockFlow stopped with an error. Review .stockflow\logs for details.
  pause
)
exit /b %STOCKFLOW_EXIT%
