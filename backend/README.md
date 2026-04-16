# EcoLoop Backend (Express + PostgreSQL)

Backend local con Express, autenticacion JWT y base de datos PostgreSQL en Docker.

## Requisitos

- Node.js 20+
- Docker + Docker Compose

## Variables de entorno

Copia `.env.example` a `.env`.

- `PORT`
- `NODE_ENV`
- `FRONTEND_ORIGIN`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Levantar PostgreSQL local

```bash
docker compose up -d
```

Al iniciar por primera vez, PostgreSQL ejecuta:

- [backend/docker/init/001_schema.sql](docker/init/001_schema.sql)
- [backend/docker/init/002_seed.sql](docker/init/002_seed.sql)

Credenciales seeded (password: `password`):

- admin@ecoloop.local
- worker@ecoloop.local
- user@ecoloop.local

## Instalar y ejecutar backend

```bash
npm install
npm run dev
```

API disponible por defecto en `http://localhost:4000`.

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
