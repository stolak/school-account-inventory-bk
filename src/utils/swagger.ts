import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Express } from "express";

const BUILD_DIR = process.env.BUILD_DIR ?? "src";
const PORT = process.env.PORT ?? 5001;
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API with Prisma + JWT",
      version: "1.0.0",
      description: "Express API with Prisma ORM, JWT auth, and Swagger docs",
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Banks", description: "Bank management" },
      { name: "Brands", description: "Brand management" },
      { name: "Categories", description: "Category management" },
      { name: "InventoryItems", description: "Inventory item management" },
      { name: "SubCategories", description: "Sub-category management" },
      { name: "Suppliers", description: "Supplier management" },
      { name: "Projects", description: "Project management" },
      { name: "ProjectCollections", description: "Inventory project_collection transactions" },
      { name: "Purchases", description: "Purchase transactions" },
      { name: "SchoolClasses", description: "School class management" },
      { name: "Students", description: "Student management" },
      { name: "SubClasses", description: "Sub class management" },
      { name: "Terms", description: "Term management" },
      { name: "Sessions", description: "Session management" },
      { name: "Stores", description: "Store management" },
      { name: "StoreTransfers", description: "Inter-store inventory transfers" },
      {
        name: "ActivePeriod",
        description: "Active period singleton (session + term + date range)",
      },
      {
        name: "AccountGroups",
        description: "Chart of accounts — top-level account groups (read-only listing)",
      },
      {
        name: "AccountHeads",
        description: "Chart of accounts — account heads under a group (read-only listing)",
      },
      {
        name: "AccountSubheads",
        description: "Chart of accounts — subheads (CRUD); groupId is derived from headId on write",
      },
      { name: "Users", description: "User listing and profile (authenticated)" },
      { name: "Uoms", description: "Unit of measurement (UoM) management" },
      { name: "Donations", description: "Inventory donation transactions" },
      { name: "Dashboard", description: "Dashboard endpoints" },
      { name: "Email", description: "Email management" },
      { name: "Helper", description: "Helper utilities" },
      { name: "Upload", description: "File upload management" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: process.env.API_URL || `http://localhost:${PORT}` }],
  },
  // Ensure all route and controller files are scanned
  apis: [
    // "src/routes/**/*.ts",
    // "src/routes/**/*.js",
    // "src/controllers/**/*.ts",
    // "src/controllers/**/*.js",
    `${BUILD_DIR}/routes/*`,
    `${BUILD_DIR}/controllers/*`,
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI options with alphabetical sorting
  const swaggerUiOptions = {
    swaggerOptions: {
      tagsSorter: "alpha", // Sort tags alphabetically
      operationsSorter: "alpha", // Sort operations within tags alphabetically
    },
  };

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
}
