import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { stationsRouter } from "./routes/stations";
import { productsRouter } from "./routes/products";
import { transactionsRouter } from "./routes/transactions";
import { newsRouter } from "./routes/news";
import { profilesRouter } from "./routes/profiles";
import { healthRouter } from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EcoLoop API",
      version: "1.0.0",
      description: `
## EcoLoop REST API

API para la plataforma EcoLoop de gestión de reciclaje y puntos ecológicos.

### Flujo principal:
1. Los usuarios escanean QR en estaciones de reciclaje
2. Se registra la transacción y se asignan EcoPoints
3. Los usuarios redimen puntos en la tienda
      `,
      contact: {
        name: "EcoLoop Team",
        email: "ecoloop@universidad.edu.co",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Servidor de desarrollo",
      },
      {
        url: "http://backend:3001",
        description: "Servidor Docker interno",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT de Supabase Auth",
        },
      },
      schemas: {
        WasteStation: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Estación Principal" },
            location: { type: "string", example: "Edificio A - Planta Baja" },
            description: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Cuaderno Ecológico" },
            description: { type: "string" },
            points_cost: { type: "integer", example: 50 },
            stock: { type: "integer", example: 100 },
            category: { type: "string", example: "Papelería" },
            is_available: { type: "boolean" },
            image_url: { type: "string" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            bin_id: { type: "string", format: "uuid" },
            points_earned: { type: "integer", example: 10 },
            waste_type: {
              type: "string",
              enum: ["recyclable", "non_recyclable", "organic"],
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        NewsArticle: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            content: { type: "string" },
            image_url: { type: "string" },
            published: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Profile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            full_name: { type: "string" },
            role: { type: "string", enum: ["user", "worker", "admin"] },
            eco_points: { type: "integer", example: 150 },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customSiteTitle: "EcoLoop API Docs",
}));

// JSON spec endpoint
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/health", healthRouter);
app.use("/api/stations", stationsRouter);
app.use("/api/products", productsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/news", newsRouter);
app.use("/api/profiles", profilesRouter);

// Root
app.get("/", (_req, res) => {
  res.json({
    message: "🌿 EcoLoop API funcionando",
    version: "1.0.0",
    docs: `/api-docs`,
    endpoints: [
      "GET /api/health",
      "GET /api/stations",
      "GET /api/products",
      "GET /api/transactions",
      "GET /api/news",
      "GET /api/profiles",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EcoLoop Backend corriendo en http://localhost:${PORT}`);
  console.log(`📄 Swagger UI disponible en http://localhost:${PORT}/api-docs`);
});

export default app;
