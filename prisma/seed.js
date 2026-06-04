const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const SUPPLIER_SUBHEAD_SETTINGS_ID = "SUPPLIER_SUBHEAD";

/** Mirror SupplierService.createSupplier — ledger under SUPPLIER_SUBHEAD (Accounts Payable). */
async function ensureSupplierLedgerAccount(supplier) {
  const defaultSubhead = await prisma.defaulSubheadSettings.findUnique({
    where: { settingsId: SUPPLIER_SUBHEAD_SETTINGS_ID },
    select: { subheadId: true },
  });
  if (!defaultSubhead?.subheadId) {
    return null;
  }

  const subhead = await prisma.accountSubhead.findUnique({
    where: { id: defaultSubhead.subheadId },
    select: { id: true, groupId: true, headId: true },
  });
  if (!subhead) {
    return null;
  }

  const accountDescription = supplier.name.trim();
  const byRef = await prisma.accountChart.findFirst({
    where: { subheadId: subhead.id, accountRef: supplier.id },
    select: { id: true },
  });

  if (byRef) {
    await prisma.accountChart.update({
      where: { id: byRef.id },
      data: {
        accountDescription,
        status: supplier.status,
        groupId: subhead.groupId,
        headId: subhead.headId,
      },
    });
    return byRef.id;
  }

  const byDescription = await prisma.accountChart.findFirst({
    where: { subheadId: subhead.id, accountDescription },
    select: { id: true, accountRef: true },
  });

  if (byDescription) {
    await prisma.accountChart.update({
      where: { id: byDescription.id },
      data: {
        accountRef: supplier.id,
        status: supplier.status,
        groupId: subhead.groupId,
        headId: subhead.headId,
      },
    });
    return byDescription.id;
  }

  const maxRank = await prisma.accountChart.aggregate({
    where: { subheadId: subhead.id },
    _max: { rank: true },
  });

  const created = await prisma.accountChart.create({
    data: {
      groupId: subhead.groupId,
      headId: subhead.headId,
      subheadId: subhead.id,
      accountDescription,
      accountRef: supplier.id,
      accountNo: null,
      rank: (maxRank._max.rank ?? 0) + 1,
      status: supplier.status,
    },
  });
  return created.id;
}

const STUDENT_SUBHEAD_SETTINGS_ID = "STUDENT_SUBHEAD";

/** Mirror StudentService.createStudent — ledger under STUDENT_SUBHEAD (Accounts Receivable). */
async function ensureStudentLedgerAccount(student) {
  const defaultSubhead = await prisma.defaulSubheadSettings.findUnique({
    where: { settingsId: STUDENT_SUBHEAD_SETTINGS_ID },
    select: { subheadId: true },
  });
  if (!defaultSubhead?.subheadId) {
    return null;
  }

  const subhead = await prisma.accountSubhead.findUnique({
    where: { id: defaultSubhead.subheadId },
    select: { id: true, groupId: true, headId: true },
  });
  if (!subhead) {
    return null;
  }

  const accountDescription =
    `${student.firstName} ${student.lastName} (${student.admissionNumber})`.trim();
  const chartStatus = student.status === "Active" ? "Active" : "Inactive";

  const byRef = await prisma.accountChart.findFirst({
    where: { subheadId: subhead.id, accountRef: student.id },
    select: { id: true },
  });

  let accountId;
  if (byRef) {
    await prisma.accountChart.update({
      where: { id: byRef.id },
      data: {
        accountDescription,
        status: chartStatus,
        groupId: subhead.groupId,
        headId: subhead.headId,
      },
    });
    accountId = byRef.id;
  } else {
    const byDescription = await prisma.accountChart.findFirst({
      where: { subheadId: subhead.id, accountDescription },
      select: { id: true },
    });

    if (byDescription) {
      await prisma.accountChart.update({
        where: { id: byDescription.id },
        data: {
          accountRef: student.id,
          status: chartStatus,
          groupId: subhead.groupId,
          headId: subhead.headId,
        },
      });
      accountId = byDescription.id;
    } else {
      const maxRank = await prisma.accountChart.aggregate({
        where: { subheadId: subhead.id },
        _max: { rank: true },
      });

      const created = await prisma.accountChart.create({
        data: {
          groupId: subhead.groupId,
          headId: subhead.headId,
          subheadId: subhead.id,
          accountDescription,
          accountRef: student.id,
          accountNo: null,
          rank: (maxRank._max.rank ?? 0) + 1,
          status: chartStatus,
        },
      });
      accountId = created.id;
    }
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { accountId },
  });

  return accountId;
}

function splitStaffName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Mirror StaffService.createStaffWithUser — linked User + Staff row. */
async function upsertStaffWithUser(hashedPassword, input) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedStaffNumber = input.StaffNumber.trim();
  const normalizedName = input.name.trim();
  const { firstName, lastName } = splitStaffName(normalizedName);

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      password: hashedPassword,
      firstName,
      lastName,
      userType: input.userType ?? "Staff",
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      isDeleted: false,
      status: "active",
    },
    create: {
      id: input.userId,
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      userType: input.userType ?? "Staff",
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      isDeleted: false,
      status: "active",
      createdById: input.createdById,
    },
  });

  const position = input.position ?? input.role ?? "teacher";
  const staffData = {
    email: normalizedEmail,
    name: normalizedName,
    position,
    employmentType: input.employmentType ?? "Permanent",
    status: input.status ?? "Active",
    profileImageUrl: input.profileImageUrl ?? null,
    createdById: input.createdById,
    userId: user.id,
    gradeLevelId: input.gradeLevelId ?? null,
    departmentId: input.departmentId ?? null,
    step: input.step ?? 0,
    salary: input.salary ?? 0,
    dateOfBirth: input.dateOfBirth ?? null,
    dateOfAppointment: input.dateOfAppointment ?? null,
    dateOfResignation: input.dateOfResignation ?? null,
    dateOfTermination: input.dateOfTermination ?? null,
  };

  await prisma.staff.upsert({
    where: { StaffNumber: normalizedStaffNumber },
    update: staffData,
    create: {
      id: input.id,
      StaffNumber: normalizedStaffNumber,
      ...staffData,
    },
  });
}

/** Seed Bank rows from banks.json (bankCode, bankName; optional id from file). */
async function seedBanks() {
  const banksPath = path.join(__dirname, "..", "banks.json");
  if (!fs.existsSync(banksPath)) {
    console.warn("   ⚠ banks.json not found — skipping bank seed");
    return { seeded: 0, skipped: 0 };
  }

  const raw = JSON.parse(fs.readFileSync(banksPath, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("banks.json must be a JSON array");
  }

  const seenCodes = new Set();
  let seeded = 0;
  let skipped = 0;

  for (const row of raw) {
    const bankCode = String(row.bankCode ?? "").trim();
    const bankName = String(row.bankName ?? "").trim();
    if (!bankCode || !bankName) {
      skipped += 1;
      continue;
    }
    if (seenCodes.has(bankCode)) {
      skipped += 1;
      continue;
    }
    seenCodes.add(bankCode);

    const id =
      typeof row.id === "string" && /^[0-9a-f-]{36}$/i.test(row.id.trim())
        ? row.id.trim()
        : undefined;

    await prisma.bank.upsert({
      where: { bankCode },
      update: { bankName },
      create: {
        ...(id ? { id } : {}),
        bankCode,
        bankName,
      },
    });
    seeded += 1;
  }

  return { seeded, skipped };
}

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
        userType: "SuperAdmin",
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
        userType: "SuperAdmin",
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
        userType: "SuperAdmin",
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
        userType: "SuperAdmin",
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: "active",
      },
    });

    console.log("🏦 Seeding banks from banks.json...");
    const { seeded: banksSeeded, skipped: banksSkipped } = await seedBanks();
    console.log(`   ✓ ${banksSeeded} banks (${banksSkipped} skipped)`);

    // Privileges (RBAC) — derived from API routes in src/routes (excludes auth)
    console.log("🔐 Seeding privileges...");
    // Do not hard-code IDs here; older databases may already contain rows with those IDs.
    // We upsert by unique `name` and let Prisma/DB handle the primary key.
    const priv = (name, description) => ({ name, description });

    const crud = (resource, routePrefix, label) => [
      priv(`${resource}.read`, `${label}: list and view (GET ${routePrefix})`),
      priv(`${resource}.write`, `${label}: create and update (POST/PUT/PATCH ${routePrefix})`),
      priv(`${resource}.delete`, `${label}: delete (DELETE ${routePrefix})`),
    ];

    const privileges = [
      // —— Users (/users) ——
      priv("users.read", "List/view users, privileges, menus, store access (GET /users…)"),
      priv(
        "users.privileges.manage",
        "Assign user privileges (POST/DELETE /users/:userId/privileges)"
      ),
      priv(
        "users.roles.manage",
        "Assign user application roles (POST/DELETE /users/:userId/roles)"
      ),

      // —— App roles (/app-roles) ——
      priv("app_roles.read", "List/view roles, role menus (GET /app-roles…)"),
      priv("app_roles.write", "Create and update roles (POST/PUT /app-roles)"),
      priv("app_roles.delete", "Delete roles (DELETE /app-roles/:id)"),
      priv(
        "app_roles.privileges.manage",
        "Assign role privileges (POST/DELETE /app-roles/:id/privileges)"
      ),
      priv("app_roles.menus.manage", "Assign role menus (POST/GET/DELETE /app-roles/:id/menus)"),

      priv("privileges.read", "List privilege definitions (GET /privileges)"),

      ...crud("menus", "/menus", "Navigation menus"),

      // —— Accounting: read-only catalogs ——
      priv("banks.read", "List/search banks (GET /banks…)"),
      priv("account_groups.read", "List account groups (GET /account-groups)"),
      priv("account_heads.read", "List account heads (GET /account-heads)"),

      ...crud("account_subheads", "/account-subheads", "Account subheads"),
      ...crud("account_charts", "/account-charts", "Account chart of accounts"),

      priv(
        "account_transactions.read",
        "Account reports, balances, transaction logs (GET /account-transactions…)"
      ),
      priv(
        "account_transactions.write",
        "Debit, credit, student journal post (POST /account-transactions…)"
      ),
      priv(
        "account_transactions.delete",
        "Rollback transactions (DELETE /account-transactions/rollback/:ref)"
      ),

      priv(
        "default_subhead_settings.read",
        "View default subhead settings (GET /default-subhead-settings)"
      ),
      priv(
        "default_subhead_settings.write",
        "Update default subhead settings (PATCH /default-subhead-settings/:id)"
      ),
      priv(
        "default_account_settings.read",
        "View default account settings (GET /default-account-settings)"
      ),
      priv(
        "default_account_settings.write",
        "Update default account settings (PATCH /default-account-settings/:id)"
      ),

      ...crud("billing_items", "/billing-items", "Billing items"),
      ...crud("concession_discounts", "/concession-discounts", "Concession discounts"),
      ...crud("class_default_billings", "/class-default-billings", "Class default billings"),
      ...crud("student_billings", "/student-billings", "Student billings"),
      ...crud(
        "student_concession_discounts",
        "/student-concession-discounts",
        "Student concession discounts"
      ),
      ...crud("temp_journal_transfers", "/temp-journal-transfers", "Temporary journal transfers"),

      ...crud("categories", "/categories", "Inventory categories"),
      ...crud("sub_categories", "/sub-categories", "Inventory sub-categories"),
      ...crud("brands", "/brands", "Product brands"),
      ...crud("uoms", "/uoms", "Units of measure"),
      ...crud("inventory_items", "/inventory-items", "Inventory items"),
      ...crud("suppliers", "/suppliers", "Suppliers"),
      ...crud("purchases", "/purchases", "Purchases"),
      ...crud("donations", "/donations", "Donations"),

      ...crud("school_classes", "/school-classes", "School classes"),
      ...crud("students", "/students", "Students"),
      ...crud("sub_classes", "/sub-classes", "Sub-classes"),
      ...crud("terms", "/terms", "Academic terms"),
      ...crud("sessions", "/sessions", "Academic sessions"),
      ...crud("staff", "/staff", "Staff"),

      priv("active_period.read", "View active period (GET /active-period)"),
      priv("active_period.write", "Set active period (PUT /active-period)"),
      priv(
        "default_billing_period.read",
        "View default billing period (GET /default-billing-period)"
      ),
      priv(
        "default_billing_period.write",
        "Set default billing period (PUT /default-billing-period)"
      ),

      ...crud("projects", "/projects", "Projects"),
      ...crud("project_collections", "/project-collections", "Project collections"),

      ...crud("stores", "/stores", "Stores"),
      priv("stores.users.manage", "Assign store users (POST/DELETE /stores/:id/users)"),

      priv("user_stores.read", "List user–store assignments (GET /user-stores…)"),
      priv("user_stores.write", "Grant/revoke store access (POST/DELETE /user-stores)"),

      priv("store_transfers.read", "List store transfers (GET /store-transfers)"),
      priv("store_transfers.write", "Transfer stock between stores (POST /store-transfers)"),

      ...crud("student_collections", "/student-collections", "Student collections"),
      ...crud("staff_collections", "/staff-collections", "Staff collections"),
      ...crud("facilities", "/facilities", "Facilities"),
      ...crud("facility_collections", "/facility-collections", "Facility collections"),

      priv(
        "inventory_receive_acknowledgements.write",
        "Acknowledge inventory receipt (POST /inventory-receive-acknowledgements)"
      ),
      priv("upload.write", "Upload and validate files (POST /upload…)"),
    ];

    for (const p of privileges) {
      await prisma.privilege.upsert({
        where: { name: p.name },
        update: { description: p.description },
        create: { name: p.name, description: p.description },
      });
    }
    console.log(`   ✓ ${privileges.length} privileges`);

    // Application roles (AppRole) with default privilege sets
    console.log("👤 Seeding application roles...");
    const allPrivileges = await prisma.privilege.findMany({
      select: { id: true, name: true },
    });
    const privilegeIdByName = Object.fromEntries(allPrivileges.map((p) => [p.name, p.id]));

    const resolvePrivilegeIds = (names) =>
      names.map((name) => privilegeIdByName[name]).filter(Boolean);

    const pickResource = (resource, actions = ["read", "write", "delete"]) =>
      actions.map((action) => `${resource}.${action}`);
    const pickResources = (resources, actions = ["read", "write", "delete"]) =>
      resources.flatMap((resource) => pickResource(resource, actions));

    const allPrivilegeNames = allPrivileges.map((p) => p.name);
    const allReadPrivilegeNames = allPrivilegeNames.filter((name) => name.endsWith(".read"));

    const inventoryResources = [
      "categories",
      "sub_categories",
      "brands",
      "uoms",
      "inventory_items",
      "suppliers",
      "purchases",
      "donations",
      "stores",
      "student_collections",
      "staff_collections",
    ];

    const schoolResources = [
      "school_classes",
      "students",
      "sub_classes",
      "terms",
      "sessions",
      "staff",
    ];

    const billingResources = [
      "billing_items",
      "concession_discounts",
      "class_default_billings",
      "student_billings",
      "student_concession_discounts",
    ];

    const accountingResources = [
      "account_subheads",
      "account_charts",
      "account_transactions",
      "temp_journal_transfers",
    ];

    const appRoles = [
      {
        id: "a2000001-0002-4002-8002-000000000001",
        name: "Super Admin",
        status: "active",
        privilegeNames: allPrivilegeNames,
      },
      {
        id: "a2000001-0002-4002-8002-000000000002",
        name: "System Administrator",
        status: "active",
        privilegeNames: allPrivilegeNames.filter((name) => name !== "upload.write"),
      },
      {
        id: "a2000001-0002-4002-8002-000000000003",
        name: "Inventory Manager",
        status: "active",
        privilegeNames: [
          ...pickResources(inventoryResources),
          "stores.users.manage",
          "user_stores.read",
          "user_stores.write",
          "store_transfers.read",
          "store_transfers.write",
          "inventory_receive_acknowledgements.write",
          "facilities.read",
          "facility_collections.read",
          "students.read",
          "school_classes.read",
          "staff.read",
        ],
      },
      {
        id: "a2000001-0002-4002-8002-000000000004",
        name: "Accountant",
        status: "active",
        privilegeNames: [
          "banks.read",
          "account_groups.read",
          "account_heads.read",
          ...pickResources(accountingResources),
          "default_subhead_settings.read",
          "default_subhead_settings.write",
          "default_account_settings.read",
          "default_account_settings.write",
          ...pickResources(billingResources),
          "active_period.read",
          "active_period.write",
          "default_billing_period.read",
          "default_billing_period.write",
          "students.read",
          "inventory_items.read",
          "purchases.read",
          "donations.read",
        ],
      },
      {
        id: "a2000001-0002-4002-8002-000000000005",
        name: "Registrar",
        status: "active",
        privilegeNames: [
          ...pickResources(schoolResources),
          ...pickResources(billingResources),
          "active_period.read",
          "default_billing_period.read",
        ],
      },
      {
        id: "a2000001-0002-4002-8002-000000000006",
        name: "Store Clerk",
        status: "active",
        privilegeNames: [
          ...pickResources(
            ["inventory_items", "purchases", "donations", "suppliers", "categories", "uoms"],
            ["read", "write"]
          ),
          "store_transfers.read",
          "store_transfers.write",
          "stores.read",
          "inventory_receive_acknowledgements.write",
          "student_collections.read",
          "staff_collections.read",
        ],
      },
      {
        id: "a2000001-0002-4002-8002-000000000007",
        name: "Viewer",
        status: "active",
        privilegeNames: allReadPrivilegeNames,
      },
    ];

    const superAdminRoleId = appRoles[0].id;

    for (const role of appRoles) {
      const privilegeIds = resolvePrivilegeIds(role.privilegeNames);
      const { privilegeNames: _privilegeNames, ...roleData } = role;

      await prisma.appRole.upsert({
        where: { id: role.id },
        update: {
          name: roleData.name,
          status: roleData.status,
          privileges: { set: privilegeIds.map((id) => ({ id })) },
        },
        create: {
          ...roleData,
          privileges: { connect: privilegeIds.map((id) => ({ id })) },
        },
      });
    }
    console.log(`   ✓ ${appRoles.length} application roles`);

    // Assign Super Admin application role to seeded admin users
    const adminUserIds = [
      "77e7a005-b0a5-4a6e-897c-f827333924d4",
      "39fc583a-a071-49f3-980f-8932fa6cb6c9",
    ];
    for (const userId of adminUserIds) {
      await prisma.userRole.upsert({
        where: { userId },
        update: { roleId: superAdminRoleId },
        create: { userId, roleId: superAdminRoleId },
      });
    }
    console.log(`   ✓ ${adminUserIds.length} admin users linked to Super Admin role`);

    // Navigation menus (flattened from frontend sidebarNavSections)
    console.log("📋 Seeding menus...");
    const sidebarMenus = [
      // Main
      { route: "/", caption: "Dashboard" },
      { route: "/purchases", caption: "Purchases" },
      { route: "/donations", caption: "Donations" },
      { route: "/project-disbursement", caption: "Project disbursement" },
      { route: "/facility-item-distribution", caption: "Facility item distribution" },
      { route: "/sales", caption: "Sales" },
      { route: "/suppliers", caption: "Suppliers" },
      { route: "/projects", caption: "Projects" },
      { route: "/facility-unit-setup", caption: "Facility/unit setup" },
      { route: "/store-setup", caption: "Store setup" },
      { route: "/store-transfers", caption: "Store transfers" },
      // School Management
      { route: "/classes", caption: "Classes & sub-classes" },
      { route: "/students", caption: "Students" },
      { route: "/staff", caption: "Staff" },
      { route: "/sessions", caption: "Sessions & terms" },
      { route: "/student-collections", caption: "Student Collections" },
      { route: "/staff-collections", caption: "Staff Collections" },
      // Analytics
      {
        route: "/reports/store-inventory-balance-matrix",
        caption: "Store inventory matrix",
      },
      { route: "/reports/student-inventory", caption: "Student collections summary" },
      { route: "/reports/student-items-received", caption: "Student items received" },
      { route: "/reports/inventory-collections", caption: "Inventory Collections Report" },
      { route: "/reports/item-balances", caption: "Item balance report" },
      { route: "/reports/item-transaction-log", caption: "Item transaction log" },
      { route: "/reports/account-statement", caption: "Account statement" },
      { route: "/reports/trial-balance", caption: "Trial balance" },
      { route: "/reports/balance-sheet", caption: "Balance sheet" },
      { route: "/reports/student-billing-summary", caption: "Student billing summary" },
      { route: "/reports/student-balances", caption: "Student balances" },
      { route: "/reports/student-transaction-log", caption: "Student transaction log" },
      { route: "/reports/profit-and-loss", caption: "Profit & loss" },
      // Accounting
      { route: "/account-subheads", caption: "Account setup" },
      { route: "/billing-items", caption: "Billing & discounts" },
      { route: "/student-billing", caption: "Student billing" },
      { route: "/class-default-billings", caption: "Class default billing" },
      { route: "/journal-transfers", caption: "Journal transfers" },
      { route: "/student-journal-transfers", caption: "Student journal transfers" },
      // Setup
      { route: "/inventory", caption: "Inventory" },
      { route: "/default-account-settings", caption: "Default account settings" },
      { route: "/users", caption: "User management" },
      { route: "/app-roles", caption: "Role management" },
      { route: "/menus", caption: "Menu management" },

      // payroll
      { route: "/payroll/salary-components", caption: "Salary components" },
      { route: "/payroll/salary-charts", caption: "Salary charts" },
      { route: "/payroll/report", caption: "Payroll reports" },
    ];

    for (const item of sidebarMenus) {
      await prisma.menu.upsert({
        where: { route: item.route },
        update: { caption: item.caption, status: "Active" },
        create: { route: item.route, caption: item.caption, status: "Active" },
      });
    }
    console.log(`   ✓ ${sidebarMenus.length} menus`);

    const systemAdminRoleId = appRoles[1].id;
    const allMenus = await prisma.menu.findMany({ select: { id: true } });
    for (const menu of allMenus) {
      for (const roleId of [superAdminRoleId, systemAdminRoleId]) {
        const existing = await prisma.roleMenu.findFirst({
          where: { roleId, menuId: menu.id },
        });
        if (!existing) {
          await prisma.roleMenu.create({ data: { roleId, menuId: menu.id } });
        }
      }
    }
    console.log(`   ✓ menus linked to Super Admin and System Administrator roles`);

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
      {
        id: 1,
        groupId: 1,
        headId: 1,
        code: "1101",
        name: "Cash and Bank",
        accountType: "Cash",
        status: "Active",
        rank: 1,
      },
      {
        id: 2,
        groupId: 1,
        headId: 1,
        code: "1102",
        name: "Accounts Receivable",
        accountType: "NonCash",
        status: "Active",
        rank: 2,
      },
      {
        id: 3,
        groupId: 1,
        headId: 1,
        code: "1103",
        name: "Inventory",
        status: "Active",
        rank: 3,
        accountType: "NonCash",
      },
      // Assets — Fixed Assets (head 2)
      {
        id: 4,
        groupId: 1,
        headId: 2,
        code: "1201",
        name: "Furniture and Fixtures",
        accountType: "NonCash",
        status: "Active",
        rank: 4,
      },
      {
        id: 5,
        groupId: 1,
        headId: 2,
        code: "1202",
        name: "ICT Equipment",
        accountType: "NonCash",
        status: "Active",
        rank: 5,
      },
      // Liabilities — Current (head 3)
      {
        id: 6,
        groupId: 2,
        headId: 3,
        code: "2101",
        name: "Accounts Payable",
        accountType: "NonCash",
        status: "Active",
        rank: 6,
      },
      {
        id: 7,
        groupId: 2,
        headId: 3,
        code: "2102",
        name: "Student Deposits",
        accountType: "NonCash",
        status: "Active",
        rank: 7,
      },
      // Liabilities — Long-term (head 4)
      {
        id: 8,
        groupId: 2,
        headId: 4,
        code: "2201",
        name: "Long-term Loans",
        accountType: "NonCash",
        status: "Active",
        rank: 8,
      },
      // Equity (head 5)
      {
        id: 9,
        groupId: 3,
        headId: 5,
        code: "3101",
        name: "Capital",
        accountType: "NonCash",
        status: "Active",
        rank: 9,
      },
      {
        id: 10,
        groupId: 3,
        headId: 5,
        code: "3102",
        name: "Retained Earnings",
        accountType: "NonCash",
        status: "Active",
        rank: 10,
      },
      // Expenses (head 6)
      {
        id: 11,
        groupId: 4,
        headId: 6,
        code: "4101",
        name: "Salaries and Wages",
        accountType: "NonCash",
        status: "Active",
        rank: 11,
      },
      {
        id: 12,
        groupId: 4,
        headId: 6,
        code: "4102",
        name: "Consumable Expenses",
        accountType: "NonCash",
        status: "Active",
        rank: 12,
      },
      {
        id: 13,
        groupId: 4,
        headId: 6,
        code: "4103",
        name: "Utilities",
        accountType: "NonCash",
        status: "Active",
        rank: 13,
      },
      {
        id: 14,
        groupId: 4,
        headId: 6,
        code: "4104",
        name: "Maintenance and Repairs",
        accountType: "NonCash",
        status: "Active",
        rank: 14,
      },
      {
        id: 15,
        groupId: 4,
        headId: 6,
        code: "4105",
        name: "Discounts and Concessions",
        accountType: "NonCash",
        status: "Active",
        rank: 15,
      },
      // Income (head 7)
      {
        id: 16,
        groupId: 5,
        headId: 7,
        code: "5101",
        name: "Tuition and Fees",
        accountType: "NonCash",
        status: "Active",
        rank: 16,
      },
      {
        id: 17,
        groupId: 5,
        headId: 7,
        code: "5102",
        name: "Other Income",
        accountType: "NonCash",
        status: "Active",
        rank: 17,
      },
      {
        id: 18,
        groupId: 5,
        headId: 7,
        code: "5103",
        name: "Student Collections",
        accountType: "NonCash",
        status: "Active",
        rank: 18,
      },
      // Liabilities — payroll (head 3)
      {
        id: 19,
        groupId: 2,
        headId: 3,
        code: "2103",
        name: "Payroll Liabilities",
        accountType: "NonCash",
        status: "Active",
        rank: 19,
      },
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
      {
        id: 1,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101001",
        accountRef: "CASH-PETTY",
        accountDescription: "Petty Cash",
        status: "Active",
        rank: 1,
      },
      {
        id: 2,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101002",
        accountRef: "CASH-BANK",
        accountDescription: "Main Bank Account",
        status: "Active",
        rank: 2,
      },
      {
        id: 3,
        groupId: 1,
        headId: 1,
        subheadId: 2,
        accountNo: "1102001",
        accountRef: "AR-STUDENT",
        accountDescription: "Student Accounts Receivable",
        status: "Active",
        rank: 3,
      },
      {
        id: 4,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103001",
        accountRef: "INV-GENERAL",
        accountDescription: "Inventory - General Stock",
        status: "Active",
        rank: 4,
      },
      {
        id: 5,
        groupId: 1,
        headId: 2,
        subheadId: 4,
        accountNo: "1201001",
        accountRef: "FA-FURN",
        accountDescription: "Furniture and Fixtures",
        status: "Active",
        rank: 5,
      },
      {
        id: 6,
        groupId: 1,
        headId: 2,
        subheadId: 5,
        accountNo: "1202001",
        accountRef: "FA-ICT",
        accountDescription: "ICT Equipment",
        status: "Active",
        rank: 6,
      },
      {
        id: 7,
        groupId: 2,
        headId: 3,
        subheadId: 6,
        accountNo: "2101001",
        accountRef: "AP-TRADE",
        accountDescription: "Trade Payables",
        status: "Active",
        rank: 7,
      },
      {
        id: 8,
        groupId: 2,
        headId: 3,
        subheadId: 7,
        accountNo: "2102001",
        accountRef: "DEP-STUDENT",
        accountDescription: "Student Deposits Payable",
        status: "Active",
        rank: 8,
      },
      {
        id: 9,
        groupId: 2,
        headId: 4,
        subheadId: 8,
        accountNo: "2201001",
        accountRef: "LT-LOAN",
        accountDescription: "Long-term Bank Loan",
        status: "Active",
        rank: 9,
      },
      {
        id: 10,
        groupId: 3,
        headId: 5,
        subheadId: 9,
        accountNo: "3101001",
        accountRef: "EQ-CAP",
        accountDescription: "Capital Account",
        status: "Active",
        rank: 10,
      },
      {
        id: 11,
        groupId: 3,
        headId: 5,
        subheadId: 10,
        accountNo: "3102001",
        accountRef: "EQ-RET",
        accountDescription: "Retained Earnings",
        status: "Active",
        rank: 11,
      },
      {
        id: 12,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101001",
        accountRef: "EXP-SAL",
        accountDescription: "Staff Salaries",
        status: "Active",
        rank: 12,
      },
      {
        id: 13,
        groupId: 4,
        headId: 6,
        subheadId: 12,
        accountNo: "4102001",
        accountRef: "EXP-CONS",
        accountDescription: "Consumable Expenses",
        status: "Active",
        rank: 13,
      },
      {
        id: 14,
        groupId: 4,
        headId: 6,
        subheadId: 13,
        accountNo: "4103001",
        accountRef: "EXP-UTIL",
        accountDescription: "Utilities Expense",
        status: "Active",
        rank: 14,
      },
      {
        id: 15,
        groupId: 4,
        headId: 6,
        subheadId: 14,
        accountNo: "4104001",
        accountRef: "EXP-MAINT",
        accountDescription: "Maintenance Expense",
        status: "Active",
        rank: 15,
      },
      {
        id: 16,
        groupId: 4,
        headId: 6,
        subheadId: 15,
        accountNo: "4105001",
        accountRef: "EXP-DISC",
        accountDescription: "Discounts and Concessions",
        status: "Active",
        rank: 16,
      },
      {
        id: 17,
        groupId: 5,
        headId: 7,
        subheadId: 16,
        accountNo: "5101001",
        accountRef: "INC-TUIT",
        accountDescription: "Tuition Income",
        status: "Active",
        rank: 17,
      },
      {
        id: 18,
        groupId: 5,
        headId: 7,
        subheadId: 17,
        accountNo: "5102001",
        accountRef: "INC-OTHER",
        accountDescription: "Other Operating Income",
        status: "Active",
        rank: 18,
      },
      {
        id: 19,
        groupId: 5,
        headId: 7,
        subheadId: 18,
        accountNo: "5103001",
        accountRef: "INC-COLL",
        accountDescription: "Student Fee Collections",
        status: "Active",
        rank: 19,
      },
      // Payroll expenses (subhead 11 — Salaries and Wages)
      {
        id: 20,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101002",
        accountRef: "EXP-SALARY",
        accountDescription: "Salary Expense",
        status: "Active",
        rank: 20,
      },
      {
        id: 21,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101003",
        accountRef: "EXP-HOUSING",
        accountDescription: "Housing Allowance Expense",
        status: "Active",
        rank: 21,
      },
      {
        id: 22,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101004",
        accountRef: "EXP-TRANSPORT",
        accountDescription: "Transport Allowance Expense",
        status: "Active",
        rank: 22,
      },
      // Payroll liabilities (subhead 19)
      {
        id: 23,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103001",
        accountRef: "AP-SALARIES",
        accountDescription: "Salaries Payable",
        status: "Active",
        rank: 23,
      },
      {
        id: 24,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103002",
        accountRef: "AP-PAYE",
        accountDescription: "PAYE Tax Payable",
        status: "Active",
        rank: 24,
      },
      {
        id: 25,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103003",
        accountRef: "AP-PEN-EMP",
        accountDescription: "Employee Pension Payable",
        status: "Active",
        rank: 25,
      },
      {
        id: 26,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103004",
        accountRef: "AP-PEN-ER",
        accountDescription: "Employer Pension Payable",
        status: "Active",
        rank: 26,
      },
      {
        id: 27,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103005",
        accountRef: "AP-NHF",
        accountDescription: "NHF Payable",
        status: "Active",
        rank: 27,
      },
      // Staff loan receivable (subhead 2 — Accounts Receivable)
      {
        id: 28,
        groupId: 1,
        headId: 1,
        subheadId: 2,
        accountNo: "1102002",
        accountRef: "AR-STAFF-LOAN",
        accountDescription: "Staff Loan Receivable",
        status: "Active",
        rank: 28,
      },
      // Bank (subhead 1 — Cash and Bank)
      {
        id: 29,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101003",
        accountRef: "BANK-ACCOUNT",
        accountDescription: "Bank Account",
        status: "Active",
        rank: 29,
      },
      // Category inventory asset ledgers (subhead 3 — Inventory)
      {
        id: 30,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103002",
        accountRef: "INV-OFFICE",
        accountDescription: "Inventory - Office Supplies",
        status: "Active",
        rank: 30,
      },
      {
        id: 31,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103003",
        accountRef: "INV-STATIONERY",
        accountDescription: "Inventory - Stationery",
        status: "Active",
        rank: 31,
      },
      {
        id: 32,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103004",
        accountRef: "INV-CLEANING",
        accountDescription: "Inventory - Cleaning Supplies",
        status: "Active",
        rank: 32,
      },
      {
        id: 33,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103005",
        accountRef: "INV-LAB",
        accountDescription: "Inventory - Laboratory Supplies",
        status: "Active",
        rank: 33,
      },
      {
        id: 34,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103006",
        accountRef: "INV-SPORTS",
        accountDescription: "Inventory - Sports and PE Equipment",
        status: "Active",
        rank: 34,
      },
      {
        id: 35,
        groupId: 1,
        headId: 1,
        subheadId: 3,
        accountNo: "1103007",
        accountRef: "INV-MAINT",
        accountDescription: "Inventory - Building and Maintenance",
        status: "Active",
        rank: 35,
      },
      // Additional payroll expense ledgers (subhead 11)
      {
        id: 36,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101005",
        accountRef: "EXP-MEAL",
        accountDescription: "Meal Allowance Expense",
        status: "Active",
        rank: 36,
      },
      {
        id: 37,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101006",
        accountRef: "EXP-OVERTIME",
        accountDescription: "Overtime Expense",
        status: "Active",
        rank: 37,
      },
      {
        id: 38,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101007",
        accountRef: "EXP-BONUS",
        accountDescription: "Bonus Expense",
        status: "Active",
        rank: 38,
      },
      {
        id: 39,
        groupId: 4,
        headId: 6,
        subheadId: 11,
        accountNo: "4101008",
        accountRef: "EXP-LEAVE",
        accountDescription: "Leave Allowance Expense",
        status: "Active",
        rank: 39,
      },
      // Additional payroll liability ledgers (subhead 19 — Accounts Payable)
      {
        id: 40,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103006",
        accountRef: "AP-NSITF",
        accountDescription: "NSITF Payable",
        status: "Active",
        rank: 40,
      },
      {
        id: 41,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103007",
        accountRef: "AP-ITF",
        accountDescription: "ITF Payable",
        status: "Active",
        rank: 41,
      },
      {
        id: 42,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103008",
        accountRef: "AP-COOP",
        accountDescription: "Cooperative Payable",
        status: "Active",
        rank: 42,
      },
      {
        id: 43,
        groupId: 2,
        headId: 3,
        subheadId: 19,
        accountNo: "2103009",
        accountRef: "AP-UNION",
        accountDescription: "Union Dues Payable",
        status: "Active",
        rank: 43,
      },
      // Staff payroll receivables (subhead 2 — Accounts Receivable)
      {
        id: 44,
        groupId: 1,
        headId: 1,
        subheadId: 2,
        accountNo: "1102003",
        accountRef: "AR-STAFF-ADVANCE",
        accountDescription: "Staff Advance Salary Receivable",
        status: "Active",
        rank: 44,
      },
      {
        id: 45,
        groupId: 1,
        headId: 1,
        subheadId: 2,
        accountNo: "1102004",
        accountRef: "AR-STAFF",
        accountDescription: "Staff Accounts Receivable",
        status: "Active",
        rank: 45,
      },
      {
        id: 46,
        groupId: 5,
        headId: 7,
        subheadId: 17,
        accountNo: "5102002",
        accountRef: "INC-SALES",
        accountDescription: "Sales Income",
        status: "Active",
        rank: 46,
      },
      // Cashier tills (subhead 1 — Cash and Bank)
      {
        id: 47,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101010",
        accountRef: "CASH-ADMIN",
        accountDescription: "Cashier Ledger - School Admin",
        status: "Active",
        rank: 47,
      },
      {
        id: 48,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101011",
        accountRef: "CASH-ACCTS",
        accountDescription: "Cashier Ledger - Accounts Office",
        status: "Active",
        rank: 48,
      },
      {
        id: 49,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101012",
        accountRef: "CASH-STORE",
        accountDescription: "Cashier Ledger - Store Sales",
        status: "Active",
        rank: 49,
      },
      {
        id: 50,
        groupId: 1,
        headId: 1,
        subheadId: 1,
        accountNo: "1101013",
        accountRef: "CASH-RECEPTION",
        accountDescription: "Cashier Ledger - Reception",
        status: "Active",
        rank: 50,
      },
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
      {
        settingsId: "STAFF_SUBHEAD",
        settings: "Default subhead for staff receivable postings (mirrors student AR subhead)",
        subheadId: 2,
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
      {
        settingsId: "SALES_ACCOUNT",
        settings: "Default income account for inventory and sales postings",
        accountId: 46,
      },
      {
        settingsId: "STAFF_ACCOUNT",
        settings:
          "Default accounts receivable ledger for staff (sales, collections, and staff sub-ledger)",
        accountId: 45,
      },
      {
        settingsId: "STAFF_SALARY_PAYABLE_ACCOUNT",
        settings: "Default accounts payable ledger for net staff salary liability",
        accountId: 23,
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

    // Billing items (fee types for student / class billing)
    console.log("🧾 Seeding billing items...");
    const billingItems = [
      {
        id: 1,
        code: "TUIT",
        name: "Tuition Fee",
        category: "TUITION",
        optional: false,
        status: "Active",
        accountId: 17,
      },
      {
        id: 2,
        code: "REG",
        name: "Registration Fee",
        category: "SERVICES",
        optional: false,
        status: "Active",
        accountId: 17,
      },
      {
        id: 3,
        code: "DEV",
        name: "Development Levy",
        category: "CONSTRUCTION",
        optional: false,
        status: "Active",
        accountId: 18,
      },
      {
        id: 4,
        code: "ICT",
        name: "ICT / Technology Fee",
        category: "TECHNOLOGY",
        optional: false,
        status: "Active",
        accountId: 18,
      },
      {
        id: 5,
        code: "TRANS",
        name: "Transportation Fee",
        category: "TRANSPORTATION",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 6,
        code: "FEED",
        name: "Feeding / Lunch Fee",
        category: "FEEDING",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 7,
        code: "UNIF",
        name: "Uniform and Materials",
        category: "MATERIALS",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 8,
        code: "EXAM",
        name: "Examination Fee",
        category: "SERVICES",
        optional: false,
        status: "Active",
        accountId: 18,
      },
      {
        id: 9,
        code: "PTA",
        name: "PTA Levy",
        category: "SERVICES",
        optional: false,
        status: "Active",
        accountId: 18,
      },
      {
        id: 10,
        code: "MED",
        name: "Medical / Health Fee",
        category: "MEDICAL",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 11,
        code: "SPORT",
        name: "Sports Fee",
        category: "OTHER",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 12,
        code: "LIB",
        name: "Library Fee",
        category: "SERVICES",
        optional: true,
        status: "Active",
        accountId: 18,
      },
      {
        id: 13,
        code: "BOARD",
        name: "Boarding Fee",
        category: "SERVICES",
        optional: true,
        status: "Active",
        accountId: 19,
      },
      {
        id: 14,
        code: "MISC",
        name: "Miscellaneous Fee",
        category: "OTHER",
        optional: true,
        status: "Active",
        accountId: 19,
      },
    ];

    for (const item of billingItems) {
      await prisma.billingItem.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          category: item.category,
          optional: item.optional,
          status: item.status,
          accountId: item.accountId,
        },
        create: item,
      });
    }
    console.log(`   ✓ ${billingItems.length} billing items`);

    // Concession / discount definitions (linked to billing items and discount ledger)
    console.log("🏷️ Seeding concession discounts...");
    const concessionDiscounts = [
      {
        id: 1,
        code: "SIBLING10",
        name: "Sibling Discount (10%)",
        type: "DISCOUNT",
        calculationType: "PERCENTAGE",
        value: 10,
        maxLimit: null,
        status: "Active",
        accountId: 16,
        appliesToIds: [1, 2],
      },
      {
        id: 2,
        code: "STAFFCHILD15",
        name: "Staff Child Concession (15%)",
        type: "CONCESSION",
        calculationType: "PERCENTAGE",
        value: 15,
        maxLimit: null,
        status: "Active",
        accountId: 16,
        appliesToIds: [1],
      },
      {
        id: 3,
        code: "EARLY5K",
        name: "Early Payment Discount (₦5,000)",
        type: "DISCOUNT",
        calculationType: "FIXED_AMOUNT",
        value: 5000,
        maxLimit: null,
        status: "Active",
        accountId: 16,
        appliesToIds: [1, 3],
      },
      {
        id: 4,
        code: "SCHOLAR25",
        name: "Scholarship (25%)",
        type: "CONCESSION",
        calculationType: "PERCENTAGE",
        value: 25,
        maxLimit: 50000,
        status: "Active",
        accountId: 16,
        appliesToIds: [1],
      },
      {
        id: 5,
        code: "NEEDY50",
        name: "Financial Need Concession (50%)",
        type: "CONCESSION",
        calculationType: "PERCENTAGE",
        value: 50,
        maxLimit: 100000,
        status: "Active",
        accountId: 16,
        appliesToIds: [1, 2, 8],
      },
      {
        id: 6,
        code: "TRANSFIX2K",
        name: "Transport Promo (₦2,000 off)",
        type: "DISCOUNT",
        calculationType: "FIXED_AMOUNT",
        value: 2000,
        maxLimit: null,
        status: "Active",
        accountId: 16,
        appliesToIds: [5],
      },
    ];

    for (const row of concessionDiscounts) {
      const { appliesToIds, ...data } = row;
      const appliesToConnect = appliesToIds.map((id) => ({ id }));
      await prisma.concessionDiscount.upsert({
        where: { code: row.code },
        update: {
          name: data.name,
          type: data.type,
          calculationType: data.calculationType,
          value: data.value,
          maxLimit: data.maxLimit,
          status: data.status,
          accountId: data.accountId,
          appliesTo: { set: appliesToConnect },
        },
        create: {
          ...data,
          appliesTo: { connect: appliesToConnect },
        },
      });
    }
    console.log(`   ✓ ${concessionDiscounts.length} concession discounts`);

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
    // Account chart IDs: 13 EXP-CONS, 15 EXP-MAINT, 5 FA-FURN, 6 FA-ICT,
    // 30–35 category inventory/asset ledgers (see accountCharts seed)
    const categories = [
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901001",
        name: "Office Supplies",
        description: "General office consumables (paper, pens, folders)",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: 13, // 4102001 Consumable Expenses
        assetAccountId: 30, // 1103002 Inventory - Office Supplies
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901002",
        name: "Stationery",
        description: "Student and staff stationery items",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: 13,
        assetAccountId: 31, // 1103003 Inventory - Stationery
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901003",
        name: "Cleaning Supplies",
        description: "Janitorial and hygiene consumables",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: 13,
        assetAccountId: 32, // 1103004 Inventory - Cleaning Supplies
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901004",
        name: "Laboratory Supplies",
        description: "Science lab consumables and chemicals",
        status: "Active",
        categoryType: "Consumable",
        consumableAccountId: 13,
        assetAccountId: 33, // 1103005 Inventory - Laboratory Supplies
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901005",
        name: "ICT Equipment",
        description: "Computers, peripherals, and durable IT assets",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: 13, // expense on issue / sale
        assetAccountId: 6, // 1202001 ICT Equipment
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901006",
        name: "Furniture",
        description: "Desks, chairs, cabinets, and fixtures",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: 13,
        assetAccountId: 5, // 1201001 Furniture and Fixtures
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901007",
        name: "Sports & PE",
        description: "Sports equipment and physical education gear",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: 13,
        assetAccountId: 34, // 1103006 Inventory - Sports and PE Equipment
      },
      {
        id: "a1b2c3d4-e5f6-4789-a012-345678901008",
        name: "Building & Maintenance",
        description: "Tools, hardware, and maintenance materials",
        status: "Active",
        categoryType: "NonConsumable",
        consumableAccountId: 15, // 4104001 Maintenance Expense
        assetAccountId: 35, // 1103007 Inventory - Building and Maintenance
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
          assetAccountId: c.assetAccountId,
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

    // Suppliers (+ ledger accounts under SUPPLIER_SUBHEAD / Accounts Payable)
    console.log("🏭 Seeding suppliers...");
    const adminUserId = "77e7a005-b0a5-4a6e-897c-f827333924d4";
    const suppliers = [
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901001",
        name: "OfficeMart Nigeria Ltd",
        contactName: "Ada Okonkwo",
        email: "sales@officemart.ng",
        phone: "+2348012345678",
        address: "12 Allen Avenue",
        city: "Ikeja",
        state: "Lagos",
        country: "Nigeria",
        website: "https://officemart.ng",
        notes: "Primary office consumables vendor",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901002",
        name: "TechSupply Africa Limited",
        contactName: "Emeka Nwosu",
        email: "procurement@techsupply.africa",
        phone: "+2348023456789",
        address: "45 Computer Village",
        city: "Ikeja",
        state: "Lagos",
        country: "Nigeria",
        website: null,
        notes: "ICT hardware and peripherals",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901003",
        name: "CleanPro Janitorial Services",
        contactName: "Fatima Bello",
        email: "orders@cleanpro.ng",
        phone: "+2348034567890",
        address: "8 Industrial Estate Road",
        city: "Abuja",
        state: "FCT",
        country: "Nigeria",
        website: null,
        notes: "Cleaning supplies and hygiene products",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901004",
        name: "LabEquip Scientific Supplies",
        contactName: "Dr. James Adeyemi",
        email: "lab@labequip.ng",
        phone: "+2348045678901",
        address: "3 Science Park Close",
        city: "Ibadan",
        state: "Oyo",
        country: "Nigeria",
        website: "https://labequip.ng",
        notes: "Laboratory chemicals and glassware",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901005",
        name: "Furniture World Nigeria Ltd",
        contactName: "Chidi Okafor",
        email: "info@furnitureworld.ng",
        phone: "+2348056789012",
        address: "21 Warehouse Road",
        city: "Port Harcourt",
        state: "Rivers",
        country: "Nigeria",
        website: null,
        notes: "Desks, chairs, and storage furniture",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e1f2a3b4-c5d6-4789-e012-345678901006",
        name: "SportGear Depot",
        contactName: "Amina Yusuf",
        email: "wholesale@sportgear.ng",
        phone: "+2348067890123",
        address: "7 Stadium Link Road",
        city: "Kano",
        state: "Kano",
        country: "Nigeria",
        website: "https://sportgear.ng",
        notes: "Sports and PE equipment",
        status: "Active",
        createdById: adminUserId,
      },
    ];

    let supplierLedgerCount = 0;
    for (const s of suppliers) {
      const supplier = await prisma.supplier.upsert({
        where: { name: s.name },
        update: {
          contactName: s.contactName,
          email: s.email,
          phone: s.phone,
          address: s.address,
          city: s.city,
          state: s.state,
          country: s.country,
          website: s.website,
          notes: s.notes,
          status: s.status,
          createdById: s.createdById,
        },
        create: s,
      });

      const ledgerId = await ensureSupplierLedgerAccount(supplier);
      if (ledgerId) {
        supplierLedgerCount += 1;
      }
    }
    console.log(
      `   ✓ ${suppliers.length} suppliers, ${supplierLedgerCount} supplier ledger accounts`
    );

    // Brands
    console.log("🏷️ Seeding brands...");
    const brands = [
      { id: "f2a3b4c5-d6e7-4890-f012-345678902001", name: "Generic", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902002", name: "BIC", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902003", name: "HP", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902004", name: "Dell", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902005", name: "Logitech", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902006", name: "Staedtler", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902007", name: "Dettol", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902008", name: "Nike", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902009", name: "Deli", status: "Active" },
      { id: "f2a3b4c5-d6e7-4890-f012-345678902010", name: "Canon", status: "Active" },
    ];

    for (const b of brands) {
      await prisma.brand.upsert({
        where: { name: b.name },
        update: { status: b.status },
        create: b,
      });
    }
    console.log(`   ✓ ${brands.length} brands`);

    // Inventory items (linked to categories, sub-categories, brands, UOMs)
    console.log("📋 Seeding inventory items...");
    const uomIds = {
      piece: "5b15389c-3d56-4ec1-b848-43c76d435f35",
      carton: "f331e6b0-e5d3-4c3a-a6af-c46858c3396b",
      kilogram: "1c152b2e-bd60-418f-b312-08c1b001134a",
      liter: "7e0ebb54-6fc7-46f0-8853-27e23b2693af",
    };
    const brandIds = {
      generic: "f2a3b4c5-d6e7-4890-f012-345678902001",
      bic: "f2a3b4c5-d6e7-4890-f012-345678902002",
      hp: "f2a3b4c5-d6e7-4890-f012-345678902003",
      dell: "f2a3b4c5-d6e7-4890-f012-345678902004",
      logitech: "f2a3b4c5-d6e7-4890-f012-345678902005",
      staedtler: "f2a3b4c5-d6e7-4890-f012-345678902006",
      dettol: "f2a3b4c5-d6e7-4890-f012-345678902007",
      nike: "f2a3b4c5-d6e7-4890-f012-345678902008",
      deli: "f2a3b4c5-d6e7-4890-f012-345678902009",
      canon: "f2a3b4c5-d6e7-4890-f012-345678902010",
    };
    const subCategoryIds = {
      paperProducts: "b1c2d3e4-f5a6-4789-b012-345678901001",
      writingInstruments: "b1c2d3e4-f5a6-4789-b012-345678901002",
      filingStorage: "b1c2d3e4-f5a6-4789-b012-345678901003",
      notebooks: "b1c2d3e4-f5a6-4789-b012-345678901004",
      pensPencils: "b1c2d3e4-f5a6-4789-b012-345678901005",
      detergents: "b1c2d3e4-f5a6-4789-b012-345678901007",
      cleaningTools: "b1c2d3e4-f5a6-4789-b012-345678901008",
      glassware: "b1c2d3e4-f5a6-4789-b012-345678901011",
      computers: "b1c2d3e4-f5a6-4789-b012-345678901013",
      peripherals: "b1c2d3e4-f5a6-4789-b012-345678901014",
      desks: "b1c2d3e4-f5a6-4789-b012-345678901016",
      chairs: "b1c2d3e4-f5a6-4789-b012-345678901017",
      teamSports: "b1c2d3e4-f5a6-4789-b012-345678901019",
      electrical: "b1c2d3e4-f5a6-4789-b012-345678901023",
    };

    const inventoryItems = [
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903001",
        sku: "OFF-PAP-001",
        name: "A4 Copy Paper (500 Sheets)",
        categoryId: categoryIds.officeSupplies,
        subCategoryId: subCategoryIds.paperProducts,
        brandId: brandIds.deli,
        uomId: uomIds.carton,
        barcode: "8901234567001",
        costPrice: "4500.00",
        sellingPrice: "5500.00",
        lowStockThreshold: 10,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903002",
        sku: "OFF-PEN-001",
        name: "Ballpoint Pen Blue (Box of 50)",
        categoryId: categoryIds.officeSupplies,
        subCategoryId: subCategoryIds.writingInstruments,
        brandId: brandIds.bic,
        uomId: uomIds.carton,
        barcode: "8901234567002",
        costPrice: "3200.00",
        sellingPrice: "4000.00",
        lowStockThreshold: 5,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903003",
        sku: "OFF-FIL-001",
        name: "Lever Arch File A4",
        categoryId: categoryIds.officeSupplies,
        subCategoryId: subCategoryIds.filingStorage,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567003",
        costPrice: "850.00",
        sellingPrice: "1200.00",
        lowStockThreshold: 20,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903004",
        sku: "STA-NBK-001",
        name: "Exercise Book 80 Leaves",
        categoryId: categoryIds.stationery,
        subCategoryId: subCategoryIds.notebooks,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567004",
        costPrice: "350.00",
        sellingPrice: "500.00",
        lowStockThreshold: 100,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903005",
        sku: "STA-PNC-001",
        name: "HB Pencil Pack (12)",
        categoryId: categoryIds.stationery,
        subCategoryId: subCategoryIds.pensPencils,
        brandId: brandIds.staedtler,
        uomId: uomIds.piece,
        barcode: "8901234567005",
        costPrice: "600.00",
        sellingPrice: "900.00",
        lowStockThreshold: 30,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903006",
        sku: "CLN-SOP-001",
        name: "Liquid Hand Soap 5L",
        categoryId: categoryIds.cleaningSupplies,
        subCategoryId: subCategoryIds.detergents,
        brandId: brandIds.dettol,
        uomId: uomIds.liter,
        barcode: "8901234567006",
        costPrice: "2800.00",
        sellingPrice: "3500.00",
        lowStockThreshold: 8,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903007",
        sku: "CLN-MOP-001",
        name: "Mop Head Replacement",
        categoryId: categoryIds.cleaningSupplies,
        subCategoryId: subCategoryIds.cleaningTools,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567007",
        costPrice: "1200.00",
        sellingPrice: "1800.00",
        lowStockThreshold: 15,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903008",
        sku: "LAB-BEK-001",
        name: "Beaker 250ml Borosilicate",
        categoryId: categoryIds.laboratorySupplies,
        subCategoryId: subCategoryIds.glassware,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567008",
        costPrice: "1500.00",
        sellingPrice: "2200.00",
        lowStockThreshold: 12,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903009",
        sku: "ICT-DTP-001",
        name: "Desktop Computer Core i5 16GB",
        categoryId: categoryIds.ictEquipment,
        subCategoryId: subCategoryIds.computers,
        brandId: brandIds.hp,
        uomId: uomIds.piece,
        barcode: "8901234567009",
        costPrice: "485000.00",
        sellingPrice: "520000.00",
        lowStockThreshold: 2,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903010",
        sku: "ICT-MSE-001",
        name: "Wireless Optical Mouse",
        categoryId: categoryIds.ictEquipment,
        subCategoryId: subCategoryIds.peripherals,
        brandId: brandIds.logitech,
        uomId: uomIds.piece,
        barcode: "8901234567010",
        costPrice: "4500.00",
        sellingPrice: "6500.00",
        lowStockThreshold: 10,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903011",
        sku: "FUR-DSK-001",
        name: "Single Student Desk",
        categoryId: categoryIds.furniture,
        subCategoryId: subCategoryIds.desks,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567011",
        costPrice: "28000.00",
        sellingPrice: "35000.00",
        lowStockThreshold: 5,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903012",
        sku: "FUR-CHR-001",
        name: "Plastic Classroom Chair",
        categoryId: categoryIds.furniture,
        subCategoryId: subCategoryIds.chairs,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567012",
        costPrice: "8500.00",
        sellingPrice: "11000.00",
        lowStockThreshold: 10,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903013",
        sku: "SPT-FBL-001",
        name: "Football Size 5 Match",
        categoryId: categoryIds.sportsPe,
        subCategoryId: subCategoryIds.teamSports,
        brandId: brandIds.nike,
        uomId: uomIds.piece,
        barcode: "8901234567013",
        costPrice: "12000.00",
        sellingPrice: "15000.00",
        lowStockThreshold: 6,
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f2a3b4c5-d6e7-4890-a012-345678903014",
        sku: "BLD-ELC-001",
        name: "LED Bulb 12W E27",
        categoryId: categoryIds.buildingMaintenance,
        subCategoryId: subCategoryIds.electrical,
        brandId: brandIds.generic,
        uomId: uomIds.piece,
        barcode: "8901234567014",
        costPrice: "950.00",
        sellingPrice: "1400.00",
        lowStockThreshold: 25,
        status: "Active",
        createdById: adminUserId,
      },
    ];

    for (const item of inventoryItems) {
      await prisma.inventoryItem.upsert({
        where: { name: item.name },
        update: {
          sku: item.sku,
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          brandId: item.brandId,
          uomId: item.uomId,
          barcode: item.barcode,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          lowStockThreshold: item.lowStockThreshold,
          status: item.status,
          createdById: item.createdById,
        },
        create: item,
      });
    }
    console.log(`   ✓ ${inventoryItems.length} inventory items`);

    // Stores (+ UserStore access for managers, same as StoreService.createStore)
    console.log("🏬 Seeding stores...");
    const secondaryAdminUserId = "39fc583a-a071-49f3-980f-8932fa6cb6c9";
    const stores = [
      {
        id: "a3a4b5c6-d7e8-4890-a012-345678904001",
        name: "Main Central Store",
        description: "Primary inventory store for general school supplies",
        status: "Active",
        managerId: adminUserId,
      },
      {
        id: "a3a4b5c6-d7e8-4890-a012-345678904002",
        name: "Annex Campus Store",
        description: "Secondary campus storage and distribution point",
        status: "Active",
        managerId: secondaryAdminUserId,
      },
      {
        id: "a3a4b5c6-d7e8-4890-a012-345678904003",
        name: "Science Lab Store",
        description: "Laboratory chemicals, glassware, and safety stock",
        status: "Active",
        managerId: adminUserId,
      },
      {
        id: "a3a4b5c6-d7e8-4890-a012-345678904004",
        name: "Sports Equipment Store",
        description: "PE and sports gear storage",
        status: "Active",
        managerId: secondaryAdminUserId,
      },
    ];

    for (const st of stores) {
      const store = await prisma.store.upsert({
        where: { name: st.name },
        update: {
          description: st.description,
          status: st.status,
          managerId: st.managerId,
        },
        create: st,
      });

      if (store.managerId) {
        await prisma.userStore.upsert({
          where: {
            userId_storeId: {
              userId: store.managerId,
              storeId: store.id,
            },
          },
          create: {
            userId: store.managerId,
            storeId: store.id,
          },
          update: {},
        });
      }
    }
    console.log(`   ✓ ${stores.length} stores`);

    // Facilities
    console.log("🏢 Seeding facilities...");
    const facilities = [
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908001",
        name: "Main Auditorium",
        description: "Assembly hall and large school events",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908002",
        name: "Science Laboratory Block",
        description: "Physics, chemistry, and biology labs",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908003",
        name: "Sports Complex",
        description: "Football field, courts, and PE facilities",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908004",
        name: "School Library",
        description: "Reading rooms and learning resource centre",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908005",
        name: "ICT Laboratory",
        description: "Computer labs and digital learning spaces",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908006",
        name: "Administrative Block",
        description: "Offices, records, and staff workspaces",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "f7a8b9c0-d1e2-4234-f012-345678908007",
        name: "Dining Hall",
        description: "Cafeteria and meal service area",
        status: "Active",
        createdById: adminUserId,
      },
    ];

    for (const facility of facilities) {
      await prisma.facility.upsert({
        where: { id: facility.id },
        update: {
          name: facility.name,
          description: facility.description,
          status: facility.status,
          createdById: facility.createdById,
        },
        create: facility,
      });
    }
    console.log(`   ✓ ${facilities.length} facilities`);

    // Departments

    // Salary components (earnings → expense accounts; deductions → payable; loan/advance → receivable)
    console.log("💰 Seeding salary components...");
    const SC = {
      BAS: "comp0001-0000-4000-8000-000000000001",
      HOU: "comp0001-0000-4000-8000-000000000002",
      TRN: "comp0001-0000-4000-8000-000000000003",
      MEA: "comp0001-0000-4000-8000-000000000004",
      OVT: "comp0001-0000-4000-8000-000000000005",
      BON: "comp0001-0000-4000-8000-000000000006",
      LEV: "comp0001-0000-4000-8000-000000000007",
      PAYE: "comp0001-0000-4000-8000-000000000008",
      PEN: "comp0001-0000-4000-8000-000000000009",
      NHF: "comp0001-0000-4000-8000-000000000010",
      NSITF: "comp0001-0000-4000-8000-000000000011",
      ITF: "comp0001-0000-4000-8000-000000000012",
      LOAN: "comp0001-0000-4000-8000-000000000013",
      COOP: "comp0001-0000-4000-8000-000000000014",
      UNI: "comp0001-0000-4000-8000-000000000015",
      ADV: "comp0001-0000-4000-8000-000000000016",
    };

    const salaryComponents = [
      {
        id: SC.BAS,
        name: "Basic Salary",
        shortName: "BAS",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: true,
        isStatutory: true,
        isFunction: false,
        accountId: 20,
        rank: 1,
        isPrimary: true,
      },
      {
        id: SC.HOU,
        name: "Housing",
        shortName: "HOU",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: true,
        isStatutory: false,
        isFunction: false,
        accountId: 21,
        rank: 2,
        isPrimary: false,
      },
      {
        id: SC.TRN,
        name: "Transport",
        shortName: "TRN",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: true,
        isStatutory: false,
        isFunction: false,
        accountId: 22,
        rank: 3,
        isPrimary: false,
      },
      {
        id: SC.MEA,
        name: "Meal Allowance",
        shortName: "MEA",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: true,
        isStatutory: false,
        isFunction: false,
        accountId: 36,
        rank: 4,
        isPrimary: false,
      },
      {
        id: SC.OVT,
        name: "Overtime",
        shortName: "OVT",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 37,
        rank: 5,
        isPrimary: false,
      },
      {
        id: SC.BON,
        name: "Bonus",
        shortName: "BON",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 38,
        rank: 6,
        isPrimary: false,
      },
      {
        id: SC.LEV,
        name: "Leave Allowance",
        shortName: "LEV",
        type: "EARNING",
        status: "Active",
        isTaxable: true,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 39,
        rank: 7,
        isPrimary: false,
      },
      {
        id: SC.PAYE,
        name: "PAYE",
        shortName: "PAYE",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: true,
        isFunction: true,
        functionPercentage: 100,
        functionElements: [SC.BAS, SC.HOU, SC.TRN, SC.MEA],
        accountId: 24,
        rank: 1,
        isPrimary: true,
      },
      {
        id: SC.PEN,
        name: "Pension",
        shortName: "PEN",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: true,
        isFunction: true,
        functionPercentage: 8,
        functionElements: [SC.BAS, SC.HOU, SC.TRN],
        accountId: 25,
        rank: 2,
        isPrimary: true,
      },
      {
        id: SC.NHF,
        name: "NHF",
        shortName: "NHF",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: true,
        isFunction: true,
        functionPercentage: 2,
        functionElements: [SC.BAS, SC.MEA],
        accountId: 27,
        rank: 3,
        isPrimary: true,
      },
      {
        id: SC.NSITF,
        name: "NSITF",
        shortName: "NSITF",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: true,
        isFunction: true,
        functionPercentage: 1,
        functionElements: [SC.BAS],
        accountId: 40,
        rank: 4,
        isPrimary: true,
      },
      {
        id: SC.ITF,
        name: "ITF",
        shortName: "ITF",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: true,
        isFunction: true,
        functionPercentage: 1,
        functionElements: [SC.BAS],
        accountId: 41,
        rank: 5,
        isPrimary: true,
      },
      {
        id: SC.LOAN,
        name: "Loan Repayment",
        shortName: "LOAN",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 28,
        rank: 6,
        isPrimary: true,
      },
      {
        id: SC.COOP,
        name: "Cooperative",
        shortName: "COOP",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 42,
        rank: 7,
        isPrimary: false,
      },
      {
        id: SC.UNI,
        name: "Union Dues",
        shortName: "UNI",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 43,
        rank: 8,
        isPrimary: false,
      },
      {
        id: SC.ADV,
        name: "Advance Salary",
        shortName: "ADV",
        type: "DEDUCTION",
        status: "Active",
        isTaxable: false,
        isPensionable: false,
        isStatutory: false,
        isFunction: false,
        accountId: 44,
        rank: 9,
        isPrimary: true,
      },
    ];

    for (const component of salaryComponents) {
      const functionPercentage =
        component.isFunction && component.functionPercentage != null
          ? component.functionPercentage
          : null;
      const functionElements =
        component.isFunction && Array.isArray(component.functionElements)
          ? component.functionElements
          : null;

      await prisma.salaryComponent.upsert({
        where: { id: component.id },
        update: {
          name: component.name,
          shortName: component.shortName,
          type: component.type,
          status: component.status,
          isTaxable: component.isTaxable,
          isPensionable: component.isPensionable,
          isStatutory: component.isStatutory,
          isFunction: component.isFunction,
          functionPercentage,
          functionElements,
          accountId: component.accountId,
          rank: component.rank,
          isPrimary: component.isPrimary,
        },
        create: {
          ...component,
          functionPercentage,
          functionElements,
        },
      });
    }
    console.log(`   ✓ ${salaryComponents.length} salary components`);

    console.log("🏬 Seeding departments...");
    const departments = [
      { id: "depa0001-0000-4000-8000-000000000001", name: "Administration", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000002", name: "Academics", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000003", name: "Accounts", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000004", name: "ICT", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000005", name: "Maintenance", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000006", name: "Security", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000007", name: "Boarding", status: "Active" },
      { id: "depa0001-0000-4000-8000-000000000008", name: "Library", status: "Active" },
    ];

    for (const dep of departments) {
      await prisma.department.upsert({
        where: { id: dep.id },
        update: { name: dep.name, status: dep.status },
        create: dep,
      });
    }
    console.log(`   ✓ ${departments.length} departments`);

    // Grade levels
    console.log("🏫 Seeding grade levels...");
    const gradeLevels = [
      { id: "grad0001-0000-4000-8000-000000000001", name: "GL1", status: "Active" },
      { id: "grad0001-0000-4000-8000-000000000002", name: "GL2", status: "Active" },
      { id: "grad0001-0000-4000-8000-000000000003", name: "GL3", status: "Active" },
      { id: "grad0001-0000-4000-8000-000000000004", name: "GL4", status: "Active" },
      { id: "grad0001-0000-4000-8000-000000000005", name: "GL5", status: "Active" },
      { id: "grad0001-0000-4000-8000-000000000006", name: "GL6", status: "Active" },
    ];

    for (const gl of gradeLevels) {
      await prisma.gradeLevel.upsert({
        where: { id: gl.id },
        update: { name: gl.name, status: gl.status },
        create: gl,
      });
    }
    console.log(`   ✓ ${gradeLevels.length} grade levels`);

    const DEPT = {
      ADMIN: "depa0001-0000-4000-8000-000000000001",
      ACADEMICS: "depa0001-0000-4000-8000-000000000002",
      ACCOUNTS: "depa0001-0000-4000-8000-000000000003",
      ICT: "depa0001-0000-4000-8000-000000000004",
      MAINTENANCE: "depa0001-0000-4000-8000-000000000005",
      SECURITY: "depa0001-0000-4000-8000-000000000006",
      BOARDING: "depa0001-0000-4000-8000-000000000007",
      LIBRARY: "depa0001-0000-4000-8000-000000000008",
    };

    const GL = {
      GL1: "grad0001-0000-4000-8000-000000000001",
      GL2: "grad0001-0000-4000-8000-000000000002",
      GL3: "grad0001-0000-4000-8000-000000000003",
      GL4: "grad0001-0000-4000-8000-000000000004",
      GL5: "grad0001-0000-4000-8000-000000000005",
      GL6: "grad0001-0000-4000-8000-000000000006",
    };

    // Salary charts — one row per (gradeLevel, step, employmentType, component); deductions only Union Dues
    console.log("📋 Seeding salary charts...");
    const salaryChartSlots = [
      {
        slot: "000001",
        gradeLevelId: GL.GL1,
        step: 1,
        employmentType: "Contractual",
        amounts: {
          [SC.BAS]: 185000,
          [SC.HOU]: 18500,
          [SC.TRN]: 12000,
          [SC.MEA]: 8000,
          [SC.UNI]: 500,
        },
      },
      {
        slot: "000002",
        gradeLevelId: GL.GL2,
        step: 2,
        employmentType: "Permanent",
        amounts: {
          [SC.BAS]: 295000,
          [SC.HOU]: 45000,
          [SC.TRN]: 25000,
          [SC.MEA]: 15000,
          [SC.UNI]: 1000,
        },
      },
      {
        slot: "000003",
        gradeLevelId: GL.GL3,
        step: 3,
        employmentType: "Permanent",
        amounts: {
          [SC.BAS]: 385000,
          [SC.HOU]: 55000,
          [SC.TRN]: 35000,
          [SC.MEA]: 20000,
          [SC.OVT]: 15000,
          [SC.UNI]: 1500,
        },
      },
      {
        slot: "000004",
        gradeLevelId: GL.GL4,
        step: 4,
        employmentType: "Permanent",
        amounts: {
          [SC.BAS]: 485000,
          [SC.HOU]: 70000,
          [SC.TRN]: 45000,
          [SC.MEA]: 25000,
          [SC.OVT]: 20000,
          [SC.BON]: 50000,
          [SC.UNI]: 2000,
        },
      },
      {
        slot: "000005",
        gradeLevelId: GL.GL5,
        step: 5,
        employmentType: "Permanent",
        amounts: {
          [SC.BAS]: 720000,
          [SC.HOU]: 120000,
          [SC.TRN]: 60000,
          [SC.MEA]: 35000,
          [SC.OVT]: 30000,
          [SC.BON]: 80000,
          [SC.LEV]: 40000,
          [SC.UNI]: 2500,
        },
      },
      {
        slot: "000006",
        gradeLevelId: GL.GL6,
        step: 6,
        employmentType: "Permanent",
        amounts: {
          [SC.BAS]: 850000,
          [SC.HOU]: 150000,
          [SC.TRN]: 75000,
          [SC.MEA]: 40000,
          [SC.OVT]: 40000,
          [SC.BON]: 100000,
          [SC.LEV]: 60000,
          [SC.UNI]: 3000,
        },
      },
    ];

    let salaryChartRowIndex = 0;
    for (const chartSlot of salaryChartSlots) {
      let componentIndex = 0;
      for (const [componentId, amount] of Object.entries(chartSlot.amounts)) {
        componentIndex += 1;
        salaryChartRowIndex += 1;
        const chartId = `chart0001-0000-4000-8000-${chartSlot.slot}${String(componentIndex).padStart(2, "0")}`;
        await prisma.salaryChart.upsert({
          where: {
            gradeLevelId_step_employmentType_componentId: {
              gradeLevelId: chartSlot.gradeLevelId,
              step: chartSlot.step,
              employmentType: chartSlot.employmentType,
              componentId,
            },
          },
          update: {
            amount,
            status: "Active",
            createdBy: adminUserId,
            updatedBy: adminUserId,
          },
          create: {
            id: chartId,
            gradeLevelId: chartSlot.gradeLevelId,
            step: chartSlot.step,
            employmentType: chartSlot.employmentType,
            componentId,
            amount,
            status: "Active",
            createdBy: adminUserId,
            updatedBy: adminUserId,
          },
        });
      }
    }
    console.log(
      `   ✓ ${salaryChartRowIndex} salary chart rows (${salaryChartSlots.length} staff payroll slots)`
    );

    // Staff (+ linked user accounts, same as StaffService.createStaffWithUser)
    console.log("👔 Seeding staff...");
    const staffMembers = [
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909001",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a001",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909001",
        email: "ngozi.okonkwo@staff.school.ng",
        name: "Dr. Ngozi Okonkwo",
        position: "principal",
        employmentType: "Permanent",
        departmentId: DEPT.ADMIN,
        gradeLevelId: GL.GL6,
        step: 6,
        salary: 850000,
        dateOfAppointment: new Date("2015-09-01"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909002",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a002",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909002",
        email: "tunde.bello@staff.school.ng",
        name: "Mr. Tunde Bello",
        position: "vice_principal",
        employmentType: "Permanent",
        departmentId: DEPT.ADMIN,
        gradeLevelId: GL.GL5,
        step: 5,
        salary: 720000,
        dateOfAppointment: new Date("2017-01-15"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909003",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a003",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909003",
        email: "ada.musa@staff.school.ng",
        name: "Mrs. Ada Musa",
        position: "class_teacher",
        employmentType: "Permanent",
        departmentId: DEPT.ACADEMICS,
        gradeLevelId: GL.GL4,
        step: 4,
        salary: 485000,
        dateOfAppointment: new Date("2019-09-01"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909004",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a004",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909004",
        email: "james.eze@staff.school.ng",
        name: "Mr. James Eze",
        position: "subject_teacher",
        employmentType: "Permanent",
        departmentId: DEPT.ACADEMICS,
        gradeLevelId: GL.GL3,
        step: 3,
        salary: 385000,
        dateOfAppointment: new Date("2020-09-01"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909005",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a005",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909005",
        email: "fatima.yusuf@staff.school.ng",
        name: "Mrs. Fatima Yusuf",
        position: "subject_teacher",
        employmentType: "Permanent",
        departmentId: DEPT.ACADEMICS,
        gradeLevelId: GL.GL3,
        step: 3,
        salary: 385000,
        dateOfAppointment: new Date("2021-01-10"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909006",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a006",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909006",
        email: "chidi.okafor@staff.school.ng",
        name: "Mr. Chidi Okafor",
        position: "teacher",
        employmentType: "Permanent",
        departmentId: DEPT.ACADEMICS,
        gradeLevelId: GL.GL2,
        step: 2,
        salary: 295000,
        dateOfAppointment: new Date("2022-09-01"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909007",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a007",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909007",
        email: "bola.adeyemi@staff.school.ng",
        name: "Mrs. Bola Adeyemi",
        position: "admin",
        employmentType: "Permanent",
        departmentId: DEPT.ACCOUNTS,
        gradeLevelId: GL.GL4,
        step: 4,
        salary: 420000,
        dateOfAppointment: new Date("2018-03-01"),
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "a8b9c0d1-e2f3-4234-a012-345678909008",
        userId: "a8b9c0d1-e2f3-4234-a012-34567890a008",
        StaffNumber: "a8b9c0d1-e2f3-4234-a012-345678909008",
        email: "emmanuel.nwosu@staff.school.ng",
        name: "Mr. Emmanuel Nwosu",
        position: "assistant_teacher",
        employmentType: "Contractual",
        departmentId: DEPT.ACADEMICS,
        gradeLevelId: GL.GL1,
        step: 1,
        salary: 185000,
        dateOfAppointment: new Date("2024-09-01"),
        status: "Active",
        createdById: adminUserId,
      },
    ];

    for (const member of staffMembers) {
      await upsertStaffWithUser(hashedPassword, member);
    }
    console.log(`   ✓ ${staffMembers.length} staff (with user accounts, password: 12345)`);

    // Cashiers (linked user or staff + cash ledger for sales posting)
    console.log("💵 Seeding cashiers...");
    const cashiers = [
      {
        id: "cash0001-0000-4000-8000-000000000001",
        name: "School Admin Cashier",
        userId: "77e7a005-b0a5-4a6e-897c-f827333924d4",
        staffId: null,
        accountChartId: 47,
        status: "Active",
      },
      {
        id: "cash0001-0000-4000-8000-000000000002",
        name: "Accounts Office Cashier",
        staffId: "a8b9c0d1-e2f3-4234-a012-345678909007",
        accountChartId: 48,
        status: "Active",
      },
      {
        id: "cash0001-0000-4000-8000-000000000003",
        name: "Store Sales Cashier",
        staffId: "a8b9c0d1-e2f3-4234-a012-345678909004",
        accountChartId: 49,
        userId: "77e7a005-b0a5-4a6e-897c-f827333924d4",
        status: "Active",
      },
      {
        id: "cash0001-0000-4000-8000-000000000004",
        name: "Reception Cashier",
        staffId: "a8b9c0d1-e2f3-4234-a012-345678909003",
        accountChartId: 50,
        status: "Active",
      },
    ];

    for (const cashier of cashiers) {
      let staffId = cashier.staffId ?? null;
      let userId = cashier.userId ?? null;
      if (staffId && !userId) {
        const staff = await prisma.staff.findUnique({
          where: { id: staffId },
          select: { userId: true },
        });
        userId = staff?.userId ?? null;
      }

      await prisma.cashier.upsert({
        where: { id: cashier.id },
        update: {
          name: cashier.name,
          staffId,
          userId,
          accountChartId: cashier.accountChartId,
          status: cashier.status,
        },
        create: {
          id: cashier.id,
          name: cashier.name,
          staffId,
          userId,
          accountChartId: cashier.accountChartId,
          status: cashier.status,
        },
      });
    }
    console.log(`   ✓ ${cashiers.length} cashiers`);

    // School classes and sub-classes (required for student class assignment)
    console.log("🎓 Seeding school classes and sub-classes...");
    const schoolClasses = [
      {
        id: "c4d5e6f7-a8b9-4012-c012-345678905001",
        name: "JSS 1",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "c4d5e6f7-a8b9-4012-c012-345678905002",
        name: "JSS 2",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "c4d5e6f7-a8b9-4012-c012-345678905003",
        name: "JSS 3",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "c4d5e6f7-a8b9-4012-c012-345678905004",
        name: "SS 1",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "c4d5e6f7-a8b9-4012-c012-345678905005",
        name: "SS 2",
        status: "Active",
        createdById: adminUserId,
      },
    ];

    for (const cls of schoolClasses) {
      await prisma.schoolClass.upsert({
        where: { name: cls.name },
        update: { status: cls.status },
        create: cls,
      });
    }

    const classIds = {
      jss1: "c4d5e6f7-a8b9-4012-c012-345678905001",
      jss2: "c4d5e6f7-a8b9-4012-c012-345678905002",
      jss3: "c4d5e6f7-a8b9-4012-c012-345678905003",
      ss1: "c4d5e6f7-a8b9-4012-c012-345678905004",
      ss2: "c4d5e6f7-a8b9-4012-c012-345678905005",
    };

    const subClasses = [
      {
        id: "d5e6f7a8-b9c0-4123-d012-345678906001",
        name: "A",
        classId: classIds.jss1,
        status: "Active",
      },
      {
        id: "d5e6f7a8-b9c0-4123-d012-345678906002",
        name: "B",
        classId: classIds.jss1,
        status: "Active",
      },
      {
        id: "d5e6f7a8-b9c0-4123-d012-345678906003",
        name: "A",
        classId: classIds.jss2,
        status: "Active",
      },
      {
        id: "d5e6f7a8-b9c0-4123-d012-345678906004",
        name: "B",
        classId: classIds.jss2,
        status: "Active",
      },
      {
        id: "d5e6f7a8-b9c0-4123-d012-345678906005",
        name: "A",
        classId: classIds.ss1,
        status: "Active",
      },
    ];

    for (const sub of subClasses) {
      await prisma.subClass.upsert({
        where: {
          name_classId: {
            name: sub.name,
            classId: sub.classId,
          },
        },
        update: { status: sub.status },
        create: sub,
      });
    }
    console.log(`   ✓ ${schoolClasses.length} classes, ${subClasses.length} sub-classes`);

    // Students (+ AR ledger accounts under STUDENT_SUBHEAD)
    console.log("👨‍🎓 Seeding students...");
    const subClassIds = {
      jss1A: "d5e6f7a8-b9c0-4123-d012-345678906001",
      jss1B: "d5e6f7a8-b9c0-4123-d012-345678906002",
      jss2A: "d5e6f7a8-b9c0-4123-d012-345678906003",
      jss2B: "d5e6f7a8-b9c0-4123-d012-345678906004",
      ss1A: "d5e6f7a8-b9c0-4123-d012-345678906005",
    };

    const students = [
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907001",
        admissionNumber: "ADM2025001",
        firstName: "Chioma",
        middleName: "Ada",
        lastName: "Adebayo",
        studentEmail: "chioma.adebayo@student.school.ng",
        gender: "female",
        dateOfBirth: new Date("2013-04-12"),
        classId: classIds.jss1,
        subClassId: subClassIds.jss1A,
        guardianName: "Mr. Tunde Adebayo",
        guardianEmail: "tunde.adebayo@email.com",
        guardianContact: "+2348011111001",
        address: "12 Admiralty Way, Lekki, Lagos",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907002",
        admissionNumber: "ADM2025002",
        firstName: "Ibrahim",
        middleName: null,
        lastName: "Musa",
        studentEmail: "ibrahim.musa@student.school.ng",
        gender: "male",
        dateOfBirth: new Date("2013-08-25"),
        classId: classIds.jss1,
        subClassId: subClassIds.jss1B,
        guardianName: "Mrs. Halima Musa",
        guardianEmail: "halima.musa@email.com",
        guardianContact: "+2348011111002",
        address: "5 Zaria Road, Kaduna",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907003",
        admissionNumber: "ADM2025003",
        firstName: "Grace",
        middleName: "Chinelo",
        lastName: "Okoro",
        studentEmail: null,
        gender: "female",
        dateOfBirth: new Date("2012-11-03"),
        classId: classIds.jss2,
        subClassId: subClassIds.jss2A,
        guardianName: "Mr. Peter Okoro",
        guardianEmail: "peter.okoro@email.com",
        guardianContact: "+2348011111003",
        address: "22 Ogui Road, Enugu",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907004",
        admissionNumber: "ADM2025004",
        firstName: "David",
        middleName: "Oluwaseun",
        lastName: "Balogun",
        studentEmail: "david.balogun@student.school.ng",
        gender: "male",
        dateOfBirth: new Date("2012-01-19"),
        classId: classIds.jss2,
        subClassId: subClassIds.jss2B,
        guardianName: "Mrs. Funke Balogun",
        guardianEmail: "funke.balogun@email.com",
        guardianContact: "+2348011111004",
        address: "9 Ring Road, Ibadan",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907005",
        admissionNumber: "ADM2025005",
        firstName: "Amina",
        middleName: null,
        lastName: "Yusuf",
        studentEmail: "amina.yusuf@student.school.ng",
        gender: "female",
        dateOfBirth: new Date("2011-06-30"),
        classId: classIds.jss3,
        subClassId: null,
        guardianName: "Alhaji Yusuf Ibrahim",
        guardianEmail: "yusuf.ibrahim@email.com",
        guardianContact: "+2348011111005",
        address: "3 Kano Road, Kano",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907006",
        admissionNumber: "ADM2025006",
        firstName: "Emmanuel",
        middleName: "Chukwu",
        lastName: "Eze",
        studentEmail: "emmanuel.eze@student.school.ng",
        gender: "male",
        dateOfBirth: new Date("2010-09-14"),
        classId: classIds.ss1,
        subClassId: subClassIds.ss1A,
        guardianName: "Mr. Chinedu Eze",
        guardianEmail: "chinedu.eze@email.com",
        guardianContact: "+2348011111006",
        address: "14 Aba Road, Port Harcourt",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907007",
        admissionNumber: "ADM2025007",
        firstName: "Fatima",
        middleName: "Zainab",
        lastName: "Bello",
        studentEmail: null,
        gender: "female",
        dateOfBirth: new Date("2010-12-08"),
        classId: classIds.ss1,
        subClassId: subClassIds.ss1A,
        guardianName: "Dr. Aisha Bello",
        guardianEmail: "aisha.bello@email.com",
        guardianContact: "+2348011111007",
        address: "7 Garki Area 11, Abuja",
        status: "Active",
        createdById: adminUserId,
      },
      {
        id: "e6f7a8b9-c0d1-4234-e012-345678907008",
        admissionNumber: "ADM2025008",
        firstName: "Samuel",
        middleName: null,
        lastName: "Ojo",
        studentEmail: "samuel.ojo@student.school.ng",
        gender: "male",
        dateOfBirth: new Date("2009-05-22"),
        classId: classIds.ss2,
        subClassId: null,
        guardianName: "Mrs. Bola Ojo",
        guardianEmail: "bola.ojo@email.com",
        guardianContact: "+2348011111008",
        address: "18 Allen Avenue, Ikeja, Lagos",
        status: "Active",
        createdById: adminUserId,
      },
    ];

    let studentLedgerCount = 0;
    for (const st of students) {
      const student = await prisma.student.upsert({
        where: { admissionNumber: st.admissionNumber },
        update: {
          firstName: st.firstName,
          middleName: st.middleName,
          lastName: st.lastName,
          studentEmail: st.studentEmail,
          gender: st.gender,
          dateOfBirth: st.dateOfBirth,
          classId: st.classId,
          subClassId: st.subClassId,
          guardianName: st.guardianName,
          guardianEmail: st.guardianEmail,
          guardianContact: st.guardianContact,
          address: st.address,
          status: st.status,
          createdById: st.createdById,
        },
        create: st,
      });
      // No need of creating ledger accounts for students
      // const ledgerId = await ensureStudentLedgerAccount(student);
      // if (ledgerId) {
      //   studentLedgerCount += 1;
      // }
    }
    console.log(`   ✓ ${students.length} students, ${studentLedgerCount} student ledger accounts`);

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

    // Class default billings (amounts per class for current session / term)
    console.log("📋 Seeding class default billings...");
    const CLASS_JSS1 = "c4d5e6f7-a8b9-4012-c012-345678905001";
    const CLASS_JSS2 = "c4d5e6f7-a8b9-4012-c012-345678905002";
    const CLASS_JSS3 = "c4d5e6f7-a8b9-4012-c012-345678905003";
    const CLASS_SS1 = "c4d5e6f7-a8b9-4012-c012-345678905004";
    const CLASS_SS2 = "c4d5e6f7-a8b9-4012-c012-345678905005";
    const SUBCLASS_JSS1A = "d5e6f7a8-b9c0-4123-d012-345678906001";

    const classDefaultBillings = [
      // JSS 1 — class-wide (Third Term 2025/2026)
      { id: 1, classId: CLASS_JSS1, subclassId: null, billingId: 1, amount: 120000 },
      { id: 2, classId: CLASS_JSS1, subclassId: null, billingId: 2, amount: 5000 },
      { id: 3, classId: CLASS_JSS1, subclassId: null, billingId: 3, amount: 10000 },
      { id: 4, classId: CLASS_JSS1, subclassId: null, billingId: 4, amount: 8000 },
      { id: 5, classId: CLASS_JSS1, subclassId: null, billingId: 8, amount: 3000 },
      { id: 6, classId: CLASS_JSS1, subclassId: null, billingId: 9, amount: 2000 },
      // JSS 1A — optional transport override
      { id: 7, classId: CLASS_JSS1, subclassId: SUBCLASS_JSS1A, billingId: 5, amount: 25000 },
      // JSS 2
      { id: 8, classId: CLASS_JSS2, subclassId: null, billingId: 1, amount: 135000 },
      { id: 9, classId: CLASS_JSS2, subclassId: null, billingId: 2, amount: 5000 },
      { id: 10, classId: CLASS_JSS2, subclassId: null, billingId: 3, amount: 10000 },
      { id: 11, classId: CLASS_JSS2, subclassId: null, billingId: 4, amount: 8000 },
      { id: 12, classId: CLASS_JSS2, subclassId: null, billingId: 8, amount: 3500 },
      { id: 13, classId: CLASS_JSS2, subclassId: null, billingId: 9, amount: 2000 },
      // JSS 3
      { id: 14, classId: CLASS_JSS3, subclassId: null, billingId: 1, amount: 150000 },
      { id: 15, classId: CLASS_JSS3, subclassId: null, billingId: 2, amount: 5000 },
      { id: 16, classId: CLASS_JSS3, subclassId: null, billingId: 3, amount: 12000 },
      { id: 17, classId: CLASS_JSS3, subclassId: null, billingId: 8, amount: 4000 },
      // SS 1
      { id: 18, classId: CLASS_SS1, subclassId: null, billingId: 1, amount: 180000 },
      { id: 19, classId: CLASS_SS1, subclassId: null, billingId: 2, amount: 7500 },
      { id: 20, classId: CLASS_SS1, subclassId: null, billingId: 3, amount: 15000 },
      { id: 21, classId: CLASS_SS1, subclassId: null, billingId: 4, amount: 10000 },
      { id: 22, classId: CLASS_SS1, subclassId: null, billingId: 8, amount: 5000 },
      // SS 2
      { id: 23, classId: CLASS_SS2, subclassId: null, billingId: 1, amount: 200000 },
      { id: 24, classId: CLASS_SS2, subclassId: null, billingId: 2, amount: 7500 },
      { id: 25, classId: CLASS_SS2, subclassId: null, billingId: 3, amount: 15000 },
      { id: 26, classId: CLASS_SS2, subclassId: null, billingId: 8, amount: 5000 },
    ].map((row) => ({
      ...row,
      session: seededSession.id,
      term: seededTerm.id,
    }));

    for (const row of classDefaultBillings) {
      await prisma.classDefaultBilling.upsert({
        where: { id: row.id },
        update: {
          classId: row.classId,
          subclassId: row.subclassId,
          session: row.session,
          term: row.term,
          billingId: row.billingId,
          amount: row.amount,
        },
        create: row,
      });
    }
    console.log(
      `   ✓ ${classDefaultBillings.length} class default billings (2025/2026, Third Term)`
    );

    // Donated inventory (stock-in via donation transactions)
    console.log("🎁 Seeding donated inventory transactions...");
    const STORE_MAIN = "a3a4b5c6-d7e8-4890-a012-345678904001";
    const STORE_ANNEX = "a3a4b5c6-d7e8-4890-a012-345678904002";
    const ITEM_EXERCISE_BOOK = "f2a3b4c5-d6e7-4890-a012-345678903004";
    const ITEM_PENCIL_PACK = "f2a3b4c5-d6e7-4890-a012-345678903005";
    const ITEM_A4_PAPER = "f2a3b4c5-d6e7-4890-a012-345678903001";
    const ITEM_DESKTOP = "f2a3b4c5-d6e7-4890-a012-345678903009";
    const ITEM_MOUSE = "f2a3b4c5-d6e7-4890-a012-345678903010";
    const ITEM_FOOTBALL = "f2a3b4c5-d6e7-4890-a012-345678903013";
    const ITEM_CHAIR = "f2a3b4c5-d6e7-4890-a012-345678903012";
    const ITEM_HAND_SOAP = "f2a3b4c5-d6e7-4890-a012-345678903006";
    const ITEM_LED_BULB = "f2a3b4c5-d6e7-4890-a012-345678903014";
    const ITEM_BALLPOINT = "f2a3b4c5-d6e7-4890-a012-345678903002";

    const donationTransactions = [
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909001",
        itemId: ITEM_EXERCISE_BOOK,
        storeId: STORE_MAIN,
        qtyIn: 500,
        referenceNo: "DON-20260315-PTA001",
        notes: "PTA book drive for junior secondary students",
        supplierReceiver: "School PTA",
        transactionDate: new Date("2026-03-15T10:00:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909002",
        itemId: ITEM_PENCIL_PACK,
        storeId: STORE_MAIN,
        qtyIn: 40,
        referenceNo: "DON-20260315-PTA001",
        notes: "PTA stationery donation (HB pencil packs)",
        supplierReceiver: "School PTA",
        transactionDate: new Date("2026-03-15T10:05:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909003",
        itemId: ITEM_BALLPOINT,
        storeId: STORE_MAIN,
        qtyIn: 25,
        referenceNo: "DON-20260315-PTA001",
        notes: "PTA ballpoint pen cartons for exam term",
        supplierReceiver: "School PTA",
        transactionDate: new Date("2026-03-15T10:10:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909004",
        itemId: ITEM_A4_PAPER,
        storeId: STORE_MAIN,
        qtyIn: 30,
        referenceNo: "DON-20260401-ALUMNI01",
        notes: "Alumni association office paper donation",
        supplierReceiver: "Old Students Association",
        transactionDate: new Date("2026-04-01T09:00:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909005",
        itemId: ITEM_DESKTOP,
        storeId: STORE_ANNEX,
        qtyIn: 5,
        referenceNo: "DON-20260401-ALUMNI01",
        notes: "Refurbished desktops for ICT laboratory",
        supplierReceiver: "Old Students Association",
        transactionDate: new Date("2026-04-01T09:30:00.000Z"),
        isAcknowledged: false,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909006",
        itemId: ITEM_MOUSE,
        storeId: STORE_ANNEX,
        qtyIn: 20,
        referenceNo: "DON-20260401-ALUMNI01",
        notes: "Wireless mice donated with alumni computer batch",
        supplierReceiver: "Old Students Association",
        transactionDate: new Date("2026-04-01T09:35:00.000Z"),
        isAcknowledged: false,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909007",
        itemId: ITEM_FOOTBALL,
        storeId: STORE_MAIN,
        qtyIn: 30,
        referenceNo: "DON-20260510-ROTARY01",
        notes: "Inter-house sports equipment donation",
        supplierReceiver: "Rotary Club Lagos",
        customerMame: "Rotary Club Lagos",
        transactionDate: new Date("2026-05-10T14:00:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909008",
        itemId: ITEM_CHAIR,
        storeId: STORE_MAIN,
        qtyIn: 50,
        referenceNo: "DON-20260510-ROTARY01",
        notes: "Classroom chairs for expanded JSS block",
        supplierReceiver: "Rotary Club Lagos",
        customerMame: "Rotary Club Lagos",
        transactionDate: new Date("2026-05-10T14:15:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909009",
        itemId: ITEM_HAND_SOAP,
        storeId: STORE_MAIN,
        qtyIn: 12,
        referenceNo: "DON-20260601-HYGIENE",
        notes: "Hygiene supplies for dormitories and washrooms",
        supplierReceiver: "Wellness Foundation NGO",
        transactionDate: new Date("2026-06-01T11:00:00.000Z"),
        isAcknowledged: true,
      },
      {
        id: "a1b2c3d4-e5f6-4890-d012-345678909010",
        itemId: ITEM_LED_BULB,
        storeId: STORE_ANNEX,
        qtyIn: 100,
        referenceNo: "DON-20260601-HYGIENE",
        notes: "LED bulbs for maintenance energy-saving upgrade",
        supplierReceiver: "Wellness Foundation NGO",
        transactionDate: new Date("2026-06-01T11:20:00.000Z"),
        isAcknowledged: false,
      },
    ];

    for (const row of donationTransactions) {
      await prisma.inventoryTransaction.upsert({
        where: { id: row.id },
        update: {
          itemId: row.itemId,
          storeId: row.storeId,
          transactionType: "donation",
          qtyIn: row.qtyIn,
          qtyOut: 0,
          inCost: 0,
          outCost: 0,
          amountPaid: 0,
          status: "completed",
          referenceNo: row.referenceNo,
          notes: row.notes,
          supplierReceiver: row.supplierReceiver,
          ...(row.customerMame !== undefined ? { customerMame: row.customerMame } : {}),
          sessionId: seededSession.id,
          termId: seededTerm.id,
          transactionDate: row.transactionDate,
          createdById: adminUserId,
          isAcknowledged: row.isAcknowledged,
          ...(row.isAcknowledged
            ? {
                acknowledgedAt: row.transactionDate,
                acknowledgedBy: adminUserId,
              }
            : { acknowledgedAt: null, acknowledgedBy: null }),
        },
        create: {
          id: row.id,
          itemId: row.itemId,
          storeId: row.storeId,
          transactionType: "donation",
          qtyIn: row.qtyIn,
          qtyOut: 0,
          inCost: 0,
          outCost: 0,
          amountPaid: 0,
          status: "completed",
          referenceNo: row.referenceNo,
          notes: row.notes,
          supplierReceiver: row.supplierReceiver,
          ...(row.customerMame !== undefined ? { customerMame: row.customerMame } : {}),
          sessionId: seededSession.id,
          termId: seededTerm.id,
          transactionDate: row.transactionDate,
          createdById: adminUserId,
          isAcknowledged: row.isAcknowledged,
          ...(row.isAcknowledged
            ? {
                acknowledgedAt: row.transactionDate,
                acknowledgedBy: adminUserId,
              }
            : {}),
        },
      });
    }
    console.log(`   ✓ ${donationTransactions.length} donation transactions (4 reference batches)`);

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
