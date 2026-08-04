@echo off
title Ecatring - Catering Marketplace
echo ==================================================
echo   Ecatring - Catering Marketplace (PostgreSQL)
echo ==================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Navigate to backend
cd /d "%~dp0backend"

echo [1/2] Installing dependencies...
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [WARNING] Dependency check completed with warnings, attempting to proceed...
)

echo.
echo [2/2] Launching Web Application (connected to Neon PostgreSQL)...
echo.
echo ==================================================
echo   Access Web App at: http://localhost:5000
echo ==================================================
echo   Demo Login Credentials:
echo   - Admin:    admin@ecatring.com    / admin123
echo   - Caterer:  priya@spicegarden.com / caterer123
echo   - Customer: customer@demo.com     / demo1234
echo ==================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5000

python app.py
pause
