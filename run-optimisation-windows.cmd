@echo off
setlocal
cd /d "%~dp0services\optimisation-service"
where uv >nul 2>nul
if errorlevel 1 (
  echo ERROR: uv is required. Install it with: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 ^| iex"
  exit /b 1
)
echo Starting StockFlow decision intelligence on http://localhost:8102
uv run uvicorn stockflow_optimisation.main:app --host 127.0.0.1 --port 8102 --reload
