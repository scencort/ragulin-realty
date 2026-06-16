$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n[*] Working dir: $PWD" -ForegroundColor Cyan

# Activate venv
& "$PSScriptRoot\venv\Scripts\Activate.ps1"

# Install deps (only if needed)
Write-Host "[*] Installing playwright and httpx..." -ForegroundColor Cyan
pip install playwright httpx --quiet --disable-pip-version-check

Write-Host "`n[*] Opening Edge browser and parsing Cian...`n" -ForegroundColor Green

$url = if ($args[0]) { $args[0] } else { "" }

if ($url) {
    python "$PSScriptRoot\scrape_cian.py" $url
} else {
    python "$PSScriptRoot\scrape_cian.py"
}

Write-Host "`nDone. Press any key..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
