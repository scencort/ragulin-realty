#Requires -Version 5.1
<#
.SYNOPSIS
    Sbros parolya PostgreSQL, sozdanie bazy ragulin_db, obnovlenie .env
#>

# Avtopodnyatie prav
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Host "  Zapros prav Administratora..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"')
    exit
}

function Write-Step { param($msg) Write-Host "`n[ >> ] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg"  -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!!] $msg"  -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "       $msg"  -ForegroundColor DarkGray }
function Write-Fail { param($msg) Write-Host "`n[ERR] $msg`n" -ForegroundColor Red; Read-Host "Nazhmi Enter"; exit 1 }

$utf8    = New-Object System.Text.UTF8Encoding $false
$Root    = $PSScriptRoot
$EnvFile = Join-Path $Root "backend\.env"

Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor White
Write-Host "  |   Nastrojka PostgreSQL dlya platformy    |" -ForegroundColor White
Write-Host "  +------------------------------------------+" -ForegroundColor White
Write-Host ""

# ─── 1. Novyj parol' ─────────────────────────────────────────────────────────
Write-Step "Vvedite novyj parol' dlya pol'zovatelya postgres..."
Write-Info "Parol' budet sohranyon v backend\.env"
Write-Host ""

$NewPassword = ""
do {
    $sec1 = Read-Host "  Novyj parol'" -AsSecureString
    $sec2 = Read-Host "  Povtorite    " -AsSecureString
    $p1   = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec1))
    $p2   = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec2))
    if ($p1 -ne $p2)      { Write-Host "  Paroli ne sovpadayut, povtorite.`n" -ForegroundColor Yellow; continue }
    if ($p1.Length -lt 4) { Write-Host "  Minimum 4 simvola.`n" -ForegroundColor Yellow; continue }
    $NewPassword = $p1
} while ($NewPassword.Length -lt 4)
Write-Ok "Parol' prinyat"

# ─── 2. Poisk PostgreSQL na portu 5432 ───────────────────────────────────────
Write-Step "Poisk PostgreSQL na portu 5432..."

# Nahodim vse postgresql-sluzhby
$allPgSvcs = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if (-not $allPgSvcs) { Write-Fail "PostgreSQL sluzhby ne najdeny. Ustanovite PostgreSQL." }

# Dlya kazhdoj sluzhby poluchaem DataDirectory iz ImagePath
# ImagePath: "...\pg_ctl.exe" runservice -N "..." -D "C:\...\data" -w
$pgInstances = @()
foreach ($svc in $allPgSvcs) {
    $wmiSvc  = Get-WmiObject Win32_Service -Filter "Name='$($svc.Name)'" -ErrorAction SilentlyContinue
    $imgPath = if ($wmiSvc) { $wmiSvc.PathName } else { "" }

    $dataDir = ""
    if ($imgPath -match '-D\s+"([^"]+)"') {
        $dataDir = $Matches[1].Trim()
    } elseif ($imgPath -match '-D\s+(\S+)') {
        $dataDir = $Matches[1].Trim()
    }

    # Fallback po nomeru versii iz imeni sluzhby
    if (-not $dataDir -or -not (Test-Path $dataDir)) {
        if ($svc.Name -match 'x64-(\d+)') {
            $ver  = $Matches[1]
            $cand = "C:\Program Files\PostgreSQL\$ver\data"
            if (Test-Path $cand) { $dataDir = $cand }
        }
    }

    # Chitaem port iz postgresql.conf
    $port = 5432
    $confFile = if ($dataDir) { Join-Path $dataDir "postgresql.conf" } else { "" }
    if ($confFile -and (Test-Path $confFile)) {
        $portLine = Get-Content $confFile | Where-Object { $_ -match '^\s*port\s*=' } | Select-Object -First 1
        if ($portLine -match '=\s*(\d+)') { $port = [int]$Matches[1] }
    }

    # Bin-dir iz ImagePath
    $binDir = ""
    if ($imgPath -match '"([^"]+)\\pg_ctl\.exe"') {
        $binDir = $Matches[1]
    }
    if (-not $binDir -and $dataDir) {
        $ver = Split-Path (Split-Path $dataDir -Parent) -Leaf
        $cand = "C:\Program Files\PostgreSQL\$ver\bin"
        if (Test-Path (Join-Path $cand "psql.exe")) { $binDir = $cand }
    }

    if ($dataDir -and $binDir) {
        $pgInstances += [PSCustomObject]@{
            Service = $svc.Name
            Status  = $svc.Status
            Port    = $port
            DataDir = $dataDir
            BinDir  = $binDir
        }
    }
}

if ($pgInstances.Count -eq 0) {
    Write-Fail "Ne udalos' najti data-direktorii PostgreSQL. Ustanavlivaem cherez fallback..."
}

# Pokazhem chto nashli
foreach ($inst in $pgInstances) {
    Write-Info "  Sluzhba: $($inst.Service)  Port: $($inst.Port)  DataDir: $($inst.DataDir)"
}

# Beryom ekzemplyar na portu 5432
$pg = $pgInstances | Where-Object { $_.Port -eq 5432 } | Select-Object -First 1
if (-not $pg) {
    # Esli na 5432 nichego -- beryom pervyj Running
    $pg = $pgInstances | Where-Object { $_.Status -eq "Running" } | Select-Object -First 1
}
if (-not $pg) {
    $pg = $pgInstances | Select-Object -First 1
}

Write-Ok "Budem rabotat' s: $($pg.Service)  (port $($pg.Port))"
Write-Ok "DataDir: $($pg.DataDir)"
Write-Ok "BinDir:  $($pg.BinDir)"

$hbaFile = Join-Path $pg.DataDir "pg_hba.conf"
$psql    = Join-Path $pg.BinDir  "psql.exe"
if (-not (Test-Path $hbaFile)) { Write-Fail "pg_hba.conf ne najden: $hbaFile" }
if (-not (Test-Path $psql))    { Write-Fail "psql.exe ne najden: $psql" }

# ─── 3. Backup + trust ───────────────────────────────────────────────────────
Write-Step "Backup i nastrojka pg_hba.conf..."
$hbaBak = "$hbaFile.bak_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $hbaFile $hbaBak -Force
Write-Ok "Backup: $hbaBak"

$hbaOrig = [System.IO.File]::ReadAllText($hbaFile, [System.Text.Encoding]::UTF8)
$hbaNew  = $hbaOrig `
    -replace '(?m)(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(scram-sha-256|md5|peer)', '$1trust' `
    -replace '(?m)(host\s+all\s+all\s+::1/128\s+)(scram-sha-256|md5|peer)',          '$1trust' `
    -replace '(?m)(local\s+all\s+all\s+)(scram-sha-256|md5|peer)',                   '$1trust'

[System.IO.File]::WriteAllText($hbaFile, $hbaNew, $utf8)
Write-Ok "trust-rezhim aktivirovan"

# ─── 4. Restart service ──────────────────────────────────────────────────────
Write-Step "Perezapusk sluzhby $($pg.Service)..."
try {
    Restart-Service -Name $pg.Service -Force -ErrorAction Stop
    Start-Sleep -Seconds 4
    Write-Ok "Sluzhba zapushchena"
} catch {
    [System.IO.File]::WriteAllText($hbaFile, $hbaOrig, $utf8)
    Write-Fail "Ne udalos' perezapustit' sluzhbu: $_"
}

# ─── 5. Smena parolya ────────────────────────────────────────────────────────
Write-Step "Ustanovka novogo parolya..."
$safePass = $NewPassword -replace "'", "''"
& $psql -U postgres -h 127.0.0.1 -p $pg.Port -c "ALTER USER postgres PASSWORD '$safePass';" 2>&1 |
    ForEach-Object { Write-Info $_ }
$psqlExit = $LASTEXITCODE

if ($psqlExit -ne 0) {
    [System.IO.File]::WriteAllText($hbaFile, $hbaOrig, $utf8)
    Restart-Service -Name $pg.Service -Force
    Write-Fail "Ne udalos' smenit' parol'. pg_hba.conf vosstanovlen."
}
Write-Ok "Parol' izmenen"

# ─── 6. Sozdanie BD ──────────────────────────────────────────────────────────
Write-Step "Sozdanie bazy ragulin_db..."
$exists = "$(& $psql -U postgres -h 127.0.0.1 -p $pg.Port -tAc "SELECT 1 FROM pg_database WHERE datname='ragulin_db'" 2>&1)".Trim()
if ($exists -eq "1") {
    Write-Ok "Baza ragulin_db uzhe sushchestvuet"
} else {
    & $psql -U postgres -h 127.0.0.1 -p $pg.Port -c "CREATE DATABASE ragulin_db;" 2>&1 |
        ForEach-Object { Write-Info $_ }
    if ($LASTEXITCODE -eq 0) { Write-Ok "Baza ragulin_db sozdana" }
    else { Write-Warn "Mozhet ne sozdalas' -- proverte v pgAdmin" }
}

# ─── 7. Vosstanovlenie pg_hba.conf ───────────────────────────────────────────
Write-Step "Vosstanovlenie pg_hba.conf..."
[System.IO.File]::WriteAllText($hbaFile, $hbaOrig, $utf8)
Write-Ok "pg_hba.conf vosstanovlen"

Restart-Service -Name $pg.Service -Force
Start-Sleep -Seconds 3
Write-Ok "Sluzhba $($pg.Service) perezapushchena"

# ─── 8. Obnovlenie .env ──────────────────────────────────────────────────────
Write-Step "Obnovlenie backend\.env..."
if (Test-Path $EnvFile) {
    $envRaw = [System.IO.File]::ReadAllText($EnvFile, [System.Text.Encoding]::UTF8).TrimStart([char]0xFEFF)
    if ($envRaw -match 'DATABASE_URL=[^\r\n]+') {
        $newUrl = "DATABASE_URL=postgresql+psycopg://postgres:$NewPassword@localhost:$($pg.Port)/ragulin_db"
        $envRaw = $envRaw -replace 'DATABASE_URL=[^\r\n]+', $newUrl
    } else {
        $envRaw += "`nDATABASE_URL=postgresql+psycopg://postgres:$NewPassword@localhost:$($pg.Port)/ragulin_db"
    }
    [System.IO.File]::WriteAllText($EnvFile, $envRaw, $utf8)
    Write-Ok ".env obnovlen"
} else {
    Write-Warn ".env ne najden — DATABASE_URL ne obnovlen"
}

# ─── Itog ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host "  |         Gotovo! BD nastroena.            |" -ForegroundColor Green
Write-Host "  +------------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "  Pol'zovatel': postgres"                          -ForegroundColor White
Write-Host "  Baza:         ragulin_db"                        -ForegroundColor White
Write-Host "  Port:         $($pg.Port)"                       -ForegroundColor White
Write-Host ""
Write-Host "  Teper' zakrojte eto okno i zapustite:"          -ForegroundColor Cyan
Write-Host "  .\start.ps1"                                     -ForegroundColor Cyan
Write-Host ""
Read-Host "Nazhmi Enter dlya zakrytiya"
