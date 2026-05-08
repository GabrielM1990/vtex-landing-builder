#!/bin/bash

# VTEX Landing Builder - Production Deploy Script
# Este script prepara y despliega la aplicación a producción

set -e  # Detener el script si hay errores

echo "🚀 Iniciando deploy de VTEX Landing Builder a producción..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "package.json no encontrado. Por favor ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar variables de entorno requeridas
log "Verificando variables de entorno..."

if [ ! -f "backend/.env" ]; then
    warn "backend/.env no encontrado. Creando desde .env.example..."
    cp backend/.env.example backend/.env
    error "Por favor configura backend/.env con tus credenciales antes de continuar."
    exit 1
fi

# Instalar dependencias
log "Instalando dependencias..."
npm run install:all

# Construir backend
log "Construyendo backend..."
cd backend
npm run build

# Ejecutar migraciones de base de datos
log "Ejecutando migraciones de base de datos..."
npx prisma migrate deploy
npx prisma generate

cd ..

# Construir frontend
log "Construyendo frontend..."
cd frontend
npm run build

cd ..

log "✅ Build completado exitosamente!"

# Verificar archivos de producción
if [ ! -d "frontend/dist" ]; then
    error "Build de frontend falló - directorio dist no encontrado"
    exit 1
fi

if [ ! -d "backend/dist" ]; then
    error "Build de backend falló - directorio dist no encontrado"
    exit 1
fi

# Crear archivo .env de producción si no existe
if [ ! -f ".env.production" ]; then
    warn "Creando .env.production template..."
    cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3001

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@your-host:5432/vtex_landing_builder"

# GitHub Configuration
GITHUB_TOKEN=ghp_your_production_token
GITHUB_OWNER=your-org-name
GITHUB_REPO=your-store-theme

# VTEX Configuration
VTEX_ACCOUNT=your-production-account
VTEX_APP_KEY=your-production-app-key
VTEX_APP_TOKEN=your-production-app-token

# OpenAI Configuration
OPENAI_API_KEY=sk-your-production-openai-key
EOF
    warn ".env.production creado. Por favor configúralo con tus credenciales de producción."
fi

log "🎉 Preparación para producción completada!"
log ""
log "Próximos pasos:"
log "1. Configura backend/.env con tus credenciales"
log "2. Configura .env.production para el servidor de producción"
log "3. Ejecuta 'npm run start:production' para iniciar el servidor"
log "4. Configura tu reverse proxy (Nginx/Apache) para servir el frontend"
log ""
log "Comandos útiles:"
log "- Iniciar servidor: npm run start:production"
log "- Ver logs: npm run logs:production"
log "- Reiniciar: npm run restart:production"

echo ""
echo -e "${GREEN}✨ VTEX Landing Builder está listo para producción! ✨${NC}"
