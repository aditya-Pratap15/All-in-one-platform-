@echo off
title OmniDownloader - Daily Drive Batch Runner
cd /d "%~dp0"
echo ===============================================================
echo   OmniDownloader - Daily Google Drive Batch Runner
echo ===============================================================
echo.

if not exist drive_config.json (
    echo [Setup] First time running locally. Please enter your Drive settings:
    echo.
    set /p WEBHOOK_INPUT="Enter your Google Apps Script Webhook URL: "
    set /p FOLDER_INPUT="Enter your Google Drive Folder URL: "
    
    powershell -Command "$cfg = @{ webhook_url = '%WEBHOOK_INPUT%'; folder_url = '%FOLDER_INPUT%' }; $cfg | ConvertTo-Json | Out-File -Encoding utf8 drive_config.json"
    echo.
    echo [✓] Settings saved to drive_config.json!
    echo.
)

set UV_EXE="%USERPROFILE%\.local\bin\uv.exe"
if exist %UV_EXE% (
    %UV_EXE% run --with yt-dlp --with requests python scripts\drive_batch_runner.py %*
) else (
    python scripts\drive_batch_runner.py %*
)

echo.
echo [Done] Finished batch process.
pause
