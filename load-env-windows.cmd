@echo off
rem Loads local secrets and settings without replacing values already set in CMD.
if not exist "%~dp0.env" exit /b 0

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~dp0.env") do (
  if not defined %%A set "%%A=%%B"
)
exit /b 0
