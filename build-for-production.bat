@echo off
echo ========================================================
echo   JOBBYCART ATS - PRODUCTION BUILD FOR HOSTINGER
echo ========================================================
echo.

cd /d "%~dp0frontend"
echo [1/3] Compiling React Vite Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Merging frontend assets into backend/public/...
if not exist "..\backend\public\assets" mkdir "..\backend\public\assets"
copy /y "dist\index.html" "..\backend\public\index.html" >nul
xcopy /y /e /i "dist\assets\*" "..\backend\public\assets\" >nul
copy /y "public\jobbycart-logo.png" "..\backend\public\jobbycart-logo.png" >nul

echo.
echo [3/3] Build complete!
echo ========================================================
echo The "backend" folder now contains BOTH the Laravel API
echo and the compiled React Frontend.
echo.
echo You can now ZIP the "backend" folder (excluding vendor and node_modules)
echo and upload directly to your Hostinger subdomain directory!
echo ========================================================
echo.
