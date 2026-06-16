$EnvFile = "$PSScriptRoot\backend\.env"
$VenvPy  = "$PSScriptRoot\backend\venv\Scripts\python.exe"
$utf8    = New-Object System.Text.UTF8Encoding $false

Write-Host ""
Write-Host "  Vvedite parol' PostgreSQL 18 (port 5433)" -ForegroundColor Cyan
$sec  = Read-Host "  Parol'" -AsSecureString
$pass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))

# Obnovlenie .env
$raw    = [System.IO.File]::ReadAllText($EnvFile, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF)
$newUrl = "DATABASE_URL=postgresql+psycopg://postgres:$pass@localhost:5433/ragulin_db"
$raw    = $raw -replace 'DATABASE_URL=[^\r\n]+', $newUrl
[System.IO.File]::WriteAllText($EnvFile, $raw, $utf8)
Write-Host "  [OK] .env obnovlen" -ForegroundColor Green

# Python-skript (single-quoted heredoc -- absolyutno literal'nyj, bez ekranirovaniya)
# Parol' peredaetsya cherez env-peremennuyu PGPASSWORD
$pyContent = @'
import psycopg, sys, os
pw = os.environ["PGPASSWORD"]
try:
    conn = psycopg.connect(
        host="localhost", port=5433, user="postgres", password=pw,
        dbname="postgres", connect_timeout=5, autocommit=True
    )
    exists = conn.execute(
        "SELECT 1 FROM pg_database WHERE datname = 'ragulin_db'"
    ).fetchone()
    if exists:
        print("ragulin_db uzhe sushchestvuet")
    else:
        conn.execute("CREATE DATABASE ragulin_db")
        print("ragulin_db sozdana!")
    conn.close()
except Exception as e:
    print(f"OSHIBKA: {e}")
    sys.exit(1)
'@

$tmpPy = Join-Path $env:TEMP "ragulin_setup.py"
[System.IO.File]::WriteAllText($tmpPy, $pyContent, $utf8)

$env:PGPASSWORD = $pass
Write-Host "  Proverka i sozdanie BD..." -ForegroundColor DarkGray
$out      = & $VenvPy $tmpPy 2>&1
$exitCode = $LASTEXITCODE
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item $tmpPy         -ErrorAction SilentlyContinue

if ($exitCode -ne 0) {
    Write-Host "  [!!] $out" -ForegroundColor Red
    Write-Host "  Proverite parol' -- tot zhe chto v pgAdmin 4." -ForegroundColor Yellow
} else {
    Write-Host "  [OK] $out" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Gotovo! Zapustite: .\start.ps1" -ForegroundColor Cyan
}
Write-Host ""
