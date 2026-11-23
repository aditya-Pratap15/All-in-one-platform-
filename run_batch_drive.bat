@echo off
title OmniDownloader - Daily Drive Batch Runner
cd /d "%~dp0"
echo ===============================================================
echo   OmniDownloader - Daily Google Drive Batch Runner
echo ===============================================================
echo.

set UV_EXE="%USERPROFILE%\.local\bin\uv.exe"
if exist %UV_EXE% (
    %UV_EXE% run --with yt-dlp --with requests python scripts\drive_batch_runner.py %*
) else (
    python scripts\drive_batch_runner.py %*
)

echo.
echo [Done] Finished batch process.
pause
