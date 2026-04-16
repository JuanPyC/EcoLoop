# EcoLoop Frontend

Proyecto frontend construido con React y Next.js para interactuar con la API del backend de EcoLoop.

## Tecnologías y Versiones

- **Next.js**: 15.5.9
- **React**: 19.2.0
- **Tailwind CSS**: 4.1.9
- **TypeScript**: 5.x
- **Zod**: 3.25.76

## Requisitos Previos

- Node.js 20+
- Docker Engine y Docker Compose para ejecución aislada.

## Variables de Entorno

Puedes configurar la URL de la API del backend creando un archivo `.env` o `.env.local` en este directorio:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_SERVER_URL=http://backend:4000
```

## Ejecutar de forma Local

Para levantar el entorno local, asegúrate de tener instaladas las dependencias:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

El proyecto estará disponible en [http://localhost:3000](http://localhost:3000).

## Ejecutar con Docker

Si prefieres levantar el frontend utilizando Docker de manera individual o en todo el stack:

1. **Utilizando el orquestador principal (Recomendado):**
   Sitúate en la carpeta raíz del proyecto (`../EcoLoop`) y ejecuta el compose:
   ```bash
   docker compose up -d --build
   ```

2. **Construyendo y corriendo la imagen manualmente:**
   Estando dentro de la carpeta `frontend`:
   ```bash
   docker build -t juanpyc/ecoloop-frontend:local .
   docker run -p 3000:3000 juanpyc/ecoloop-frontend:local
   ```
