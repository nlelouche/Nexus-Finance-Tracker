@echo off
echo Iniciando New Finance Tracker...
echo ===================================

:: Levantar el servidor de desarrollo
start "Finance Tracker Server" cmd /c "npm run dev"

:: Esperar a que el servidor levante (2.5 segundos)
timeout /t 3 /nobreak >nul

:: Abrir en el navegador predeterminado
start http://localhost:5173

echo.
echo La herramienta deberia abrirse en el navegador...
echo Para cerrar el servidor, vuelva a esta ventana o a la terminal y presione Ctrl+C.
