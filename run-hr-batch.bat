@echo off
echo ========================================
echo HR PAGES E2E TEST - BATCH 7
echo ========================================
echo.
echo This test will open a browser and navigate to all HR pages.
echo.
echo MANUAL LOGIN REQUIRED:
echo   Email: luk.gber@gmail.com
echo   Password: Schlagzeug1@
echo.
echo After login completes, the test will automatically visit all HR pages.
echo.
pause
node hr-test-manual-login.js
