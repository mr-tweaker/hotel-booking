@echo off
echo Starting BookingHours...
echo.

REM Check if Backend dependencies are installed
if not exist "Backend\node_modules" (
    echo Installing Backend dependencies...
    cd Backend
    call npm install
    cd ..
)

echo Starting Backend server on http://localhost:4000...
start "Backend Server" cmd /k "cd Backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend server on http://localhost:5500...
echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:5500
echo.
echo Close this window to stop both servers
echo.

cd Frontend
python -m http.server 5500
if errorlevel 1 (
    python3 -m http.server 5500
)

