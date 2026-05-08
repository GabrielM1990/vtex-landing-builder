# Guía de Deploy a Producción - VTEX Landing Builder

## 📋 Requisitos Previos

### Infraestructura
- **Servidor**: Ubuntu 20.04+ o CentOS 8+
- **Node.js**: 18+ 
- **PostgreSQL**: 13+
- **Nginx**: Para reverse proxy (recomendado)
- **PM2**: Para gestión de procesos (recomendado)

### Credenciales Requeridas
- **GitHub**: Personal Access Token con permisos de repo
- **VTEX**: App Key y App Token con permisos de admin
- **OpenAI**: API Key (para análisis IA)
- **Base de datos**: PostgreSQL connection string

---

## 🚀 Proceso de Deploy

### 1. Preparación del Servidor

```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Instalar Nginx
sudo apt install nginx
```

### 2. Configuración de Base de Datos

```bash
# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER vtex_landing WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE vtex_landing_builder OWNER vtex_landing;
GRANT ALL PRIVILEGES ON DATABASE vtex_landing_builder TO vtex_landing;
\q
```

### 3. Deploy de la Aplicación

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd vtex-landing-builder

# Ejecutar script de preparación
npm run setup:production

# Configurar variables de entorno
cp backend/.env.example backend/.env
nano backend/.env  # Configurar con tus credenciales

# Configurar producción
cp .env.production .env.production
nano .env.production  # Configurar para producción
```

### 4. Variables de Entorno - Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://vtex_landing:tu_password@localhost:5432/vtex_landing_builder"

# Server
PORT=3001

# GitHub Configuration
GITHUB_TOKEN=ghp_tu_production_token
GITHUB_OWNER=tu-organizacion
GITHUB_REPO=tu-store-theme

# VTEX Configuration
VTEX_ACCOUNT=tu-cuenta-vtex
VTEX_APP_KEY=vtexappkey-tu-cuenta-XXXXXX
VTEX_APP_TOKEN=tu_token_largo_aqui

# OpenAI Configuration
OPENAI_API_KEY=sk-tu-openai-key-aqui
```

### 5. Iniciar Aplicación con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar inicio automático
pm2 startup
```

### 6. Configurar Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/vtex-landing-builder
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /path/to/vtex-landing-builder/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/vtex-landing-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔧 Configuración PM2

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vtex-landing-builder',
    script: 'backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

---

## 🔒 Consideraciones de Seguridad

### 1. Variables de Entorno
- Nunca commitear `.env` files
- Usar secrets del sistema en producción
- Rotar credenciales regularmente

### 2. Base de Datos
- Usar conexión SSL
- Configurar firewall para PostgreSQL
- Backups diarios automatizados

### 3. API Security
- Habilitar CORS solo para dominios permitidos
- Rate limiting en endpoints críticos
- Validar todos los inputs

---

## 📊 Monitoreo y Logs

### Logs PM2
```bash
# Ver logs en tiempo real
pm2 logs vtex-landing-builder

# Ver logs específicos
pm2 logs vtex-landing-builder --err  # Solo errores
pm2 logs vtex-landing-builder --out  # Solo output
```

### Monitoreo Básico
```bash
# Estado de la aplicación
pm2 status

# Monitoreo de recursos
pm2 monit

# Reiniciar si es necesario
pm2 restart vtex-landing-builder
```

---

## 🚨 Troubleshooting Común

### Error: "Database connection failed"
```bash
# Verificar conexión PostgreSQL
psql -h localhost -U vtex_landing -d vtex_landing_builder

# Verificar servicio PostgreSQL
sudo systemctl status postgresql
```

### Error: "Permission denied"
```bash
# Verificar permisos de archivos
sudo chown -R $USER:$USER /path/to/vtex-landing-builder
chmod -R 755 /path/to/vtex-landing-builder
```

### Error: "Port already in use"
```bash
# Verificar puertos en uso
sudo netstat -tlnp | grep :3001

# Matar proceso si es necesario
sudo kill -9 <PID>
```

---

## 🔄 Actualizaciones

### Para actualizar la aplicación:

```bash
# 1. Hacer backup
cp -r /path/to/vtex-landing-builder /path/to/backup-$(date +%Y%m%d)

# 2. Pull de cambios
cd /path/to/vtex-landing-builder
git pull origin main

# 3. Rebuild
npm run build

# 4. Migraciones de base de datos
cd backend
npx prisma migrate deploy

# 5. Reiniciar aplicación
pm2 restart vtex-landing-builder
```

---

## 📞 Soporte

### Logs Importantes
- **Application**: `./logs/combined.log`
- **Errors**: `./logs/err.log`
- **Nginx**: `/var/log/nginx/error.log`
- **PostgreSQL**: `/var/log/postgresql/`

### Comandos de Diagnóstico
```bash
# Salud de la aplicación
curl http://localhost:3001/health

# Conexión a base de datos
npm run db:studio

# Estado PM2 completo
pm2 show vtex-landing-builder
```

---

## ✅ Checklist Pre-Deploy

- [ ] Base de datos PostgreSQL configurada
- [ ] Variables de entorno configuradas
- [ ] Build exitoso (frontend + backend)
- [ ] PM2 configurado
- [ ] Nginx configurado
- [ ] SSL/TLS configurado (recomendado)
- [ ] Backups automatizados
- [ ] Monitoreo configurado
- [ ] Firewall configurado

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos, tu VTEX Landing Builder estará disponible en:

**Frontend**: `https://tu-dominio.com`  
**Backend API**: `https://tu-dominio.com/api`  
**Health Check**: `https://tu-dominio.com/api/health`

Para soporte técnico o problemas, revisa los logs y la sección de troubleshooting.
