@echo off
setlocal
cd /d "%~dp0"
call "%~dp0load-env-windows.cmd"
call "%~dp0configure-maven-windows.cmd"
if errorlevel 1 (
  echo ============================================================
  echo StockFlow Core API
  echo ============================================================
  echo ERROR: Maven was not found.
  echo Expected either:
  echo   - mvn on PATH, or
  echo   - %%USERPROFILE%%\Tools\apache-maven-*\bin\mvn.cmd
  echo   - C:\Tools\apache-maven-*\bin\mvn.cmd
  pause
  exit /b 1
)

cd /d "%~dp0services\stockflow-core-api"

if not defined STATSFORECAST_ENABLED set "STATSFORECAST_ENABLED=true"
if not defined STATSFORECAST_API_URL set "STATSFORECAST_API_URL=http://127.0.0.1:8101"
if not defined STOCKFLOW_DECISION_INTELLIGENCE_ENABLED set "STOCKFLOW_DECISION_INTELLIGENCE_ENABLED=true"
if not defined STOCKFLOW_DECISION_INTELLIGENCE_URL set "STOCKFLOW_DECISION_INTELLIGENCE_URL=http://127.0.0.1:8102"

echo ============================================================
echo StockFlow Core API
echo ============================================================
echo.
echo Maven and Java used for this build:
call mvn --version
if errorlevel 1 (
  pause
  exit /b 1
)

if /I "%STOCKFLOW_SKIP_TESTS%"=="true" (
  echo.
  echo Skipping startup tests for the single-window launcher.
) else (
  echo.
  echo Running tests...
  call mvn -Dkotlin.compiler.daemon=false clean test
  if errorlevel 1 (
    echo.
    echo ERROR: Backend tests failed. The API was not started.
    pause
    exit /b 1
  )
)

echo.
echo Starting Spring Boot API on http://localhost:8080
echo StatsForecast challenger: %STATSFORECAST_API_URL%
echo Decision intelligence: %STOCKFLOW_DECISION_INTELLIGENCE_URL%
call mvn -Dkotlin.compiler.daemon=false spring-boot:run
