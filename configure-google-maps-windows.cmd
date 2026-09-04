@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\configure-google-maps-windows.ps1"
set "STOCKFLOW_EXIT=%ERRORLEVEL%"
if not "%STOCKFLOW_EXIT%"=="0" pause
exit /b %STOCKFLOW_EXIT%
