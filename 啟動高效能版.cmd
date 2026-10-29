@echo off
setlocal
set "STAR_BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "STAR_BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined STAR_BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "STAR_BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined STAR_BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "STAR_BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined STAR_BROWSER (
  echo Please install Chrome or Edge, or open the HTML file directly.
  pause
  exit /b 1
)
set "STAR_PAGE="
for %%F in ("%~dp0*.html") do if not defined STAR_PAGE set "STAR_PAGE=%%~fF"
if not defined STAR_PAGE exit /b 1
start "" "%STAR_BROWSER%" --force_high_performance_gpu --user-data-dir="%~dp0.browser-profile" --new-window "%STAR_PAGE%"
