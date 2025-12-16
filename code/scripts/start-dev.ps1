# ArcadiaBox - Script de demarrage dev (PowerShell)
# Usage: .\scripts\start-dev.ps1

$Host.UI.RawUI.WindowTitle = "ArcadiaBox Dev Server"

# Couleurs
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "   ArcadiaBox - Demarrage Dev" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Verifier Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Node.js n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Fonction pour tuer un processus sur un port
function Stop-ProcessOnPort($port) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                  Where-Object { $_.State -eq "Listen" }
    if ($connection) {
        $processId = $connection.OwningProcess
        Write-Host "Port $port utilise par PID $processId, arret..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# Nettoyer les ports
Write-Host "[1/4] Verification des ports..." -ForegroundColor Cyan
Stop-ProcessOnPort 8080
Stop-ProcessOnPort 3000

# Demarrer le backend
Write-Host "[2/4] Demarrage du serveur backend..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node --experimental-strip-types server/index.js
}

# Attendre
Write-Host "[3/4] Attente du serveur..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Verifier le serveur
$serverRunning = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue |
                 Where-Object { $_.State -eq "Listen" }
if ($serverRunning) {
    Write-Host "[OK] Serveur backend pret sur http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Le serveur met du temps a demarrer..." -ForegroundColor Yellow
}

Write-Host "[4/4] Demarrage du frontend Vite..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ArcadiaBox pret !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur Ctrl+C pour arreter les serveurs" -ForegroundColor Gray
Write-Host ""

# Cleanup a la fermeture
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "`nArret des serveurs..." -ForegroundColor Yellow
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    Stop-ProcessOnPort 8080
}

try {
    # Lancer Vite
    npx vite --host
} finally {
    # Cleanup
    Write-Host "`nArret des serveurs..." -ForegroundColor Yellow
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    Stop-ProcessOnPort 8080
}
