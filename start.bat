@echo off
title OmniDownloader High-Speed Engine
color 0A
echo ========================================================
echo        OmniDownloader High-Speed Local Engine
echo ========================================================
echo.
echo   Supports 100%% unrestricted instant downloads for:
echo   - YouTube Shorts
echo   - Instagram Reels
echo   - Facebook Reels
echo   - Kuaishou (快手)
echo   - TikTok
echo.
echo   Opening OmniDownloader in your browser...
echo   Engine running at: http://127.0.0.1:8000
echo   Keep this small window open while downloading videos.
echo ========================================================
echo.

:: Automatically open the website in the default browser
start "" "%~dp0index.html"

"%USERPROFILE%\.local\bin\uv.exe" run --with yt-dlp --with fastapi --with uvicorn server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying fallback with system python...
    python server.py
)

pause
