@echo off
title OmniDownloader - Setup Daily 6:30 PM Task Scheduler
cd /d "%~dp0"
echo ===============================================================
echo   Setup Daily 6:30 PM Google Drive Downloader on Windows
echo ===============================================================
echo.
echo This will schedule OmniDownloader to run every day at 6:30 PM
echo on your local PC (Residential IP = Zero YouTube Bot Blocks).
echo.

set SCRIPT_PATH=%~dp0run_batch_drive.bat
schtasks /create /tn "OmniDownloaderDailyDriveBatch" /tr "\"%SCRIPT_PATH%\"" /sc daily /st 18:30 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================
    echo [SUCCESS] Task "OmniDownloaderDailyDriveBatch" created!
    echo It will automatically run every day at 6:30 PM (18:30).
    echo ===============================================================
) else (
    echo.
    echo [!] If this failed, please right-click this batch file and "Run as Administrator".
)

echo.
pause
