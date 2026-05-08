# VTEX Landing Page Builder - Resumen del Proyecto

## Descripción General

Sistema completo para crear y desplegar landing pages personalizadas en VTEX IO, compuesto por:
- **Frontend**: React + TypeScript para diseñar landings
- **Backend**: Node.js + Express + Octokit para GitHub API
- **GitHub Actions**: Workflow CI/CD para VTEX

---

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │────▶│    BACKEND      │────▶│    GITHUB       │
│  (React/TSX)    │     │  (Node/Express) │     │  (GitHub API)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                │                        ▼
                                │                 ┌─────────────────┐
                                │                 │  VTEX STORE     │
                                │                 │  (Workspace)    │
                                │                 └─────────────────┘
                                ▼
                        ┌─────────────────┐
                        │   POSTGRESQL    │
                        │   (Prisma ORM)  │
                        └─────────────────┘
```

---

## Flujo Completo de Deploy

### 1. Creación de Landing (Frontend)

**Archivo**: `frontend/src/components/LandingBuilder.tsx`

```typescript
// El usuario crea una landing con:
// - Nombre (ej: "landing 37")
// - Ruta (ej: "landing-37")
// - Bloques (ej: product-summary.shelf con collection ID)

const landing = {
  name: "landing 37",
  route: "/landing-37",
  blocks: [
    {
      id: "uuid-xxx",
      type: "product-summary.shelf",
      props: {
        collection: 158,
        maxItems: 8,
        titleText: "Productos Destacados"
      }
    }
  ]
}
```

### 2. Análisis IA (Backend)

**Endpoint**: `POST /api/github/ai-analyze`
**Archivo**: `backend/src/routes/github.ts`

```typescript
// OpenAI analiza el contenido y sugiere estructura VTEX
const analysis = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: `Eres un experto en VTEX IO Store Framework...`
    },
    {
      role: "user",
      content: `Analiza esta landing page: ${JSON.stringify(landing)}`
    }
  ]
});
```

**Salida esperada**:
- Template: `store.custom#landing-{id}`
- Estructura de bloques VTEX
- Sugerencias de optimización

### 3. Deploy Inteligente (Backend)

**Endpoint**: `POST /api/github/deploy/:landingId`
**Función**: `performIntelligentDeploy()`

#### Paso a paso:

**Step 0**: Verificar credenciales GitHub
```typescript
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'GabrielM1990';
const repo = 'store-theme';
```

**Step 1**: Determinar target branch
```typescript
const targetBranch = workspace === 'customlanding' ? 'customlanding' : 'master';
```

**Step 1.5**: Sincronizar branch (solo para customlanding)
```typescript
// Obtener SHA de master
const { data: masterRef } = await octokit.rest.git.getRef({
  owner, repo, ref: 'heads/master'
});
const masterSha = masterRef.object.sha;

// Actualizar customlanding con master (force reset)
await octokit.rest.git.updateRef({
  owner, repo, ref: 'heads/customlanding',
  sha: masterSha, force: true
});
```

**Step 1.6**: Verificar workflow files (solo lectura)
```typescript
// Verifica que deploy.yml exista (configuración manual)
await octokit.rest.repos.getContent({
  owner, repo, path: '.github/workflows/deploy.yml', ref: branch
});
```

**Step 2**: Leer routes.json actual
```typescript
const { data: routesData } = await octokit.rest.repos.getContent({
  owner, repo, path: 'store/routes.json', ref: targetBranch
});
const currentRoutes = JSON.parse(
  Buffer.from(routesData.content, 'base64').toString('utf-8')
);
```

**Step 3**: Mergear nueva ruta
```typescript
const newRoute = {
  [`store.custom#landing-${landing.id}`]: {
    path: "/landing-37"  // IMPORTANTE: debe empezar con /
  }
};
const updatedRoutes = { ...currentRoutes, ...newRoute };
```

**Step 4**: Preparar bloques

**Transformación especial para `product-summary.shelf`**:
```typescript
// El frontend envía: type: "product-summary.shelf"
// VTEX necesita: type: "list-context.product-list"

const transformedBlocks = validBlocks.map((block) => {
  if (block.type === 'product-summary.shelf') {
    return {
      ...block,
      type: 'list-context.product-list',
      originalType: 'product-summary.shelf'
    };
  }
  return block;
});
```

**Step 5-6.5**: Preparar contenido de archivos (sin commitear aún)

**Step 7**: Commit CONJUNTO con Git API
```typescript
// Usar createCommitWithMultipleFiles para atomicidad
const filesToCommit = [
  { path: 'store/routes.json', content: routesContent },
  { path: `store/blocks/${jsonBlocksFileName}`, content: blocksContentStr },
  { path: 'docs/README.md', content: docsContent }
];

const commitSha = await createCommitWithMultipleFiles(
  octokit, owner, repo, targetBranch,
  `🚀 Deploy landing "${landing.name}" [${workspace}]`,
  filesToCommit
);
```

### 4. GitHub Actions Trigger

**Archivo**: `.github/workflows/deploy.yml`

```yaml
name: Deploy VTEX Theme

on:
  push:
    branches: [main, master, customlanding]

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install VTEX Toolbelt
        run: npm install -g vtex@latest
      
      - name: Determine workspace
        id: workspace
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/customlanding" ]]; then
            echo "workspace=customlanding" >> $GITHUB_OUTPUT
          else
            echo "workspace=master" >> $GITHUB_OUTPUT
          fi
      
      - name: Login to VTEX
        uses: vtex/action-toolbelt@v3
        with:
          account: ${{ secrets.VTEX_ACCOUNT }}
          appKey: ${{ secrets.VTEX_APP_KEY }}
          appToken: ${{ secrets.VTEX_APP_TOKEN }}
          workspace: ${{ steps.workspace.outputs.workspace }}
          authenticate: true
      
      - name: Deploy/Publish
        run: |
          if [[ "${{ steps.workspace.outputs.workspace }}" == "master" ]]; then
            vtex deploy --yes           # Producción
          else
            vtex publish --yes --tag ${{ steps.workspace.outputs.workspace }}  # Dev
          fi
```

### 5. Estructura de Archivos Generados

**`store/routes.json`**:
```json
{
  "store.custom#landing-cmosz3g2n0000uyddur2wuckv": {
    "path": "/landing-37"
  },
  "store.custom#otra-landing": {
    "path": "/otra-landing"
  }
}
```

**`store/blocks/landing-{id}.json`**:
```json
{
  "store.custom#landing-cmosz3g2n0000uyddur2wuckv": {
    "blocks": [
      "list-context.product-list#8c7ef8ba-52b1-49ea-acb8-26edf8abcbf5"
    ]
  },
  "slider-layout#8c7ef8ba-52b1-49ea-acb8-26edf8abcbf5-slider": {
    "props": {
      "itemsPerPage": { "desktop": 4, "tablet": 3, "phone": 1 },
      "infinite": true,
      "showNavigationArrows": "desktopOnly",
      "showPaginationDots": "mobileOnly",
      "fullWidth": false,
      "blockClass": "shelf"
    }
  },
  "list-context.product-list#8c7ef8ba-52b1-49ea-acb8-26edf8abcbf5": {
    "props": {
      "collection": "158",  // String para VTEX
      "maxItems": 8,
      "titleText": "Productos Destacados",
      "hideOutOfStockItems": true,
      "orderBy": "OrderByTopSaleDESC"
    },
    "blocks": ["product-summary.shelf"],
    "children": ["slider-layout#8c7ef8ba-52b1-49ea-acb8-26edf8abcbf5-slider"]
  }
}
```

---

## Estructura de Bloques VTEX

### Mapeo Frontend → VTEX

| Frontend | VTEX Real | Estructura Generada |
|----------|-----------|---------------------|
| `product-summary.shelf` | `list-context.product-list` + `slider-layout` | Productos en slider con colección |
| `flex-layout.row` | `flex-layout.row` | Contenedor horizontal |
| `rich-text` | `rich-text` | Texto HTML |
| `image` | `image` | Imagen estática |
| `list-context.image-list` | `list-context.image-list` + `slider-layout` | Carrusel de imágenes |

### Product Shelf (Caso Especial)

```typescript
// Transformación completa para product-summary.shelf:

// 1. El bloque se convierte en list-context.product-list
blocks: ['product-summary.shelf']
children: ['slider-layout#{id}-slider']

// 2. Se agrega el slider-layout automáticamente
'slider-layout#{id}-slider': {
  props: {
    itemsPerPage: { desktop: 4, tablet: 3, phone: 1 },
    infinite: true,
    showNavigationArrows: 'desktopOnly',
    showPaginationDots: 'mobileOnly',
    fullWidth: false,
    blockClass: 'shelf'
  }
}

// 3. Collection se convierte a STRING (requerido por VTEX)
props: {
  collection: String(block.props.collection),  // "158" en vez de 158
  maxItems: 8,
  ...
}
```

---

## Configuración Requerida

### Variables de Entorno (Backend)

```bash
# .env
DATABASE_URL="postgresql://user:pass@localhost:5432/vtex_landings"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
VTEX_ACCOUNT="tiendauno"
VTEX_APP_KEY="vtexappkey-tiendauno-XXXXXX"
VTEX_APP_TOKEN="TOKEN_LARGO_AQUI"
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"
```

### Secrets de GitHub (Repositorio)

```yaml
# Settings > Secrets and variables > Actions

VTEX_ACCOUNT: "tiendauno"
VTEX_APP_KEY: "vtexappkey-tiendauno-XXXXXX"
VTEX_APP_TOKEN: "TOKEN_LARGO_AQUI"
```

---

## Workspaces VTEX

| Workspace | Rama GitHub | Comando VTEX | URL |
|-----------|-------------|--------------|-----|
| `master` | `master` | `vtex deploy --yes` | `https://tiendauno.myvtex.com/landing-37` |
| `customlanding` | `customlanding` | `vtex publish --yes --tag customlanding` | `https://customlanding--tiendauno.myvtex.com/landing-37` |

---

## Errores Comunes y Soluciones

### Error: "App not published"
```
Error: Error patching publication metadata... App not published
```
**Causa**: Intentar `vtex deploy` en workspace de desarrollo sin publicar primero.
**Solución**: Usar `vtex publish --yes --tag customlanding` para workspaces != master.

### Error: "Unexpected argument: customlanding"
```
📦 Publishing to development workspace: customlanding
 ›   Error: Unexpected argument: customlanding
```
**Causa**: Workflow antiguo que pasaba el workspace como argumento.
**Solución**: Actualizar `deploy.yml` con el contenido correcto (sin pasar workspace al comando).

### Error: "Not Found" al actualizar workflow
```
❌ Error updating deploy.yml: Not Found
```
**Causa**: La rama se sincronizó desde master después de actualizar el workflow.
**Solución**: Configurar `deploy.yml` manualmente en GitHub (no vía API).

### Error: Missing `collection` in product list
```
⚠️ No collection found for product list
```
**Causa**: El bloque `product-summary.shelf` no tiene propiedad `collection`.
**Solución**: Agregar `collection` como número entero en el frontend (se convierte a string en backend).

---

## Endpoints del Backend

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/landings` | GET | Listar todas las landings |
| `/api/landings` | POST | Crear nueva landing |
| `/api/landings/:id` | GET | Obtener landing específica |
| `/api/landings/:id` | PUT | Actualizar landing |
| `/api/landings/:id` | DELETE | Eliminar landing |
| `/api/github/ai-analyze` | POST | Analizar landing con OpenAI |
| `/api/github/deploy/:landingId` | POST | Deploy inteligente a VTEX |
| `/api/github/preview/:landingId` | POST | Generar preview JSON |

---

## Estructura de Directorios

```
vtex-landing-builder/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── github.ts          # Lógica de deploy
│   │   │   └── landings.ts        # CRUD landings
│   │   ├── lib/
│   │   │   └── components.ts      # Definición de bloques VTEX
│   │   ├── index.ts               # Entry point
│   │   └── db.ts                  # Prisma client
│   └── prisma/
│       └── schema.prisma          # Modelo de datos
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingBuilder.tsx # Constructor visual
│   │   │   └── BlockEditor.tsx    # Editor de bloques
│   │   └── lib/
│   │       └── components.ts      # Tipos de bloques frontend
├── github-actions-template.yml     # Template workflow
└── PROJECT_SUMMARY.md              # Este archivo
```

---

## Notas de Implementación

1. **Commits Atómicos**: Se usa `createCommitWithMultipleFiles` para commit conjunto de routes + blocks + docs, evitando múltiples workflows simultáneos.

2. **Sincronización de Ramas**: Para `customlanding`, siempre se hace `force reset` desde `master` antes de commitear, para asegurar que tenga el workflow correcto.

3. **Transformación de Bloques**: Los bloques del frontend (`product-summary.shelf`) se transforman a la estructura VTEX real (`list-context.product-list`) en el backend.

4. **Collection como String**: VTEX requiere que `collection` sea string, no número. El backend hace `String(block.props.collection)`.

5. **Rutas con Slash**: Las rutas VTEX deben empezar con `/` (ej: `/landing-37`, no `landing-37`).

---

## Flujo de Datos Completo

```
Usuario crea landing (Frontend)
    │
    ▼
POST /api/landings → Guarda en PostgreSQL
    │
    ▼
Usuario clickea "Deploy"
    │
    ▼
POST /api/github/ai-analyze → OpenAI sugiere estructura
    │
    ▼
POST /api/github/deploy/:id
    │
    ├──▶ Step 1.5: Sync customlanding ← master
    │
    ├──▶ Step 1.6: Verificar workflow files
    │
    ├──▶ Step 2-6.5: Preparar JSONs (routes, blocks, docs)
    │         ├── Transformar product-summary.shelf → list-context.product-list
    │         ├── Agregar slider-layout automáticamente
    │         └── Convertir collection a string
    │
    ├──▶ Step 7: Commit conjunto Git API
    │         ├── store/routes.json
    │         ├── store/blocks/landing-{id}.json
    │         └── docs/README.md
    │
    ▼
GitHub Actions se dispara
    │
    ├──▶ Checkout código
    ├──▶ Setup Node + VTEX Toolbelt
    ├──▶ Determinar workspace (master vs customlanding)
    ├──▶ Login VTEX (action-toolbelt)
    │
    └──▶ Deploy/Publish
              ├── master → vtex deploy --yes
              └── customlanding → vtex publish --yes --tag customlanding
    │
    ▼
Landing visible en VTEX
    │
    ├── https://tiendauno.myvtex.com/landing-37 (master)
    └── https://customlanding--tiendauno.myvtex.com/landing-37 (customlanding)
```

---

## Contacto y Soporte

Para issues relacionados con:
- **GitHub API**: Verificar token y permisos del repo
- **VTEX Deploy**: Verificar credenciales en GitHub Secrets
- **OpenAI**: Verificar API key y límites de rate
- **Base de datos**: Verificar DATABASE_URL y migraciones Prisma

---

*Documento generado el 6 de Mayo de 2026*
*Proyecto: VTEX Landing Page Builder*
