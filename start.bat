@echo off
cd /d "%~dp0app"
echo Starting HIKARINAMI server at http://localhost:3000
echo Customer menu:    http://localhost:3000/index.html
echo Kitchen dashboard: http://localhost:3000/kitchen.html
echo.
echo Press Ctrl+C to stop.
python -m http.server 3000
