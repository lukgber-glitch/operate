@echo off
echo Starting Chrome with remote debugging on port 9222...
echo.
echo IMPORTANT: This will open Chrome. DO NOT close it until tests complete!
echo.

REM Kill existing Chrome instances
taskkill /F /IM chrome.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Chrome with remote debugging
start chrome --remote-debugging-port=9222 --user-data-dir=%USERPROFILE%\test-browser-profile https://operate.guru

echo.
echo Chrome started! Waiting 5 seconds for it to initialize...
timeout /t 5 /nobreak

echo.
echo Running BATCH 02 tests...
node run-batch02-public.js

echo.
echo Tests complete! Check the results above.
echo Press any key to close Chrome and exit...
pause >nul

taskkill /F /IM chrome.exe 2>nul
