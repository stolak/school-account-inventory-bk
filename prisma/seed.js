const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash("12345", 10);

    await prisma.user.upsert({
      where: { email: "admin@admin.com" },
      update: {
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        userType: "Admin",
        role: "Admin",
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: "active",
      },
      create: {
        id: "77e7a005-b0a5-4a6e-897c-f827333924d4",
        email: "admin@admin.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        userType: "Admin",
        role: "Admin",
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: "active",
      },
    });

    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        userType: "Admin",
        role: "Admin",
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: "active",
      },
      create: {
        id: "39fc583a-a071-49f3-980f-8932fa6cb6c9",
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        userType: "Admin",
        role: "Admin",
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: "active",
      },
    });

    // Chart of accounts — AccountGroup & AccountHead (fixed IDs for idempotent re-seeding)
    console.log("📒 Seeding account groups and account heads...");

    const accountGroups = [
      { id: 1, name: "Assets", rank: 1 },
      { id: 2, name: "Liabilities", rank: 2 },
      { id: 3, name: "Equity", rank: 3 },
      { id: 4, name: "Expenses", rank: 4 },
      { id: 5, name: "Incomes", rank: 5 },
    ];

    for (const g of accountGroups) {
      await prisma.accountGroup.upsert({
        where: { id: g.id },
        update: { name: g.name, rank: g.rank },
        create: g,
      });
    }

    const accountHeads = [
      { id: 1, groupId: 1, code: "11", name: "Current Assets", rank: 1 },
      { id: 2, groupId: 1, code: "12", name: "Fixed Assets", rank: 2 },
      { id: 3, groupId: 2, code: "21", name: "Current Liabilities", rank: 3 },
      { id: 4, groupId: 2, code: "22", name: "Long-term Liabilities", rank: 4 },
      { id: 5, groupId: 3, code: "31", name: "Equity/Capital", rank: 5 },
      { id: 6, groupId: 4, code: "41", name: "Expenses", rank: 6 },
      { id: 7, groupId: 5, code: "51", name: "Income", rank: 7 },
    ];

    for (const h of accountHeads) {
      await prisma.accountHead.upsert({
        where: { id: h.id },
        update: {
          groupId: h.groupId,
          code: h.code,
          name: h.name,
          rank: h.rank,
        },
        create: h,
      });
    }

    console.log(
      `   ✓ ${accountGroups.length} account groups, ${accountHeads.length} account heads`
    );

    // Create merchant users for each merchant
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
