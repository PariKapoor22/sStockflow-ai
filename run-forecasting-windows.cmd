@echo off
setlocal
cd /d "%~dp0services\forecasting-service"
where uv >nul 2>nul
if errorlevel 1 (
  echo ERROR: uv is not available on PATH.
  pause
  exit /b 1
)
call uv sync
if errorlevel 1 (
  pause
  exit /b 1
)
echo ============================================================
echo StockFlow StatsForecast Challenger Service
echo ============================================================
echo Health: http://127.0.0.1:8101/health
echo API docs: http://127.0.0.1:8101/docs
echo.
call uv run uvicorn stockflow_forecasting.main:app --host 127.0.0.1 --port 8101
