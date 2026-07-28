@echo off
:: Ensure working directory is the folder where this batch file lives
cd /d "%~dp0"

:: Ensure Node.js is in PATH if installed in standard location
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================
echo Starting Lab Sample Intake Portal Services
echo ===================================================

:: 1. Ensure Docker Postgres is running
echo [1/3] Verifying PostgreSQL container...
docker start lab-postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating and starting new database container on port 5433...
    docker run -d --name lab-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lab_sample_intake -p 5433:5432 postgres:15
) else (
    echo Database container is up.
)

:: 2. Start Python FastAPI backend in a separate command window
echo [2/3] Launching FastAPI Backend on port 8000...
start "Lab Intake Backend API" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && set PYTHONPATH=.&& python -m uvicorn app.main:app --reload --port 8000"

:: 3. Start Next.js frontend in a separate command window
echo [3/3] Launching Next.js Frontend on port 3000...
start "Lab Intake Frontend Web App" cmd /k "cd /d "%~dp0frontend" && set "PATH=C:\Program Files\nodejs;%%PATH%%" && npm run dev"

echo ===================================================
echo Services launched. Please visit: http://localhost:3000
echo ===================================================
pause
