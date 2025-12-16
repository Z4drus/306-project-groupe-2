@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    ArcadiaBox - Demarrage Dev
echo ========================================
echo.

:: Verifier si Node.js est installe
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

:: Tuer les processus existants sur les ports
echo [1/4] Verification des ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080.*LISTENING"') do (
    echo Port 8080 utilise, arret du processus %%a...
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000.*LISTENING"') do (
    echo Port 3000 utilise, arret du processus %%a...
    taskkill /F /PID %%a >nul 2>nul
)

:: Demarrer le serveur backend
echo [2/4] Demarrage du serveur backend...
start /b cmd /c "node --experimental-strip-types server/index.js"

:: Attendre que le serveur soit pret
echo [3/4] Attente du serveur...
timeout /t 3 /nobreak >nul

:: Verifier que le serveur est lance
netstat -an | findstr ":8080.*LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Serveur backend pret sur http://localhost:8080
) else (
    echo [ATTENTION] Le serveur met du temps a demarrer...
)

echo [4/4] Demarrage du frontend Vite...
echo.
echo ========================================
echo    ArcadiaBox pret !
echo ========================================
echo    Backend:  http://localhost:8080
echo    Frontend: http://localhost:3000
echo ========================================
echo.
echo Appuyez sur Ctrl+C pour arreter les serveurs
echo.

:: Lancer Vite (au premier plan)
npx vite --host

:: Cleanup
echo.
echo Arret des serveurs...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

endlocal
