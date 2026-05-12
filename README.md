# 🌿 EcoLoop

Plataforma web de gestión de reciclaje y recompensas ecológicas. Los usuarios escanean códigos QR en estaciones de reciclaje, acumulan **EcoPoints** y los canjean en una tienda de productos sostenibles.

---

## 📦 Tecnologías y versiones

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Next.js | 15.x |
| Frontend | React | 19.x |
| Frontend | TypeScript | 5.x |
| Frontend | Tailwind CSS | 4.x |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.x |
| Backend | Swagger / OpenAPI | 3.0 |
| Backend | Prisma ORM | 5.x |
| Base de datos | PostgreSQL | 16 |
| Contenedores | Docker | 24+ |
| Orquestación | Docker Compose | 2.x |

---

## 🗂️ Estructura del repositorio

```
EcoLoop/
├── docker-compose.yml        # Orquestación de servicios
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
├── README.md
├── frontend/                 # App Next.js
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── app/                  # Rutas Next.js (App Router)
│   ├── components/           # Componentes React
│   ├── lib/supabase/         # Adaptador local para API (compatible con Supabase)
│   └── public/
├── backend/                  # API Express + Prisma + Swagger
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
   ├── PRISMA_SETUP.md
   ├── prisma/
   │   └── schema.prisma     # Esquema Prisma (mapeo a PostgreSQL)
   └── src/
       ├── index.ts          # Entry point + Swagger config
       ├── infrastructure/
       │   ├── prismaClient.ts
       │   └── repositories/  # Repositorios Prisma
       └── routes/
           ├── health.ts
           ├── auth.ts        # Auth local
           ├── stations.ts
           ├── products.ts
           ├── transactions.ts
           ├── news.ts
           ├── profiles.ts
           └── local.ts       # CRUD genérico para tablas Prisma
└── database/
    └── init.sql              # Esquema + datos de prueba
```

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.x
- PostgreSQL localmente (opcional: Docker se encarga de ello)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/EcoLoop.git
cd EcoLoop
```

### 2. Configurar variables de entorno (opcional)

La configuración local ya está lista en `docker-compose.yml` y `backend/.env`. Si quieres cambiarla:

```bash
cd backend
cp .env.example .env
# DATABASE_URL ya está configurada para PostgreSQL local
```

### 3. Levantar todos los servicios con Docker

```bash
docker compose up --build
```

Esto construye y levanta:
- 🗄️ **PostgreSQL** en `localhost:5432` (usuario: `ecoloop_user`, contraseña: `ecoloop_pass`, BD: `ecoloop`)
- ⚙️ **Backend Express + Prisma** en `http://localhost:3001`
- 🌐 **Frontend Next.js** en `http://localhost:3000`

### 4. Verificar que todo funciona

```bash
# Health check del backend
curl http://localhost:3001/api/health

# Ver la documentación Swagger
open http://localhost:3001/api-docs

# Abrir el frontend
open http://localhost:3000
```

---

## � Credenciales de prueba

Estas cuentas están pre-configuradas en la base de datos para testing:

| Email | Contraseña | Rol | Propósito |
|-------|-----------|-----|----------|
| `admin@ecoloop.com` | `admin123` | Admin | Gestionar estaciones, productos, usuarios |
| `worker@ecoloop.com` | `worker123` | Worker | Monitorear estado de contenedores |
| `user@ecoloop.com` | `user123` | User | Usuario normal para testing |

### Cómo autenticarse

```bash
# Login y obtener JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecoloop.com","password":"admin123"}'

# Respuesta: { token: "eyJ...", user: {...} }

# Usar el token en peticiones autenticadas
TOKEN=eyJ... # copiar token de la respuesta anterior
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/me
```

> ⚠️ **Nota**: Estas credenciales están en el control de versiones solo para desarrollo local. En producción, cambiar todas las contraseñas y eliminar usuarios de prueba.

---

## �🐳 Imágenes en DockerHub

```bash
# Descargar imágenes directamente (sin necesidad de clonar el repo)
docker pull tu-usuario/ecoloop-frontend:latest
docker pull tu-usuario/ecoloop-backend:latest

# Publicar imágenes (solo para mantenedores)
docker build -t tu-usuario/ecoloop-frontend:latest ./frontend
docker push tu-usuario/ecoloop-frontend:latest

docker build -t tu-usuario/ecoloop-backend:latest ./backend
docker push tu-usuario/ecoloop-backend:latest
```

---

## 📋 Comandos Docker útiles

```bash
# Levantar en background
docker compose up -d --build

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (reset completo de BD)
docker compose down -v

# Reconstruir solo un servicio
docker compose up --build backend
```

---

## 📄 Documentación API (Swagger)

Una vez levantado el backend, la documentación interactiva está disponible en:

```
http://localhost:3001/api-docs
```

### Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del sistema y BD |
| GET | `/api/stations` | Listar estaciones de reciclaje |
| POST | `/api/stations` | Crear estación |
| GET | `/api/products` | Listar productos de la tienda |
| POST | `/api/products` | Crear producto |
| GET | `/api/transactions` | Listar transacciones |
| POST | `/api/transactions/scan` | Registrar escaneo QR ← flujo principal |
| GET | `/api/news` | Listar noticias |
| GET | `/api/profiles` | Listar perfiles de usuario |

### Flujo completo de prueba

```bash
# 1. Verificar salud del sistema
curl http://localhost:3001/api/health

# 2. Ver estaciones disponibles
curl http://localhost:3001/api/stations

# 3. Simular escaneo QR (asigna EcoPoints al usuario)
curl -X POST http://localhost:3001/api/transactions/scan \
  -H "Content-Type: application/json" \
  -d '{"user_id": "UUID-DEL-USUARIO", "qr_code": "QR-MAIN-REC-001"}'

# 4. Ver puntos actualizados del usuario
curl http://localhost:3001/api/profiles/UUID-DEL-USUARIO

# 5. Ver productos disponibles en la tienda
curl http://localhost:3001/api/products?available=true
```

---

## 🗄️ Base de datos

El esquema se aplica automáticamente al ejecutar `docker compose up` (Prisma genera las tablas en PostgreSQL). 

**Para desarrollo sin Docker**, aplica la migración manualmente:
```bash
cd backend
export DATABASE_URL='postgresql://usuario:pass@localhost:5432/ecoloop'
npx prisma migrate dev --name init
```

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios (admin, worker, user) |
| `waste_stations` | Estaciones de reciclaje |
| `waste_bins` | Contenedores con código QR |
| `transactions` | Registro de escaneos QR |
| `products` | Productos de la tienda |
| `redemptions` | Canjes de puntos |
| `news_articles` | Artículos de noticias |
| `quizzes` / `quiz_questions` | Sistema de quizzes |

---

## 👥 Historias de usuario

| ID | Historia | Responsable | Estado |
|----|----------|-------------|--------|
| HU-01 | Como usuario, quiero escanear un QR para ganar EcoPoints | [Nombre estudiante] | ✅ |
| HU-02 | Como usuario, quiero ver mi saldo de puntos y transacciones | [Nombre estudiante] | ✅ |
| HU-03 | Como usuario, quiero canjear puntos en la tienda | [Nombre estudiante] | ✅ |
| HU-04 | Como usuario, quiero completar quizzes de reciclaje | [Nombre estudiante] | ✅ |
| HU-05 | Como admin, quiero gestionar estaciones y contenedores | [Nombre estudiante] | ✅ |
| HU-06 | Como admin, quiero gestionar productos de la tienda | [Nombre estudiante] | ✅ |
| HU-07 | Como admin, quiero publicar noticias y contenido | [Nombre estudiante] | ✅ |
| HU-08 | Como worker, quiero ver el estado de los contenedores | [Nombre estudiante] | ✅ |

---

## 🧑‍💻 Desarrollo local (sin Docker)

### Backend (primero)

```bash
cd backend
npm install
# Configurar DATABASE_URL para apuntar a PostgreSQL local
export DATABASE_URL='postgresql://usuario:pass@localhost:5432/ecoloop'
npx prisma generate
npx prisma migrate dev --name init
npm run dev
# Disponible en http://localhost:3001/api-docs (Swagger)
```

### Frontend (segundo)

```bash
cd frontend
npm install --legacy-peer-deps
# NEXT_PUBLIC_API_URL debe apuntar al backend (por defecto http://localhost:3001)
npm run dev
# Disponible en http://localhost:3000
```
