@echo off
echo ===============================================
echo  AgroSuste Market - Docker Dev Start
echo ===============================================

echo [1/3] Parando container antigo (se existir)...
docker rm -f agrosuste-frontend-dev 2>nul

echo [2/3] A iniciar o frontend com Node.js em Docker...
docker run -d ^
  --name agrosuste-frontend-dev ^
  -p 3000:5173 ^
  -v "%cd%:/app" ^
  -w /app ^
  node:20-alpine ^
  sh -c "npm install && npx vite --host 0.0.0.0 --port 5173"

echo [3/3] A aguardar arranque...
timeout /t 5 >nul

echo.
echo Status do container:
docker inspect agrosuste-frontend-dev --format="Status: {{.State.Status}} | Porta: 3000"

echo.
echo Logs de arranque:
docker logs agrosuste-frontend-dev --tail 20

echo.
echo ===============================================
echo  Abre o browser em: http://localhost:3000
echo ===============================================
pause
