# EcoLoop Backend

Backend construido con Express, autenticacion JWT y conectividad a base de datos PostgreSQL, preparado para contenedores Docker.

## Tecnologías y Versiones

- **Node.js**: 20 (Alpine Docker image)
- **Express**: 4.21.2
- **PostgreSQL**: 16 (Imagen Docker) / Driver `pg` 8.16.3
- **Zod**: 3.25.76
- **JSON Web Token**: 9.0.2
- **Swagger UI Express**: 5.0.1
- **Swagger JSDoc**: 6.2.8

## Requisitos Previos

- Node.js 20+
- Docker Engine y Docker Compose para ejecución aislada.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores de la base de datos si es necesario:

```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://ecoloop:ecoloop@localhost:5432/ecoloop
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=7d
```

## Ejecutar de forma Local

Para correr el backend directamente en tu máquina:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Levantar PostgreSQL localmente:**
   Puedes usar el script incluido para iniciar solo la DB en docker:
   ```bash
   npm run db:up
   ```
   *(Al iniciar por primera vez, ejecutará los seeders `001_schema.sql` y `002_seed.sql`)*. Credenciales de prueba: admin@ecoloop.local, worker@ecoloop.local, user@ecoloop.local (password: `password`).

3. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

El API estará disponible en `http://localhost:4000`.

## Ejecutar con Docker

Para levantar el backend encapsulado en Docker:

1. **Utilizando el orquestador principal (Recomendado):**
   Sitúate en la raíz del proyecto (`../EcoLoop`) e inicia los servicios:
   ```bash
   docker compose up -d --build
   ```
   *Esto levantará el backend conectado a la subnet de Docker del Postgres automáticamente.*

2. **Apagar infraestructura local:**
   ```bash
   npm run db:down
   # O en la raíz: docker compose down
   ```


## Documentación de la API (Swagger)

La API cuenta con documentación interactiva generada con Swagger (OpenAPI 3.0). Una vez iniciado el backend, puedes acceder a ella en tu navegador en:

👉 **[http://localhost:4000/api-docs](http://localhost:4000/api-docs)**

Esta interfaz visual expone detalles de los endpoints y te permite realizar peticiones de prueba (incluso añadiendo tu token JWT en el apartado "Authorize").

## Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/profiles/me`
- `GET /api/profiles/leaderboard`
- `GET /api/profiles/me/transactions`
- `GET /api/stations`
- `GET /api/stations/bins/qr/:qrCode`
- `POST /api/deposits`
- `GET /api/products`
- `POST /api/redemptions`
- `GET /api/redemptions/mine`
- `GET /api/news`
- `GET /api/quizzes`
- `GET /api/quizzes/:quizId/questions`
- `POST /api/quizzes/completions`
- `GET /api/quizzes/completions/mine`
- `GET /api/worker/bins/attention`
- `PATCH /api/worker/bins/:binId/empty`

## Autenticacion

Los endpoints protegidos requieren:

`Authorization: Bearer <access_token>`
