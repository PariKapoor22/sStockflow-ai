@echo off
setlocal
cd /d "%~dp0services\hazard-scoring-service"
echo ============================================================
echo StockFlow Hazard Scoring Service (FastAPI)
echo ============================================================
echo Health: http://127.0.0.1:8000/health
echo API docs: http://127.0.0.1:8000/docs
echo.
python -m uvicorn stockflow_hazard.main:app --host 127.0.0.1 --port 8000 --reload
