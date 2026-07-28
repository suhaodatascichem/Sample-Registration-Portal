@echo off
:: Ensure working directory is the folder where this batch file lives
cd /d "%~dp0"

:: Ensure Node.js is in PATH if installed in standard location
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================
echo Sharing Lab Portal via Public Cloud Tunnel
echo ===================================================
echo Ensure start.bat is running in the background!
echo Generating shareable public link for http://localhost:3000 ...
echo ===================================================

npx ngrok http 3000
pause
