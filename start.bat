@echo off
chcp 65001 >nul
title OmniDownloader High-Speed Engine
color 0A

:: Ensure working directory is this folder
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
echo   Opening OmniDownloader in your Web Browser...
echo   Engine running at: http://127.0.0.1:8000
echo   Keep this small window open while downloading videos.
echo ========================================================
echo.

:: Open the website directly in the user's web browser (never LibreOffice)
start http://127.0.0.1:8000

:: Run the high-speed local engine
"%USERPROFILE%\.local\bin\uv.exe" run --with yt-dlp --with fastapi --with uvicorn python "%~dp0server.py"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo High-speed engine stopped.
)

pause
