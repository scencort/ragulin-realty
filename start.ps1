#Requires -Version 5.1
<#
.SYNOPSIS
    Zapuskaet platformu Ragulin Roman (backend + frontend).
#>

Set-StrictMode -Version Latest

function Write-Step { param($msg) Write-Host "`n[ >> ] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg"  -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!!] $msg"  -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "       $msg"  -ForegroundColor DarkGray }
function Write-Fail { param($msg) Write-Host "`n[ERR] $msg`n" -ForegroundColor Red; exit 1 }

# Zapusk PowerShell-okna cherez EncodedCommand -- bez problem s kavychkami
function Start-PsWindow {
    param([string]$Title, [string]$Command)
    $full    = "[Console]::Title = '$Title'; $Command"
    $encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($full))
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-EncodedCommand", $encoded
}

$Root     = $PSScriptRoot
$Backend  = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$EnvFile  = Join-Path $Backend ".env"
$utf8     = New-Object System.Text.UTF8Encoding $false

Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor White
Write-Host "  |  Ragulin Roman -- start platformy        |" -ForegroundColor White
Write-Host "  +------------------------------------------+" -ForegroundColor White
Write-Host ""

# ─── 1. Python ───────────────────────────────────────────────────────────────
Write-Step "Proverka Python..."
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = "$(& $cmd --version 2>&1)"
        if ($ver -match "Python 3\.(\d+)" -and [int]$Matches[1] -ge 10) { $python = $cmd; break }
    } catch { }
}
if (-not $python) { Write-Fail "Python 3.10+ ne najden. Ustanovite s https://python.org" }
Write-Ok "$(& $python --version 2>&1)"

# ─── 2. Node.js ──────────────────────────────────────────────────────────────
Write-Step "Proverka Node.js..."
try {
    $nv = "$(node --version 2>&1)"
    if ($nv -match "v(\d+)\." -and [int]$Matches[1] -ge 18) { Write-Ok "Node.js $nv" }
    else { Write-Fail "Node.js 18+ trebuetsya, tekushchaya: $nv" }
} catch { Write-Fail "Node.js ne najden. Ustanovite s https://nodejs.org" }

# ─── 3. PostgreSQL (proverka sluzhby) ────────────────────────────────────────
Write-Step "Proverka PostgreSQL..."
$svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object Status -eq "Running"
if ($svc) { Write-Ok "PostgreSQL service: $($svc.Name -join ', ')" }
else {
    $tcp = New-Object System.Net.Sockets.TcpClient
    try { $tcp.Connect("127.0.0.1", 5432); Write-Ok "PostgreSQL :5432" }
    catch { Write-Warn "PostgreSQL ne obnaruzhen! Zapustite PostgreSQL pered startom." }
    finally { $tcp.Close() }
}

# ─── 4. .env ─────────────────────────────────────────────────────────────────
Write-Step "Nastrojka .env..."
if (-not (Test-Path $EnvFile)) {
    Copy-Item (Join-Path $Backend ".env.example") $EnvFile
    Write-Ok ".env sozdan"
} else { Write-Ok ".env sushchestvuet" }

# Chitaem .env, ubiraem BOM esli est'
$envRaw  = [System.IO.File]::ReadAllText($EnvFile, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF)
$changed = $false

# postgresql:// -> postgresql+psycopg://
if ($envRaw -match 'DATABASE_URL=postgresql://') {
    $envRaw  = $envRaw -replace 'DATABASE_URL=postgresql://', 'DATABASE_URL=postgresql+psycopg://'
    $changed = $true; Write-Ok "DATABASE_URL: postgresql:// -> postgresql+psycopg://"
}

# ALLOWED_ORIGINS: zapyatye -> JSON-massiv (pydantic-settings 2.7+)
if ($envRaw -match 'ALLOWED_ORIGINS=(?!\[)([^\r\n]+)') {
    $raw   = $Matches[1].Trim()
    $items = ($raw -split ',') | ForEach-Object { '"' + $_.Trim() + '"' }
    $json  = '[' + ($items -join ',') + ']'
    $envRaw  = $envRaw -replace ('ALLOWED_ORIGINS=' + [regex]::Escape($raw)), "ALLOWED_ORIGINS=$json"
    $changed = $true; Write-Ok "ALLOWED_ORIGINS -> JSON"
}

if ($changed) { [System.IO.File]::WriteAllText($EnvFile, $envRaw, $utf8) }

# ─── 5. venv ─────────────────────────────────────────────────────────────────
Write-Step "Python venv..."
$venvDir    = Join-Path $Backend "venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if (Test-Path $venvPython) {
    $vv = "$(& $venvPython --version 2>&1)"; $sv = "$(& $python --version 2>&1)"
    if ($vv -ne $sv) { Write-Warn "Versii Python raznye -- peresozdam venv..."; Remove-Item $venvDir -Recurse -Force }
}
if (-not (Test-Path $venvPython)) {
    Write-Info "Sozdanie venv..."
    & $python -m venv $venvDir
    if ($LASTEXITCODE -ne 0) { Write-Fail "Ne udalos' sozdat' venv" }
    Write-Ok "venv sozdan"
} else { Write-Ok "venv sushchestvuet" }

# Bootstrap pip esli otsutstvuet
& $venvPython -m pip --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Info "Bootstrapping pip..."
    & $venvPython -m ensurepip --upgrade
    if ($LASTEXITCODE -ne 0) { Write-Fail "ensurepip ne udalos'" }
}

Write-Info "Obnovlenie pip..."
& $venvPython -m pip install --upgrade pip --quiet

# Zavisimosti cherez khesh
$reqFile  = Join-Path $Backend "requirements.txt"
$sentinel = Join-Path $venvDir ".deps_hash"
$reqHash  = (Get-FileHash $reqFile -Algorithm MD5).Hash
$needPip  = $true
if (Test-Path $sentinel) { $needPip = (Get-Content $sentinel -Raw).Trim() -ne $reqHash }

if ($needPip) {
    Write-Info "Ustanovka Python zavisimostej..."
    & $venvPython -m pip install -r $reqFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Warn "pip install ne udalos'. Vozmozhno Python 3.14 eshche ne podderzhivaetsya kakim-to paketom."
        Write-Warn "Rekomendaciya: ustanovite Python 3.12 / 3.13 (https://python.org/downloads)"
        exit 1
    }
    [System.IO.File]::WriteAllText($sentinel, $reqHash, $utf8)
    Write-Ok "Zavisimosti ustanovleny"
} else { Write-Ok "Zavisimosti aktual'ny" }

# ─── 6. Proverka i nastrojka BD ──────────────────────────────────────────────
Write-Step "Proverka podklyucheniya k baze dannyh..."

# Chitaem DATABASE_URL iz .env
$envLines = [System.IO.File]::ReadAllText($EnvFile, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF)
$dbUrl    = ($envLines -split '\r?\n' | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1) -replace '^DATABASE_URL=', ''

# Parsim: schema://user:pass@host:port/dbname
if ($dbUrl -match '^[^:]+://([^:]+):([^@]+)@([^:/]+):?(\d*)/(.+)$') {
    $dbUser = $Matches[1]; $dbPass = $Matches[2]
    $dbHost = $Matches[3]; $dbPort = if ($Matches[4]) { $Matches[4] } else { "5432" }
    $dbName = $Matches[5]
} else {
    Write-Warn "Ne udalos' raspartsit' DATABASE_URL. Proverte backend\.env"
    $dbUser = "postgres"; $dbPass = "password"; $dbHost = "localhost"; $dbPort = "5432"; $dbName = "ragulin_db"
}

# Testovoe podklyuchenie
$testScript = @"
import sys
try:
    import psycopg
    conn = psycopg.connect(host='$dbHost', port=$dbPort, user='$dbUser', password='$dbPass', dbname='postgres', connect_timeout=5)
    conn.close()
    print('AUTH_OK')
except psycopg.OperationalError as e:
    err = str(e).lower()
    if 'password' in err or 'authentication' in err or 'autentifik' in err:
        print('AUTH_FAIL')
    else:
        print('CONN_FAIL:' + str(e)[:80])
except Exception as e:
    print('ERROR:' + str(e)[:80])
"@

$testOut = "$(& $venvPython -c $testScript 2>&1)".Trim()

if ($testOut -eq "AUTH_FAIL" -or $dbPass -eq "password") {
    Write-Warn "Autentifikaciya ne proshla. Vvedite parol' PostgreSQL dlya pol'zovatelya '$dbUser':"
    $secPwd  = Read-Host -Prompt "  Parol' PostgreSQL" -AsSecureString
    $newPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
                   [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPwd))

    # Proverka novogo parolya
    $testScript2 = $testScript -replace [regex]::Escape("password='$dbPass'"), "password='$newPass'"
    $testOut2    = "$(& $venvPython -c $testScript2 2>&1)".Trim()

    if ($testOut2 -ne "AUTH_OK" -and $testOut2 -notmatch "^CONN_FAIL") {
        Write-Fail "Autentifikaciya s etim parolem tozhe ne udalas'. Proverte login/parol' PostgreSQL."
    }

    # Zapisyvaem novyj parol' v .env
    $envLines = [System.IO.File]::ReadAllText($EnvFile, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF)
    $envLines = $envLines -replace ([regex]::Escape($dbPass)), $newPass
    [System.IO.File]::WriteAllText($EnvFile, $envLines, $utf8)
    $dbPass = $newPass
    Write-Ok "Parol' obnovlen v .env"
} elseif ($testOut -eq "AUTH_OK") {
    Write-Ok "Autentifikaciya uspeshna"
} elseif ($testOut -match "^CONN_FAIL") {
    Write-Warn "Oshibka podklyucheniya: $($testOut -replace '^CONN_FAIL:','')"
}

# Sozdaem BD esli ne sushchestvuet
$createScript = @"
import psycopg, sys
try:
    conn = psycopg.connect(host='$dbHost', port=$dbPort, user='$dbUser', password='$dbPass', dbname='postgres', autocommit=True, connect_timeout=5)
    conn.execute('CREATE DATABASE $dbName')
    conn.close()
    print('CREATED')
except psycopg.errors.DuplicateDatabase:
    print('EXISTS')
except Exception as e:
    print('ERROR:' + str(e)[:120])
"@

$createOut = "$(& $venvPython -c $createScript 2>&1)".Trim()
if ($createOut -eq "CREATED")   { Write-Ok "Baza dannyh '$dbName' sozdana" }
elseif ($createOut -eq "EXISTS") { Write-Ok "Baza dannyh '$dbName' uzhe sushchestvuet" }
else { Write-Warn "Sozdanie BD: $createOut" }

# ─── 7. Alembic ──────────────────────────────────────────────────────────────
Write-Step "Migracii Alembic..."
Push-Location $Backend
& $venvPython -m alembic upgrade head
$alembicExit = $LASTEXITCODE
Pop-Location
if ($alembicExit -ne 0) { Write-Warn "Migracii ne primenilis'. Proverte DATABASE_URL v backend\.env" }
else { Write-Ok "Migracii primeneny" }

# ─── 8. npm ──────────────────────────────────────────────────────────────────
Write-Step "npm zavisimosti..."
$nodeModules = Join-Path $Frontend "node_modules"
$pkgLock     = Join-Path $Frontend "package-lock.json"
$needNpm     = (-not (Test-Path $nodeModules))
if (-not $needNpm -and (Test-Path $pkgLock)) {
    $needNpm = (Get-Item $pkgLock).LastWriteTime -gt (Get-Item $nodeModules).LastWriteTime
}
if ($needNpm) {
    Write-Info "npm install..."
    Push-Location $Frontend; npm install --legacy-peer-deps; $npmExit = $LASTEXITCODE; Pop-Location
    if ($npmExit -ne 0) { Write-Fail "npm install ne udalos'" }
    Write-Ok "npm zavisimosti ustanovleny"
} else { Write-Ok "node_modules aktual'en" }

# ─── 9. Zapusk ───────────────────────────────────────────────────────────────
Write-Step "Zapusk serverov..."

# Backend -- cherez EncodedCommand (net problem s kavychkami)
Start-PsWindow "Backend FastAPI :8000" "cd '$Backend'; & '$venvPython' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Write-Ok "Backend:  http://localhost:8000  |  API docs: http://localhost:8000/api/docs"

Start-Sleep -Milliseconds 1500

# Frontend
Start-PsWindow "Frontend Vite :5173" "cd '$Frontend'; npm run dev"
Write-Ok "Frontend: http://localhost:5173"

# ─── Itog ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host "  |         Platforma zapushchena!           |" -ForegroundColor Green
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "  Sajt:        http://localhost:5173"          -ForegroundColor White
Write-Host "  API docs:    http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "  Admin:       http://localhost:5173/admin"    -ForegroundColor White
Write-Host "  Login:       admin@ragulin.ru / Admin123!"   -ForegroundColor White
Write-Host ""
Write-Host "  Zakrojte okna PowerShell chtoby ostanovit'." -ForegroundColor DarkGray
Write-Host ""
