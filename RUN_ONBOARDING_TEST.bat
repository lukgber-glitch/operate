@echo off
echo.
echo ========================================
echo   ONBOARDING FIX VERIFICATION TEST
echo ========================================
echo.
echo This test will:
echo 1. Open Chrome browser
echo 2. Navigate to operate.guru/login
echo 3. Wait for you to login manually
echo 4. Test the /onboarding page
echo 5. Check for C.map TypeError
echo 6. Generate report
echo.
echo MANUAL ACTION REQUIRED:
echo - Click Google button when browser opens
echo - Login with: luk.gber@gmail.com
echo - Password: schlagzeug
echo.
pause
echo.
echo Starting test...
echo.
node test-onboarding-fix.js
