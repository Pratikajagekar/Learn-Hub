@echo off
REM One-click start for Windows
cd /d "%~dp0"
if not exist node_modules goto install
if not exist server\node_modules goto install
if not exist client\node_modules goto install
goto run
:install
echo Installing dependencies (first run only)...
call npm run setup
if errorlevel 1 exit /b 1
:run
call npm run dev
