@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado o no esta agregado al PATH.
  echo Instala Node.js y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:4173/"
node server.mjs
pause
