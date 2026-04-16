# EcoLoop

Proyecto dividido en dos aplicaciones:

- [frontend](frontend): Next.js
- [backend](backend): Express + PostgreSQL

## Contenerizacion

Se incluyen Dockerfiles separados para cada app:

- [frontend/Dockerfile](frontend/Dockerfile)
- [backend/Dockerfile](backend/Dockerfile)

Y un compose raíz para orquestar todo:

- [docker-compose.yml](docker-compose.yml)

### Levantar todo el stack

```bash
docker compose up -d --build
```

Servicios:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

### Apagar stack

```bash
docker compose down
```

### Build de imágenes por separado

```bash
docker build -t juanpyc/ecoloop-frontend:local ./frontend
docker build -t juanpyc/ecoloop-backend:local ./backend
```