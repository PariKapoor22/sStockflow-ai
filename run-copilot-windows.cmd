@echo off
setlocal
call "%~dp0load-env-windows.cmd"
cd /d "%~dp0services\copilot-service"
if not defined AUTH_DISABLED_FOR_LOCAL set AUTH_DISABLED_FOR_LOCAL=true
if not defined DEV_TENANT_ID set DEV_TENANT_ID=TEN-ACME-PHARMA
if not defined COPILOT_HOST set COPILOT_HOST=127.0.0.1
if not defined COPILOT_PORT set COPILOT_PORT=8300
where uv >nul 2>nul
if errorlevel 1 (
  echo ERROR: uv is not available on PATH.
  exit /b 1
)
call uv sync
if errorlevel 1 exit /b 1
echo Starting StockFlow Copilot on http://%COPILOT_HOST%:%COPILOT_PORT%
call uv run uvicorn stockflow_copilot.main:app --host %COPILOT_HOST% --port %COPILOT_PORT%
