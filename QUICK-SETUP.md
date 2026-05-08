# 🚀 Configuración Rápida - VTEX Landing Builder

## 📋 Requisitos Inmediatos

Antes de continuar, necesitas:

### 1. Credenciales GitHub
- **Personal Access Token** con permisos de `repo`
- Crear en: https://github.com/settings/tokens

### 2. Credenciales VTEX
- **App Key** y **App Token** con permisos de administrador
- Crear en: Admin VTEX > Account Settings > Apps > App Keys

### 3. (Opcional) API Key OpenAI
- Para análisis IA de landings
- Crear en: https://platform.openai.com/api-keys

---

## ⚙️ Configuración Paso a Paso

### Paso 1: Configurar Backend

```bash
# Editar archivo de configuración
nano backend/.env
```

**Reemplaza estos valores:**

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_TU_GITHUB_TOKEN_AQUI
GITHUB_OWNER=TuUsuarioOUrganizacion
GITHUB_REPO=store-theme

# VTEX Configuration  
VTEX_ACCOUNT=tu-cuenta-vtex
VTEX_APP_KEY=vtexappkey-tu-cuenta-TU_APP_KEY
VTEX_APP_TOKEN=TU_APP_TOKEN_LARGO_AQUI

# OpenAI Configuration (opcional)
OPENAI_API_KEY=sk-TU_OPENAI_KEY_AQUI

# Database (para desarrollo local con SQLite)
DATABASE_URL="file:./dev.db"
```

### Paso 2: Configurar Producción

```bash
# Editar configuración de producción
nano .env.production
```

**Reemplaza estos valores:**

```env
NODE_ENV=production
PORT=3001

# Database (PostgreSQL para producción)
DATABASE_URL="postgresql://usuario:password@tu-host:5432/vtex_landing_builder"

# GitHub Configuration
GITHUB_TOKEN=ghp_TU_GITHUB_TOKEN_PRODUCCION
GITHUB_OWNER=TuUsuarioOUrganizacion
GITHUB_REPO=store-theme

# VTEX Configuration
VTEX_ACCOUNT=tu-cuenta-vtex-produccion
VTEX_APP_KEY=vtexappkey-tu-cuenta-TU_APP_KEY_PROD
VTEX_APP_TOKEN=TU_APP_TOKEN_LARGO_PRODUCCION

# OpenAI Configuration
OPENAI_API_KEY=sk-TU_OPENAI_KEY_PRODUCCION
```

---

## 🧪 Probar Configuración

### 1. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

**Verifica que funcione:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### 2. Probar Servidor de Producción

```bash
# Para Windows
cmd /c "set NODE_ENV=production && node backend\dist\index.js"

# Para Linux/Mac
NODE_ENV=production node backend/dist/index.js
```

---

## 🔧 Configuración Base de Datos

### Opción A: PostgreSQL (Recomendado para producción)

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear base de datos y usuario
sudo -u postgres psql
CREATE USER vtex_landing WITH PASSWORD 'tu_password';
CREATE DATABASE vtex_landing_builder OWNER vtex_landing;
GRANT ALL PRIVILEGES ON DATABASE vtex_landing_builder TO vtex_landing;
\q
```

### Opción B: SQLite (Para desarrollo/testing)

El proyecto ya está configurado para SQLite. Solo asegúrate de:

```bash
# Ejecutar migraciones
cd backend
npx prisma migrate dev
npx prisma generate
```

---

## 🚀 Deploy a Producción

### 1. Servidor Local

```bash
# Iniciar servidor de producción
npm run start:production
```

### 2. Servidor con PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save
pm2 startup
```

### 3. Configurar Nginx (Reverse Proxy)

```nginx
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
    }
}
```

---

## ✅ Verificación Final

### Tests Obligatorios:

1. **✅ Health Check**
   ```bash
   curl http://localhost:3001/health
   # Debe responder: {"status":"ok","timestamp":"..."}
   ```

2. **✅ Frontend Funcional**
   - Visita: http://localhost:3000
   - Verifica que cargue el dashboard

3. **✅ API Endpoints**
   ```bash
   # Probar API de landings
   curl http://localhost:3001/api/landings
   
   # Probar API de VTEX (con credenciales configuradas)
   curl http://localhost:3001/api/vtex/collections
   ```

4. **✅ Deploy Funcional**
   - Crea una landing de prueba
   - Intenta hacer deploy a GitHub
   - Verifica que se cree el PR/commit

---

## 🆘️ Troubleshooting

### Error: "Database connection failed"
```bash
# Verificar conexión
cd backend
npx prisma studio
# O revisar DATABASE_URL en .env
```

### Error: "GitHub configuration missing"
```bash
# Verificar variables
echo $GITHUB_TOKEN
echo $GITHUB_OWNER
echo $GITHUB_REPO
```

### Error: "VTEX credentials not configured"
```bash
# Probar API VTEX
curl -H "X-VTEX-API-AppKey: TU_APP_KEY" \
     -H "X-VTEX-API-AppToken: TU_APP_TOKEN" \
     https://TU_CUENTA.myvtex.com/api/catalog_system/pvt/collection/list
```

---

## 🎯 Checklist Final

- [ ] **GitHub Token** configurado y funcionando
- [ ] **VTEX Credentials** configuradas y probadas
- [ ] **Base de datos** creada y conectada
- [ ] **Servidor desarrollo** funcionando (npm run dev)
- [ ] **Servidor producción** funcionando (npm run start:production)
- [ ] **Health check** respondiendo correctamente
- [ ] **Deploy de prueba** funcionando
- [ ] **Frontend** accesible en producción
- [ ] **Reverse proxy** configurado (opcional)

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs**: `npm run logs:production`
2. **Verifica variables**: `echo $NOMBRE_VARIABLE`
3. **Prueba por separado**: Backend y frontend independientemente
4. **Documentación**: Revisa `docs/PRODUCTION-DEPLOY.md`

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu VTEX Landing Builder estará:

✅ **Totalmente funcional**  
✅ **Configurado para producción**  
✅ **Listo para crear landings**  
✅ **Capaz de deploy automático a VTEX**

**Acceso**:  
- Desarrollo: http://localhost:3000  
- Producción: http://tu-dominio.com  
- API: http://tu-dominio.com/api
