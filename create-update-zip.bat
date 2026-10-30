@echo off
cd /d "%~dp0backend"
if exist "..\ats-update-only.zip" del /f /q "..\ats-update-only.zip"
tar -a -c -f "..\ats-update-only.zip" app bootstrap config database routes public storage .htaccess .user.ini
cd /d "%~dp0"
echo ats-update-only.zip created successfully!
dir ats-update-only.zip
