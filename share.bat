@echo off
:: Ensure working directory is the folder where this batch file lives
cd /d "%~dp0"

:: Ensure Node.js is in PATH if installed in standard location
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"

echo ====================================================================
echo             SAMPLE REGISTRATION PORTAL - CLOUD SHARING              
echo ====================================================================
echo.
echo Make sure start.bat is running in the background!
echo Generating free public cloud link for http://127.0.0.1:3000 ...
echo.
echo ====================================================================
echo Copy the URL printed below and send it to your boss/users:
echo ====================================================================
echo.

npx -y localtunnel --port 3000 --local-host 127.0.0.1

echo.
echo Tunnel closed.
pause
