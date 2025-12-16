@echo off
echo ================================================
echo Operate.guru Dashboard Test Suite
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if puppeteer is installed
npm list puppeteer >nul 2>&1
if errorlevel 1 (
    echo Installing Puppeteer...
    call npm install puppeteer --save-dev
    echo.
)

echo Starting test suite...
echo.
node run-dashboard-test.js

echo.
echo ================================================
echo Test Complete!
echo ================================================
echo.
echo Results saved to: test-results.json
echo Screenshots saved to: screenshots\
echo.

pause
