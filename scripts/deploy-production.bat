@echo off
REM VTEX Landing Builder - Production Deploy Script (Windows)
REM Este script prepara y despliega la aplicación a producción

echo 🚀 Iniciando deploy de VTEX Landing Builder a producción...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ERROR: package.json no encontrado. Por favor ejecuta este script desde la raíz del proyecto.
    pause
    exit /b 1
)

REM Verificar variables de entorno requeridas
echo 🔍 Verificando variables de entorno...

if not exist "backend\.env" (
    echo WARN: backend\.env no encontrado. Creando desde .env.example...
    copy "backend\.env.example" "backend\.env"
    echo ERROR: Por favor configura backend\.env con tus credenciales antes de continuar.
    pause
    exit /b 1
)

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm run install:all
if %errorlevel% neq 0 (
    echo ERROR: Falló la instalación de dependencias
    pause
    exit /b 1
)

REM Construir backend
echo 🔨 Construyendo backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Falló el build del backend
    pause
    exit /b 1
)

REM Ejecutar migraciones de base de datos
echo 🗄️ Ejecutando migraciones de base de datos...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo WARN: Las migraciones pueden requerir intervención manual
)
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Falló la generación de Prisma client
    pause
    exit /b 1
)

cd ..

REM Construir frontend
echo 🎨 Construyendo frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Falló el build del frontend
    pause
    exit /b 1
)

cd ..

echo ✅ Build completado exitosamente!

REM Verificar archivos de producción
if not exist "frontend\dist" (
    echo ERROR: Build de frontend falló - directorio dist no encontrado
    pause
    exit /b 1
)

if not exist "backend\dist" (
    echo ERROR: Build de backend falló - directorio dist no encontrado
    pause
    exit /b 1
)

REM Crear archivo .env de producción si no existe
if not exist ".env.production" (
    echo WARN: Creando .env.production template...
    (
        echo # Production Environment Variables
        echo NODE_ENV=production
        echo PORT=3001
        echo.
        echo # Database ^(PostgreSQL^)
        echo DATABASE_URL="postgresql://user:password@your-host:5432/vtex_landing_builder"
        echo.
        echo # GitHub Configuration
        echo GITHUB_TOKEN=ghp_your_production_token
        echo GITHUB_OWNER=your-org-name
        echo GITHUB_REPO=your-store-theme
        echo.
        echo # VTEX Configuration
        echo VTEX_ACCOUNT=your-production-account
        echo VTEX_APP_KEY=your-production-app-key
        echo VTEX_APP_TOKEN=your-production-app-token
        echo.
        echo # OpenAI Configuration
        echo OPENAI_API_KEY=sk-your-production-openai-key
    ) > .env.production
    echo WARN: .env.production creado. Por favor configúralo con tus credenciales de producción.
)

echo.
echo 🎉 Preparación para producción completada!
echo.
echo Próximos pasos:
echo 1. Configura backend\.env con tus credenciales
echo 2. Configura .env.production para el servidor de producción
echo 3. Ejecuta 'npm run start:production' para iniciar el servidor
echo 4. Configura tu reverse proxy ^(IIS/Nginx^) para servir el frontend
echo.
echo Comandos útiles:
echo - Iniciar servidor: npm run start:production
echo - Ver logs: npm run logs:production
echo - Reiniciar: npm run restart:production
echo.
echo ✨ VTEX Landing Builder está listo para producción! ✨
pause
