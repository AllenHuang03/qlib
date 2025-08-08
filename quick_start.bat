@echo off
echo =====================================
echo    Qlib Pro - Quick Start Script
echo =====================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [INFO] Python found
python --version

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Node.js found
node --version

echo.
echo [STEP 1] Installing backend dependencies...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [OK] Backend dependencies installed

echo.
echo [STEP 2] Starting backend server...
echo [INFO] The server will find an available port automatically
echo [INFO] Keep this window open - the backend server will run here

start "Qlib Backend" /MIN cmd /c "call venv\Scripts\activate && python app.py && pause"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

echo [STEP 3] Installing frontend dependencies...
cd ..\frontend

if not exist "node_modules" (
    echo Installing frontend packages...
    npm install >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

echo [OK] Frontend dependencies installed

echo.
echo [STEP 4] Running health check...
cd ..
python test_setup.py

if %errorlevel% equ 0 (
    echo.
    echo [STEP 5] Starting frontend...
    cd frontend
    echo [INFO] Opening browser to http://localhost:3000
    echo [INFO] Login with: demo@qlib.com / demo123
    echo.
    timeout /t 2 /nobreak >nul
    start http://localhost:3000
    npm run dev
) else (
    echo.
    echo [ERROR] Health check failed. Please check the backend server.
    pause
)