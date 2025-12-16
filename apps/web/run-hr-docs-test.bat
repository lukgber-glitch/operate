@echo off
echo ==========================================
echo HR and Documents Module Testing
echo ==========================================
echo.
echo Starting Playwright test in headed mode...
echo Browser will open - please log in manually when prompted.
echo.
echo Email: luk.gber@gmail.com
echo Password: schlagzeug
echo.
echo ==========================================
echo.

cd /d "%~dp0"
npx playwright test e2e/hr-documents.spec.ts --headed --project=chromium

pause
