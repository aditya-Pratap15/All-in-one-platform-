@echo off
chcp 65001 >nul
title OmniDownloader High-Speed Engine
color 0A

:: Ensure the working directory is always this folder
cd /d "%~dp0"

echo ========================================================
echo        OmniDownloader High-Speed Local Engine
echo ========================================================
echo.
echo   Supports 100%% unrestricted instant downloads for:
echo   - YouTube Shorts
echo   - Instagram Reels
echo   - Facebook Reels
echo   - Kuaishou / Kwai
echo   - TikTok
echo.
echo   Opening OmniDownloader in your browser...
echo   Engine running at: http://127.0.0.1:8000
echo   Keep this small window open while downloading videos.
echo ========================================================
echo.

:: Automatically open index.html in default browser
start "" "%~dp0index.html"

:: Launch local engine using uv
"%USERPROFILE%\.local\bin\uv.exe" run --with yt-dlp --with fastapi --with uvicorn python "%~dp0server.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo High-speed engine stopped.
)

pause
