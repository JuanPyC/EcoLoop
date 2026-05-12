# EcoLoop Frontend

Interfaz Next.js para EcoLoop, conectada al backend local Express + Prisma y a PostgreSQL local.

## Arranque local

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init

cd ../frontend
npm install --legacy-peer-deps
npm run dev
```

## Notas

- La autenticación y las consultas se resuelven contra el backend local.
- El estado de sesión vive en una cookie/localStorage propia del frontend.
- La base de datos fuente de verdad es PostgreSQL local.