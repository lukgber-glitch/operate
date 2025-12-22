@echo off
cls
echo ========================================
echo  HR PAGES - LIVE APP TEST
echo ========================================
echo.
echo This will test all HR pages on https://operate.guru
echo.
echo Pages to test:
echo  1. /hr/employees
echo  2. /hr/payroll
echo  3. /hr/time
echo  4. /hr/leave
echo.
echo ========================================
echo STEP 1: Starting Chrome in debug mode
echo ========================================
echo.
start chrome --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-hr" "https://operate.guru"
echo.
echo Chrome started with remote debugging on port 9222
echo.
echo ========================================
echo STEP 2: Manual Login Required
echo ========================================
echo.
echo Please login to https://operate.guru with:
echo   Email: luk.gber@gmail.com
echo   Password: Schlagzeug1@
echo.
echo After logging in, press any key to start automated testing...
pause >nul
echo.
echo ========================================
echo STEP 3: Running Automated Tests
echo ========================================
echo.
node test-hr-live.js
echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Results saved to: HR_PAGES_LIVE_TEST_RESULTS.json
echo Screenshots saved to: test-screenshots\hr-pages-live\
echo.
pause
