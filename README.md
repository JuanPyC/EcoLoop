# EcoLoop

Proyecto dividido en dos aplicaciones:

- [frontend](frontend): Next.js
- [backend](backend): Express + PostgreSQL

## Tecnologías y Versiones

### Frontend
- **Next.js**: 15.5.9
- **React**: 19.2.0
- **Tailwind CSS**: 4.1.9
- **TypeScript**: 5.x

### Backend
- **Node.js**: 20 (Alpine Docker image)
- **Express**: 4.21.2
- **PostgreSQL**: 16 (Imagen Docker) / Driver `pg` 8.16.3

## Contenerizacion

Se incluyen Dockerfiles separados para cada app:

- [frontend/Dockerfile](frontend/Dockerfile)
- [backend/Dockerfile](backend/Dockerfile)

### Levantar todo el stack

```bash
docker compose up -d --build
```

Servicios:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Backend API Docs (Swagger): http://localhost:4000/api-docs
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