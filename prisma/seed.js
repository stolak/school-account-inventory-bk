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

    // Account subheads (under seeded groups / heads)
    console.log("📑 Seeding account subheads...");
    const accountSubheads = [
      // Assets — Current Assets (head 1)
      { id: 1, groupId: 1, headId: 1, code: "1101", name: "Cash and Bank", status: "Active", rank: 1 },
      { id: 2, groupId: 1, headId: 1, code: "1102", name: "Accounts Receivable", status: "Active", rank: 2 },
      { id: 3, groupId: 1, headId: 1, code: "1103", name: "Inventory", status: "Active", rank: 3 },
      // Assets — Fixed Assets (head 2)
      { id: 4, groupId: 1, headId: 2, code: "1201", name: "Furniture and Fixtures", status: "Active", rank: 4 },
      { id: 5, groupId: 1, headId: 2, code: "1202", name: "ICT Equipment", status: "Active", rank: 5 },
      // Liabilities — Current (head 3)
      { id: 6, groupId: 2, headId: 3, code: "2101", name: "Accounts Payable", status: "Active", rank: 6 },
      { id: 7, groupId: 2, headId: 3, code: "2102", name: "Student Deposits", status: "Active", rank: 7 },
      // Liabilities — Long-term (head 4)
      { id: 8, groupId: 2, headId: 4, code: "2201", name: "Long-term Loans", status: "Active", rank: 8 },
      // Equity (head 5)
      { id: 9, groupId: 3, headId: 5, code: "3101", name: "Capital", status: "Active", rank: 9 },
      { id: 10, groupId: 3, headId: 5, code: "3102", name: "Retained Earnings", status: "Active", rank: 10 },
      // Expenses (head 6)
      { id: 11, groupId: 4, headId: 6, code: "4101", name: "Salaries and Wages", status: "Active", rank: 11 },
      { id: 12, groupId: 4, headId: 6, code: "4102", name: "Consumable Expenses", status: "Active", rank: 12 },
      { id: 13, groupId: 4, headId: 6, code: "4103", name: "Utilities", status: "Active", rank: 13 },
      { id: 14, groupId: 4, headId: 6, code: "4104", name: "Maintenance and Repairs", status: "Active", rank: 14 },
      { id: 15, groupId: 4, headId: 6, code: "4105", name: "Discounts and Concessions", status: "Active", rank: 15 },
      // Income (head 7)
      { id: 16, groupId: 5, headId: 7, code: "5101", name: "Tuition and Fees", status: "Active", rank: 16 },
      { id: 17, groupId: 5, headId: 7, code: "5102", name: "Other Income", status: "Active", rank: 17 },
      { id: 18, groupId: 5, headId: 7, code: "5103", name: "Student Collections", status: "Active", rank: 18 },
    ];

    for (const s of accountSubheads) {
      await prisma.accountSubhead.upsert({
        where: { id: s.id },
        update: {
          groupId: s.groupId,
          headId: s.headId,
          code: s.code,
          name: s.name,
          status: s.status,
          rank: s.rank,
        },
        create: {
          ...s,
          afs: null,
          paymentMethod: null,
        },
      });
    }
    console.log(`   ✓ ${accountSubheads.length} account subheads`);

    // Account charts (ledger accounts under subheads)
    console.log("📊 Seeding account charts...");
    const accountCharts = [
      { id: 1, groupId: 1, headId: 1, subheadId: 1, accountNo: "1101001", accountRef: "CASH-PETTY", accountDescription: "Petty Cash", status: "Active", rank: 1 },
      { id: 2, groupId: 1, headId: 1, subheadId: 1, accountNo: "1101002", accountRef: "CASH-BANK", accountDescription: "Main Bank Account", status: "Active", rank: 2 },
      { id: 3, groupId: 1, headId: 1, subheadId: 2, accountNo: "1102001", accountRef: "AR-STUDENT", accountDescription: "Student Accounts Receivable", status: "Active", rank: 3 },
      { id: 4, groupId: 1, headId: 1, subheadId: 3, accountNo: "1103001", accountRef: "INV-GENERAL", accountDescription: "Inventory - General Stock", status: "Active", rank: 4 },
      { id: 5, groupId: 1, headId: 2, subheadId: 4, accountNo: "1201001", accountRef: "FA-FURN", accountDescription: "Furniture and Fixtures", status: "Active", rank: 5 },
      { id: 6, groupId: 1, headId: 2, subheadId: 5, accountNo: "1202001", accountRef: "FA-ICT", accountDescription: "ICT Equipment", status: "Active", rank: 6 },
      { id: 7, groupId: 2, headId: 3, subheadId: 6, accountNo: "2101001", accountRef: "AP-TRADE", accountDescription: "Trade Payables", status: "Active", rank: 7 },
      { id: 8, groupId: 2, headId: 3, subheadId: 7, accountNo: "2102001", accountRef: "DEP-STUDENT", accountDescription: "Student Deposits Payable", status: "Active", rank: 8 },
      { id: 9, groupId: 2, headId: 4, subheadId: 8, accountNo: "2201001", accountRef: "LT-LOAN", accountDescription: "Long-term Bank Loan", status: "Active", rank: 9 },
      { id: 10, groupId: 3, headId: 5, subheadId: 9, accountNo: "3101001", accountRef: "EQ-CAP", accountDescription: "Capital Account", status: "Active", rank: 10 },
      { id: 11, groupId: 3, headId: 5, subheadId: 10, accountNo: "3102001", accountRef: "EQ-RET", accountDescription: "Retained Earnings", status: "Active", rank: 11 },
      { id: 12, groupId: 4, headId: 6, subheadId: 11, accountNo: "4101001", accountRef: "EXP-SAL", accountDescription: "Staff Salaries", status: "Active", rank: 12 },
      { id: 13, groupId: 4, headId: 6, subheadId: 12, accountNo: "4102001", accountRef: "EXP-CONS", accountDescription: "Consumable Expenses", status: "Active", rank: 13 },
      { id: 14, groupId: 4, headId: 6, subheadId: 13, accountNo: "4103001", accountRef: "EXP-UTIL", accountDescription: "Utilities Expense", status: "Active", rank: 14 },
      { id: 15, groupId: 4, headId: 6, subheadId: 14, accountNo: "4104001", accountRef: "EXP-MAINT", accountDescription: "Maintenance Expense", status: "Active", rank: 15 },
      { id: 16, groupId: 4, headId: 6, subheadId: 15, accountNo: "4105001", accountRef: "EXP-DISC", accountDescription: "Discounts and Concessions", status: "Active", rank: 16 },
      { id: 17, groupId: 5, headId: 7, subheadId: 16, accountNo: "5101001", accountRef: "INC-TUIT", accountDescription: "Tuition Income", status: "Active", rank: 17 },
      { id: 18, groupId: 5, headId: 7, subheadId: 17, accountNo: "5102001", accountRef: "INC-OTHER", accountDescription: "Other Operating Income", status: "Active", rank: 18 },
      { id: 19, groupId: 5, headId: 7, subheadId: 18, accountNo: "5103001", accountRef: "INC-COLL", accountDescription: "Student Fee Collections", status: "Active", rank: 19 },
    ];

    for (const c of accountCharts) {
      await prisma.accountChart.upsert({
        where: { id: c.id },
        update: {
          groupId: c.groupId,
          headId: c.headId,
          subheadId: c.subheadId,
          accountNo: c.accountNo,
          accountRef: c.accountRef,
          accountDescription: c.accountDescription,
          status: c.status,
          rank: c.rank,
        },
        create: c,
      });
    }
    console.log(`   ✓ ${accountCharts.length} account charts`);

    // Default subhead settings (linked to seeded subheads)
    console.log("⚙️ Seeding default subhead settings...");
    const defaultSubheadSettings = [
      {
        settingsId: "STUDENT_SUBHEAD",
        settings: "Default subhead for student-related postings",
        subheadId: 2,
      },
      {
        settingsId: "SUPPLIER_SUBHEAD",
        settings: "Default subhead for supplier-related postings",
        subheadId: 6,
      },
      {
        settingsId: "DISCOUNT_SUBHEAD",
        settings: "Default subhead for discount/concession postings",
        subheadId: 15,
      },
      {
        settingsId: "COLLECTION_SUBHEAD",
        settings: "Default subhead for collection postings",
        subheadId: 18,
      },
      {
        settingsId: "COMSUMABLE_EXPENSE_SUBHEAD",
        settings: "Default subhead for consumable expense postings",
        subheadId: 12,
      },
    ];

    for (const s of defaultSubheadSettings) {
      await prisma.defaulSubheadSettings.upsert({
        where: { settingsId: s.settingsId },
        update: {
          settings: s.settings,
          subheadId: s.subheadId,
        },
        create: s,
      });
    }
    console.log(`   ✓ ${defaultSubheadSettings.length} default subhead settings`);

    // Default account settings (linked to seeded account charts)
    console.log("🏦 Seeding default account settings...");
    const defaultAccountSettings = [
      {
        settingsId: "STUDENT_ACCOUNT",
        settings: "Default account for student account receivable",
        accountId: 3,
      },
      {
        settingsId: "SUPPLIER_ACCOUNT",
        settings: "Default account for direct market Suppliers",
        accountId: 7,
      },
      {
        settingsId: "DISCOUNT_ACCOUNT",
        settings: "Default account for discount/concession postings",
        accountId: 16,
      },
      {
        settingsId: "COLLECTION_ACCOUNT",
        settings: "Default account for collection postings",
        accountId: 19,
      },
      {
        settingsId: "COMSUMABLE_EXPENSE_ACCOUNT",
        settings: "Default account for consumable expense postings",
        accountId: 13,
      },
    ];

    for (const s of defaultAccountSettings) {
      await prisma.defaultAccountSettings.upsert({
        where: { settingsId: s.settingsId },
        update: {
          settings: s.settings,
          accountId: s.accountId,
        },
        create: s,
      });
    }
    console.log(`   ✓ ${defaultAccountSettings.length} default account settings`);

    // UOMs
    console.log("📏 Seeding UOMs...");
    const uoms = [
      {
        id: "5b15389c-3d56-4ec1-b848-43c76d435f35",
        name: "Piece",
        symbol: "pcs",
        status: "Active",
      },
      {
        id: "f331e6b0-e5d3-4c3a-a6af-c46858c3396b",
        name: "Carton",
        symbol: "ctn",
        status: "Active",
      },
      {
        id: "1c152b2e-bd60-418f-b312-08c1b001134a",
        name: "Kilogram",
        symbol: "kg",
        status: "Active",
      },
      {
        id: "7e0ebb54-6fc7-46f0-8853-27e23b2693af",
        name: "Liter",
        symbol: "ltr",
        status: "Active",
      },
    ];

    for (const u of uoms) {
      await prisma.uom.upsert({
        where: { id: u.id },
        update: {
          symbol: u.symbol,
          status: u.status,
        },
        create: u,
      });
    }
    console.log(`   ✓ ${uoms.length} UOMs`);

    // Inventory categories
    console.log("📦 Seeding categories...");
    const categories = [
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901001",
        name: "Office Supplies",
        description: "General office consumables (paper, pens, folders)",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901002",
        name: "Stationery",
        description: "Student and staff stationery items",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901003",
        name: "Cleaning Supplies",
        description: "Janitorial and hygiene consumables",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901004",
        name: "Laboratory Supplies",
        description: "Science lab consumables and chemicals",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901005",
        name: "ICT Equipment",
        description: "Computers, peripherals, and durable IT assets",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901006",
        name: "Furniture",
        description: "Desks, chairs, cabinets, and fixtures",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901007",
        name: "Sports & PE",
        description: "Sports equipment and physical education gear",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: null,
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901008",
        name: "Building & Maintenance",
        description: "Tools, hardware, and maintenance materials",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: null,
      },
    ];

    for (const c of categories) {
      await prisma.category.upsert({
        where: { name: c.name },
        update: {
          description: c.description,
          status: c.status,
          categoryType: c.categoryType,
          consumableAccountId: c.consumableAccountId,
        },
        create: c,
      });
    }
    console.log(`   ✓ ${categories.length} categories`);

    // Sub-categories (linked to seeded categories)
    console.log("📂 Seeding sub-categories...");
    const categoryIds = {
      officeSupplies: "a1b2c3d4-e5f6-4789-a012-345678901001",
      stationery: "a1b2c3d4-e5f6-4789-a012-345678901002",
      cleaningSupplies: "a1b2c3d4-e5f6-4789-a012-345678901003",
      laboratorySupplies: "a1b2c3d4-e5f6-4789-a012-345678901004",
      ictEquipment: "a1b2c3d4-e5f6-4789-a012-345678901005",
      furniture: "a1b2c3d4-e5f6-4789-a012-345678901006",
      sportsPe: "a1b2c3d4-e5f6-4789-a012-345678901007",
      buildingMaintenance: "a1b2c3d4-e5f6-4789-a012-345678901008",
    };

    const subCategories = [
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901001",
        name: "Paper Products",
        description: "Printing paper, notebooks refills, envelopes",
        categoryId: categoryIds.officeSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901002",
        name: "Writing Instruments",
        description: "Pens, markers, highlighters for office use",
        categoryId: categoryIds.officeSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901003",
        name: "Filing and Storage",
        description: "Folders, binders, archive boxes",
        categoryId: categoryIds.officeSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901004",
        name: "Notebooks",
        description: "Exercise books and writing pads",
        categoryId: categoryIds.stationery,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901005",
        name: "Pens and Pencils",
        description: "Student and staff writing supplies",
        categoryId: categoryIds.stationery,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901006",
        name: "Art Supplies",
        description: "Crayons, paints, craft materials",
        categoryId: categoryIds.stationery,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901007",
        name: "Detergents",
        description: "Cleaning liquids and disinfectants",
        categoryId: categoryIds.cleaningSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901008",
        name: "Cleaning Tools",
        description: "Brushes, mops, buckets, cloths",
        categoryId: categoryIds.cleaningSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901009",
        name: "Sanitary Supplies",
        description: "Tissue, soap, hygiene consumables",
        categoryId: categoryIds.cleaningSupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901010",
        name: "Chemicals",
        description: "Lab chemicals and reagents",
        categoryId: categoryIds.laboratorySupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901011",
        name: "Glassware",
        description: "Beakers, test tubes, lab glass",
        categoryId: categoryIds.laboratorySupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901012",
        name: "Lab Safety",
        description: "Gloves, goggles, safety equipment",
        categoryId: categoryIds.laboratorySupplies,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901013",
        name: "Computers",
        description: "Desktops, laptops, tablets",
        categoryId: categoryIds.ictEquipment,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901014",
        name: "Peripherals",
        description: "Keyboards, mice, monitors, printers",
        categoryId: categoryIds.ictEquipment,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901015",
        name: "Networking",
        description: "Routers, cables, network accessories",
        categoryId: categoryIds.ictEquipment,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901016",
        name: "Desks",
        description: "Student and staff desks",
        categoryId: categoryIds.furniture,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901017",
        name: "Chairs",
        description: "Classroom and office seating",
        categoryId: categoryIds.furniture,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901018",
        name: "Storage Cabinets",
        description: "Cabinets, shelves, lockers",
        categoryId: categoryIds.furniture,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901019",
        name: "Team Sports",
        description: "Football, basketball, volleyball gear",
        categoryId: categoryIds.sportsPe,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901020",
        name: "Athletics",
        description: "Track and field equipment",
        categoryId: categoryIds.sportsPe,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901021",
        name: "Gym Equipment",
        description: "Indoor PE and fitness equipment",
        categoryId: categoryIds.sportsPe,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901022",
        name: "Hand Tools",
        description: "Hammers, screwdrivers, wrenches",
        categoryId: categoryIds.buildingMaintenance,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901023",
        name: "Electrical",
        description: "Bulbs, switches, wiring supplies",
        categoryId: categoryIds.buildingMaintenance,
        status: "Active",
      },
      {
        id: "b1c2d3e4-f5a6-4789-b012-345678901024",
        name: "Plumbing",
        description: "Pipes, fittings, plumbing consumables",
        categoryId: categoryIds.buildingMaintenance,
        status: "Active",
      },
    ];

    for (const sc of subCategories) {
      await prisma.subCategory.upsert({
        where: {
          name_categoryId: {
            name: sc.name,
            categoryId: sc.categoryId,
          },
        },
        update: {
          description: sc.description,
          status: sc.status,
        },
        create: sc,
      });
    }
    console.log(`   ✓ ${subCategories.length} sub-categories`);

    // Academic sessions and terms
    console.log("📅 Seeding sessions and terms...");
    const sessions = [
      {
        id: "c1a2b3c4-d5e6-4789-a001-111111111101",
        name: "2024/2025",
        status: "Active",
      },
      {
        id: "c1a2b3c4-d5e6-4789-a001-111111111102",
        name: "2025/2026",
        status: "Active",
      },
      {
        id: "c1a2b3c4-d5e6-4789-a001-111111111103",
        name: "2026/2027",
        status: "Active",
      },
    ];

    const terms = [
      {
        id: "d2b3c4d5-e6f7-4890-b012-222222222201",
        name: "First Term",
        status: "Active",
      },
      {
        id: "d2b3c4d5-e6f7-4890-b012-222222222202",
        name: "Second Term",
        status: "Active",
      },
      {
        id: "d2b3c4d5-e6f7-4890-b012-222222222203",
        name: "Third Term",
        status: "Active",
      },
    ];

    for (const s of sessions) {
      await prisma.session.upsert({
        where: { name: s.name },
        update: { status: s.status },
        create: s,
      });
    }

    for (const t of terms) {
      await prisma.term.upsert({
        where: { name: t.name },
        update: { status: t.status },
        create: t,
      });
    }

    const seededSession = await prisma.session.findUnique({
      where: { name: "2025/2026" },
      select: { id: true },
    });
    const seededTerm = await prisma.term.findUnique({
      where: { name: "Third Term" },
      select: { id: true },
    });

    if (!seededSession || !seededTerm) {
      throw new Error("Failed to resolve seeded session or term for period records");
    }

    const activePeriodStart = new Date("2026-05-01T00:00:00.000Z");
    const activePeriodEnd = new Date("2026-07-31T00:00:00.000Z");

    console.log("🗓️ Seeding active period and default billing period...");
    await prisma.activePeriod.upsert({
      where: { id: "e3c4d5e6-f7a8-4901-c123-333333333301" },
      update: {
        startDate: activePeriodStart,
        endDate: activePeriodEnd,
        sessionId: seededSession.id,
        termId: seededTerm.id,
        updatedAt: new Date(),
      },
      create: {
        id: "e3c4d5e6-f7a8-4901-c123-333333333301",
        startDate: activePeriodStart,
        endDate: activePeriodEnd,
        sessionId: seededSession.id,
        termId: seededTerm.id,
      },
    });

    await prisma.defaultBillingPeriod.upsert({
      where: { id: "f4d5e6f7-a8b9-4012-d234-444444444401" },
      update: {
        startDate: activePeriodStart,
        endDate: activePeriodEnd,
        sessionId: seededSession.id,
        termId: seededTerm.id,
        updatedAt: new Date(),
      },
      create: {
        id: "f4d5e6f7-a8b9-4012-d234-444444444401",
        startDate: activePeriodStart,
        endDate: activePeriodEnd,
        sessionId: seededSession.id,
        termId: seededTerm.id,
      },
    });

    console.log(
      `   ✓ ${sessions.length} sessions, ${terms.length} terms, 1 active period, 1 default billing period`
    );
    console.log(
      `   ✓ Current period: ${seededSession.id} (2025/2026) + ${seededTerm.id} (Third Term)`
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
