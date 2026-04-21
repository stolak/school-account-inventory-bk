import { PrismaClient } from "@prisma/client";

// Create a single PrismaClient instance to be reused across the application
// This prevents connection pool exhaustion
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;

