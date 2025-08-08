@echo off
echo Restarting Qlib Backend...

REM Kill any existing backend processes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :800') do (
    echo Stopping process %%a
    taskkill /F /PID %%a 2>nul
)

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start backend
cd backend
echo Starting backend server...
python app.py

pause