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
      {
        name: "AccountCharts",
        description:
          "Ledger account chart lines (CRUD); groupId and headId are derived from subheadId on write",
      },
      {
        name: "AccountTransactions",
        description:
          "Post debit/credit entries; group/head/subhead/accountCode are derived from accountId",
      },
      {
        name: "DefaultSubheadSettings",
        description: "Default subhead settings row — PATCH update only (by settingsId)",
      },
      {
        name: "DefaultAccountSettings",
        description: "Default account settings row — PATCH update only (by settingsId)",
      },
      { name: "BillingItems", description: "Billing item master data (CRUD)" },
      {
        name: "ClassDefaultBillings",
        description: "Default class billing rows (CRUD + bulk create by billingId/amount pairs)",
      },
      {
        name: "ConcessionDiscounts",
        description: "Concessions/discounts with appliesTo billing items (CRUD)",
      },
      {
        name: "TempJournalTransfers",
        description: "Temporary journal transfer entries (CRUD)",
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

const swaggerSpec = swaggerJSDoc(options) as {
  tags?: Array<{ name: string; description?: string }>;
};

/** Ensures stable tag order in the spec (Swagger UI may still alpha-sort unless tagsSorter runs). */
function orderTagsAuthFirstInSpec(spec: { tags?: Array<{ name: string; description?: string }> }) {
  const tags = spec.tags;
  if (!tags?.length) {
    return;
  }
  const byName = new Map(tags.map((t) => [t.name, t] as const));
  const orderedNames = [...byName.keys()].sort((a, b) => {
    if (a === "Auth") {
      return -1;
    }
    if (b === "Auth") {
      return 1;
    }
    return a.localeCompare(b);
  });
  spec.tags = orderedNames.map((n) => byName.get(n)!);
}

orderTagsAuthFirstInSpec(swaggerSpec);

/**
 * Must be fully self-contained: swagger-ui-express embeds only this function in the browser.
 * A helper like `swaggerTagName()` would not exist there and causes "Could not render BaseLayout".
 */
function tagsSorterAuthFirst(a: unknown, b: unknown): number {
  function tagName(t: unknown): string {
    if (typeof t === "string") {
      return t;
    }
    if (t && typeof t === "object") {
      const o = t as { name?: unknown; get?: (k: string) => unknown };
      if (typeof o.name === "string") {
        return o.name;
      }
      if (typeof o.get === "function") {
        const n = o.get("name");
        if (typeof n === "string") {
          return n;
        }
      }
    }
    return String(t);
  }
  const na = tagName(a);
  const nb = tagName(b);
  if (na === "Auth") {
    return -1;
  }
  if (nb === "Auth") {
    return 1;
  }
  return na.localeCompare(nb);
}

export function setupSwagger(app: Express) {
  const swaggerUiOptions = {
    swaggerOptions: {
      tagsSorter: tagsSorterAuthFirst,
      operationsSorter: "alpha",
      persistAuthorization: true,
    },
  };

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
}
