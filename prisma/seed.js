const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create sample users
    const hashedPassword = await bcrypt.hash('12345', 10);

    await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'Admin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: 'active',
      },
      create: {
        email: 'admin@admin.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'Admin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: 'active',
      },
    });

    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'Admin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: 'active',
      },
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'Admin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        isDeleted: false,
        status: 'active',
      },
    });

    // Create merchant users for each merchant
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
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