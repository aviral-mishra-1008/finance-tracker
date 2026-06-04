@echo off
set PROJECT_ROOT=A:\Finance Tracker
set LOG_DIR=%PROJECT_ROOT%\logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

cd /d "%PROJECT_ROOT%\backend"
call venv\Scripts\activate
start /b uvicorn main:app --host 0.0.0.0 --port 8000 >> "%LOG_DIR%\backend.log" 2>&1

cd /d "%PROJECT_ROOT%\frontend"
start /b npx serve -s dist -l 3000 >> "%LOG_DIR%\frontend.log" 2>&1