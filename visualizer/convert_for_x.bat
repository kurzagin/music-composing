@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   WAVELIGHT 1080p MP4 CONVERTER (Strict Seeking Fix)
echo =======================================================

set "INPUT_FILE=%~1"

if "%INPUT_FILE%"=="" (
    rem Check for any recently downloaded video in current dir or Downloads folder
    for /f "delims=" %%f in ('dir /b /o:-d *.webm *.mp4 2^>nul') do (
        set "INPUT_FILE=%%f"
        goto :found
    )
    
    echo No video file specified and no video found in current folder.
    echo Drag and drop your downloaded recording directly onto this .bat file!
    echo Or run: convert_for_x.bat "your_downloaded_file"
    pause
    exit /b 1
)

:found
set "OUTPUT_FILE=%~dpn1_fixed.mp4"
if "%OUTPUT_FILE%"=="" (
    set "OUTPUT_FILE=visualizer_1080p_final.mp4"
)

echo.
echo Input:  "%INPUT_FILE%"
echo Output: "%OUTPUT_FILE%"
echo.
echo Encoding H.264 High Profile 60fps with strict AAC and FastStart MOOV atom...

ffmpeg -y -i "%INPUT_FILE%" -c:v libx264 -preset medium -profile:v high -level:v 4.2 -pix_fmt yuv420p -r 60 -c:a aac -b:a 192k -ar 44100 -movflags +faststart "%OUTPUT_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Video converted to full-seeking MP4!
    echo Output saved as: %OUTPUT_FILE%
    echo Fully compatible with Mobile (iOS/Android), Desktop players, and Twitter/X.
) else (
    echo.
    echo [ERROR] Conversion failed. Make sure ffmpeg is working.
)
echo.
pause
