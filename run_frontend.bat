@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo Starting ScholarNLP React Frontend exposed to local network on port 5173 ...
call npm run dev -- --host
pause
