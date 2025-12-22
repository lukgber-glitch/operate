@echo off
echo ===============================================
echo E2E LOGIN AND CHAT TEST
echo ===============================================
echo.
echo This test will:
echo 1. Open browser to login page
echo 2. Login with test@operate.guru
echo 3. Navigate to /chat page
echo 4. Check for errors
echo 5. Take screenshots
echo.
echo Press Ctrl+C to cancel, or
pause
node e2e-chat-test.js
