@echo off
echo ========================================
echo BROWSER-UI TEST: Settings Pages
echo ========================================
echo.
echo This will open a browser window.
echo PLEASE LOG IN MANUALLY when it opens.
echo.
echo Instructions:
echo 1. Browser will open to login page
echo 2. Click "Sign in with Google"
echo 3. Enter: luk.gber@gmail.com
echo 4. Enter password: schlagzeug
echo 5. Wait for dashboard to load
echo.
echo The test will detect login and continue automatically.
echo.
pause
node RUN_SETTINGS_TEST.js
pause
