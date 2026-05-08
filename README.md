# VTEX Landing Builder

Herramienta externa independiente para la creación, edición y despliegue de landing pages autoadministrables en tiendas VTEX IO mediante una interfaz visual de tipo "drag and drop".

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    HERRAMIENTA EXTERNA                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Frontend   │  │   Backend   │  │    Base     │          │
│  │  (React)   │──│ (Node.js)   │──│   de Datos  │          │
│  │             │  │             │  │ (PostgreSQL)│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  GitHub (Repositorio del Theme)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /blocks/nombre-landing.jsonc                         │  │
│  │  /store/routes.json (actualizado)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Workflow: Deploy VTEX Theme                           │  │
│  │  ├── vtex login (con App Key/Token)                   │  │
│  │  └── vtex deploy --yes                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   VTEX IO (Producción)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Landing page publicada en: /ruta-elegida            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Requisitos Previos

- **Node.js** 18+ 
- **PostgreSQL** 13+
- **Cuenta VTEX IO** con acceso administrativo
- **Repositorio GitHub** con el theme de la tienda

## Configuración de VTEX

### 1. Generar App Key y App Token

1. Ve a **Account Settings** > **Apps** > **App Keys** en el Admin VTEX
2. Genera un nuevo par de credenciales
3. Guarda el **App Key** y **App Token** de forma segura
4. Asegúrate de que tengan permisos de **administrador**

### 2. Configurar GitHub Actions en tu Theme

En tu repositorio del theme VTEX, agrega el archivo `.github/workflows/deploy.yml` (incluido en este proyecto) y configura los secrets:

```bash
# En tu repositorio del theme VTEX, ve a Settings > Secrets and variables > Actions
# Agrega los siguientes secrets:
VTEX_ACCOUNT=tu-cuenta-vtex
VTEX_APP_KEY=tu-app-key
VTEX_APP_TOKEN=tu-app-token
```

## Instalación

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd vtex-landing-builder

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar variables de entorno

#### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/vtex_landing_builder"

# Server
PORT=3001

# GitHub Configuration (Personal Access Token con permisos de repo)
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=nombre-de-tu-org
GITHUB_REPO=nombre-del-repo-theme

# VTEX Configuration
VTEX_ACCOUNT=tu-cuenta-vtex
VTEX_APP_KEY=tu-app-key
VTEX_APP_TOKEN=tu-app-token
```

### 3. Configurar base de datos

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Iniciar el desarrollo

```bash
# En la raíz del proyecto
npm run install:all

# Iniciar backend y frontend en modo desarrollo
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Uso

### Crear una Landing Page

1. **Accede al Dashboard**: Ve a http://localhost:3000
2. **Nueva Landing**: Haz clic en "Crear Nueva Landing"
3. **Configura la página**:
   - Nombre interno (solo para referencia)
   - URL de la página (ej: `ofertas-black-friday`)
4. **Agrega componentes**: Arrastra desde el panel izquierdo al canvas:
   - **Layout**: Filas y columnas
   - **Contenido**: Texto enriquecido, imágenes
   - **Productos**: Vitrinas de productos (con selector de colecciones)
   - **Medios**: Carruseles de banners
5. **Configura propiedades**: Selecciona cada bloque y edita sus propiedades en el panel derecho
6. **Guarda**: Haz clic en "Guardar Borrador"
7. **Despliega**: Haz clic en "Deploy a Producción"

### Flujo de Despliegue

Cuando haces clic en "Deploy a Producción":

1. La herramienta genera los archivos JSON para VTEX
2. Commite los archivos al repositorio del theme:
   - `blocks/landing-{id}.jsonc` - Template de la página
   - Actualiza `store/routes.json` - Definición de la ruta
3. GitHub Actions detecta el push y ejecuta `vtex deploy`
4. La landing está disponible en `https://tu-tienda.com/tu-ruta` en 3-5 minutos

## Estructura de Archivos Generados

### Template de Bloques (`blocks/landing-{id}.jsonc`)

```jsonc
{
  "store.custom#landing-abc123": {
    "blocks": [
      "slider-layout#hero-principal",
      "rich-text#titulo-bienvenida",
      "product-shelf#destacados"
    ]
  },
  "slider-layout#hero-principal": {
    "props": {
      "items": [...],
      "autoplay": { "timeout": 5000 }
    }
  },
  "rich-text#titulo-bienvenida": {
    "props": {
      "text": "## Bienvenido",
      "textAlignment": "CENTER"
    }
  },
  "product-shelf#destacados": {
    "props": {
      "collection": 123,
      "maxItems": 8
    }
  }
}
```

### Ruta (`store/routes.json`)

```json
{
  "store.custom#landing-abc123": {
    "path": "/ofertas-black-friday"
  }
}
```

## Componentes Disponibles

| Componente | Descripción | Propiedades |
|------------|-------------|-------------|
| `flex-layout.row` | Fila contenedora | backgroundColor, padding |
| `flex-layout.col` | Columna contenedora | width, padding |
| `rich-text` | Texto enriquecido | text, textAlignment, textColor |
| `image` | Imagen | src, alt, maxHeight, link |
| `product-shelf` | Vitrina de productos | collection, maxItems, titleText, orderBy |
| `slider-layout` | Carrusel de banners | items, autoplay, arrows, dots |

## Scripts Disponibles

```bash
# Instalar todas las dependencias
npm run install:all

# Desarrollo
npm run dev                    # Iniciar backend + frontend
npm run dev:backend            # Solo backend
npm run dev:frontend           # Solo frontend

# Build
npm run build                  # Build backend + frontend
npm run build:backend          # Solo backend
npm run build:frontend         # Solo frontend

# Base de datos
npm run db:generate           # Generar Prisma client
npm run db:migrate            # Ejecutar migraciones

# Producción
npm run setup:production      # Script completo de setup
npm run start:production      # Iniciar servidor de producción
npm run logs:production       # Ver logs PM2
npm run restart:production    # Reiniciar aplicación
```

## Variables de Entorno

### Backend

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí |
| `GITHUB_TOKEN` | Personal Access Token de GitHub | Sí |
| `GITHUB_OWNER` | Dueño del repositorio (org o user) | Sí |
| `GITHUB_REPO` | Nombre del repositorio del theme | Sí |
| `VTEX_ACCOUNT` | Nombre de cuenta VTEX | Sí |
| `VTEX_APP_KEY` | App Key VTEX | Sí |
| `VTEX_APP_TOKEN` | App Token VTEX | Sí |
| `OPENAI_API_KEY` | API Key para análisis IA | Opcional |

## Troubleshooting

### Error: "Failed to fetch collections"

Verifica que las credenciales VTEX estén configuradas correctamente en `backend/.env` y que el App Key tenga permisos de lectura sobre el catálogo.

### Error: "GitHub configuration missing"

Asegúrate de tener configurado `GITHUB_TOKEN`, `GITHUB_OWNER` y `GITHUB_REPO` en las variables de entorno del backend.

### Deploy no se ejecuta

Verifica que:
1. Los secrets `VTEX_ACCOUNT`, `VTEX_APP_KEY` y `VTEX_APP_TOKEN` estén configurados en el repositorio del theme
2. El App Key tenga permisos de deploy
3. La rama `main` o `master` tenga el workflow correcto

## 🚀 Deploy a Producción

Para desplegar en producción, sigue la guía completa:

**📖 [Guía de Producción](docs/PRODUCTION-DEPLOY.md)**

### Comandos Rápidos

```bash
# Setup completo de producción
npm run setup:production

# Iniciar servidor de producción
npm run start:production

# Ver logs
npm run logs:production
```

### Requisitos de Producción

- **Base de datos**: PostgreSQL 13+
- **Node.js**: 18+
- **PM2**: Para gestión de procesos
- **Nginx**: Reverse proxy (recomendado)

## Roadmap

### Fase 1 (MVP) ✅
- [x] Editor drag-and-drop básico
- [x] Componentes: banner, texto, shelf
- [x] Guardado de borradores
- [x] Deploy a producción
- [x] TypeScript mejorado
- [x] Variables de entorno configuradas

### Fase 2 (Mejoras UX)
- [ ] Preview responsive real
- [ ] Selector visual de colecciones mejorado
- [ ] Editor de imágenes con crop
- [ ] Testing automatizado

### Fase 3 (Escalamiento)
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Logs de despliegue detallados
- [ ] Rollback de versiones

## Licencia

MIT
