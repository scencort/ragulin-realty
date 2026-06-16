@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo.
echo [*] Working dir: %CD%
echo.

if not exist "venv\Scripts\activate.bat" (
    echo [*] Creating venv...
    python -m venv venv
    if errorlevel 1 (
        echo [!] Python not found. Install Python 3.11+ and try again.
        pause
        exit /b 1
    )
)

call "%SCRIPT_DIR%venv\Scripts\activate.bat"

echo [*] Installing dependencies...
pip install playwright httpx --quiet --disable-pip-version-check

echo.
echo [*] Starting parser (will open Edge browser)...
echo.

python "%SCRIPT_DIR%scrape_cian.py" %*

echo.
pause
endlocal
