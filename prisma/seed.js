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
      update: {},
      create: {
        email: 'admin@admin.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'SuperAdmin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'Admin',
        role: 'SuperAdmin',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    // Create merchant users for each merchant
    const merchantUser1 = await prisma.user.upsert({
      where: { email: 'merchant@example.com' },
      update: {},
      create: {
        email: 'merchant@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Merchant',
        userType: 'Merchant',
        role: 'Merchant',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const merchantUser2 = await prisma.user.upsert({
      where: { email: 'merchant2@example.com' },
      update: {},
      create: {
        email: 'merchant2@example.com',
        password: hashedPassword,
        firstName: 'Mary',
        lastName: 'Johnson',
        userType: 'Merchant',
        role: 'Merchant',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const merchantUser3 = await prisma.user.upsert({
      where: { email: 'merchant3@example.com' },
      update: {},
      create: {
        email: 'merchant3@example.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Wilson',
        userType: 'Merchant',
        role: 'Merchant',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const merchantUser4 = await prisma.user.upsert({
      where: { email: 'merchant4@example.com' },
      update: {},
      create: {
        email: 'merchant4@example.com',
        password: hashedPassword,
        firstName: 'Emma',
        lastName: 'Brown',
        userType: 'Merchant',
        role: 'Merchant',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const merchantUser5 = await prisma.user.upsert({
      where: { email: 'merchant5@example.com' },
      update: {},
      create: {
        email: 'merchant5@example.com',
        password: hashedPassword,
        firstName: 'Michael',
        lastName: 'Taylor',
        userType: 'Merchant',
        role: 'Merchant',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const buyerUser = await prisma.user.upsert({
      where: { email: 'buyer@example.com' },
      update: {},
      create: {
        email: 'buyer@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Buyer',
        userType: 'Buyer',
        role: 'Buyer',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    const buyerUser2 = await prisma.user.upsert({
      where: { email: 'bobohavilah@gmail.com' },
      update: {},
      create: {
        email: 'bobohavilah@gmail.com',
        password: hashedPassword,
        firstName: 'Stephen',
        lastName: 'AKINBOBOLA',
        userType: 'Buyer',
        role: 'Buyer',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });
    const buyerUser3 = await prisma.user.upsert({
      where: { email: 'efatoyinbo@gmail.com' },
      update: {},
      create: {
        email: 'efatoyinbo@gmail.com',
        password: hashedPassword,
        firstName: 'Fatoyin',
        lastName: 'Emmamuel',
        userType: 'Buyer',
        role: 'Buyer',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
      },
    });

    console.log('✅ Users created successfully');

    // Seed banks from banks.json
    console.log('🏦 Seeding banks...');
    const banksPath = path.join(__dirname, '..', 'banks.json');
    const banksData = JSON.parse(fs.readFileSync(banksPath, 'utf8'));

    // Bulk insert (fast). If a bankCode already exists, it will be skipped.
    // Note: this does NOT update existing bankName values. If you need updates too,
    // you can either delete and re-seed, or run a separate update step.
    await prisma.bank.createMany({
      data: banksData.map((bank) => ({
        id: bank.id,
        bankCode: bank.bankCode,
        bankName: bank.bankName,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ ${banksData.length} banks seeded successfully`);

    // Create sample merchants
    const merchant1 = await prisma.merchant.upsert({
      where: { businessEmail: 'techcorp@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: 'TechCorp Solutions Ltd',
        businessEmail: 'techcorp@example.com',
        authorizedPerson: 'John Doe',
        authorizedDesignation: 'CEO',
        authorizedPhoneNo: '+2348012345678',
        authorizedEmail: 'john.doe@techcorp.com',
        typeOfServiceOrProducts: 'Software Development',
        cacNumber: 'RC123456789',
        dateOfIncorporation: '2020-01-15',
        tin: 'TIN123456789',
        registrationAddress: '123 Tech Street, Lagos',
        businessDescription: 'Leading software development company',
        businessCategory: 'Technology & Communications',
        businessType: 'Software & SaaS Providers',
        businessPhone: '+2348012345678',
        officeWebsite: 'https://techcorp.com',
        documentStatus: 'Pending',
        applicationStatus: 'Pending',
        verificationStatus: 'Pending',
        isDeleted: false,
        merchantCharge: 3.5
      },
    });

    const merchant2 = await prisma.merchant.upsert({
      where: { businessEmail: 'retailstore@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: 'Retail Store Nigeria Ltd',
        businessEmail: 'retailstore@example.com',
        authorizedPerson: 'Mary Johnson',
        authorizedDesignation: 'Managing Director',
        authorizedPhoneNo: '+2348023456789',
        authorizedEmail: 'mary.johnson@retailstore.com',
        typeOfServiceOrProducts: 'Retail & E-commerce',
        cacNumber: 'RC987654321',
        dateOfIncorporation: '2019-03-20',
        tin: 'TIN987654321',
        registrationAddress: '456 Commerce Avenue, Abuja',
        businessDescription: 'Premium retail and e-commerce platform',
        businessCategory: 'Retail & Consumer Goods',
        businessType: 'E-commerce & Marketplaces',
        businessPhone: '+2348023456789',
        officeWebsite: 'https://retailstore.ng',
        // All verification statuses approved
        isBusinessInfoVerified: 'Approved',
        isAuthorizedPersonVerified: 'Approved',
        isDirectorsVerified: 'Approved',
        isShareholdersVerified: 'Approved',
        isAuthorisersVerified: 'Approved',
        isBankAccountVerified: 'Approved',
        // Document URLs provided
        cacCertificate: 'https://docs.retailstore.ng/cac-certificate.pdf',
        isCACCertificateVerified: 'Approved',
        memart: 'https://docs.retailstore.ng/memart-certificate.pdf',
        isMEMERTCertificateVerified: 'Approved',
        cac2Form: 'https://docs.retailstore.ng/cac2-form.pdf',
        isCAC2CAC7FormVerified: 'Approved',
        utilityBill: 'https://docs.retailstore.ng/utility-bill.pdf',
        utilityBillVerified: 'Approved',
        boardResolution: 'https://docs.retailstore.ng/board-resolution.pdf',
        boardResolutionVerified: 'Approved',
        // All statuses approved
        documentStatus: 'Approved',
        applicationStatus: 'Approved',
        verificationStatus: 'Approved',
        // Bank account details
        bankAccount: '1234567890',
        accountName: 'Retail Store Nigeria Ltd',
        merchantCharge: 3.5,
        bankName: 'Access Bank',
        bankCode: '044',
        // Terms and conditions
        isAgreedToTerms: true,
        agreedToTermsAt: new Date('2023-01-15T10:30:00Z'),
        agreedToTermsBy: merchantUser2.id,
        isDeleted: false,
      },
    });

    const merchant3 = await prisma.merchant.upsert({
      where: { businessEmail: 'foodservice@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: 'Food Service Solutions',
        businessEmail: 'foodservice@example.com',
        authorizedPerson: 'David Wilson',
        authorizedDesignation: 'Operations Manager',
        authorizedPhoneNo: '+2348034567890',
        authorizedEmail: 'david.wilson@foodservice.com',
        typeOfServiceOrProducts: 'Food & Beverage',
        cacNumber: 'RC456789123',
        dateOfIncorporation: '2021-06-10',
        tin: 'TIN456789123',
        registrationAddress: '789 Food Court, Port Harcourt',
        businessDescription: 'Quality food and beverage services',
        businessCategory: 'Hospitality & Food Services',
        businessType: 'Restaurants & Quick Service Outlets',
        businessPhone: '+2348034567890',
        officeWebsite: 'https://foodservice.ng',
        documentStatus: 'Rejected',
        applicationStatus: 'Rejected',
        verificationStatus: 'Rejected',
        isDeleted: false,
        merchantCharge: 3.5
      },
    });

    const merchant4 = await prisma.merchant.upsert({
      where: { businessEmail: 'logistics@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: 'Swift Logistics Nigeria Ltd',
        businessEmail: 'logistics@example.com',
        authorizedPerson: 'Emma Brown',
        authorizedDesignation: 'Chief Executive Officer',
        authorizedPhoneNo: '+2348045678901',
        authorizedEmail: 'emma.brown@swiftlogistics.com',
        typeOfServiceOrProducts: 'Logistics & Transportation',
        cacNumber: 'RC111222333',
        dateOfIncorporation: '2020-05-15',
        tin: 'TIN111222333',
        registrationAddress: '789 Transport Hub, Ikeja, Lagos',
        businessDescription: 'Premium logistics and transportation services',
        businessCategory: 'Logistics & Transportation',
        businessType: 'Courier & Delivery Services',
        businessPhone: '+2348045678901',
        officeWebsite: 'https://swiftlogistics.ng',
        // All verification statuses approved
        isBusinessInfoVerified: 'Approved',
        isAuthorizedPersonVerified: 'Approved',
        isDirectorsVerified: 'Approved',
        isShareholdersVerified: 'Approved',
        isAuthorisersVerified: 'Approved',
        isBankAccountVerified: 'Approved',
        // Document URLs provided
        cacCertificate: 'https://docs.swiftlogistics.ng/cac-certificate.pdf',
        isCACCertificateVerified: 'Approved',
        memart: 'https://docs.swiftlogistics.ng/memart-certificate.pdf',
        isMEMERTCertificateVerified: 'Approved',
        cac2Form: 'https://docs.swiftlogistics.ng/cac2-form.pdf',
        isCAC2CAC7FormVerified: 'Approved',
        utilityBill: 'https://docs.swiftlogistics.ng/utility-bill.pdf',
        utilityBillVerified: 'Approved',
        boardResolution: 'https://docs.swiftlogistics.ng/board-resolution.pdf',
        boardResolutionVerified: 'Approved',
        // All statuses approved
        documentStatus: 'Approved',
        applicationStatus: 'Approved',
        verificationStatus: 'Approved',
        // Bank account details
        bankAccount: '9876543210',
        accountName: 'Swift Logistics Nigeria Ltd',
        merchantCharge: 2.5,
        bankName: 'Zenith Bank',
        bankCode: '057',
        // Terms and conditions
        isAgreedToTerms: true,
        agreedToTermsAt: new Date('2023-02-20T10:30:00Z'),
        agreedToTermsBy: merchantUser4.id,
        isDeleted: false,
      },
    });

    const merchant5 = await prisma.merchant.upsert({
      where: { businessEmail: 'healthcare@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: 'Prime Healthcare Services Ltd',
        businessEmail: 'healthcare@example.com',
        authorizedPerson: 'Michael Taylor',
        authorizedDesignation: 'Medical Director',
        authorizedPhoneNo: '+2348056789012',
        authorizedEmail: 'michael.taylor@primehealthcare.com',
        typeOfServiceOrProducts: 'Healthcare & Medical Services',
        cacNumber: 'RC444555666',
        dateOfIncorporation: '2018-11-25',
        tin: 'TIN444555666',
        registrationAddress: '321 Medical Center, Wuse 2, Abuja',
        businessDescription: 'Comprehensive healthcare and medical services',
        businessCategory: 'Healthcare & Medical Services',
        businessType: 'Hospitals & Clinics',
        businessPhone: '+2348056789012',
        officeWebsite: 'https://primehealthcare.ng',
        // All verification statuses approved
        isBusinessInfoVerified: 'Approved',
        isAuthorizedPersonVerified: 'Approved',
        isDirectorsVerified: 'Approved',
        isShareholdersVerified: 'Approved',
        isAuthorisersVerified: 'Approved',
        isBankAccountVerified: 'Approved',
        // Document URLs provided
        cacCertificate: 'https://docs.primehealthcare.ng/cac-certificate.pdf',
        isCACCertificateVerified: 'Approved',
        memart: 'https://docs.primehealthcare.ng/memart-certificate.pdf',
        isMEMERTCertificateVerified: 'Approved',
        cac2Form: 'https://docs.primehealthcare.ng/cac2-form.pdf',
        isCAC2CAC7FormVerified: 'Approved',
        utilityBill: 'https://docs.primehealthcare.ng/utility-bill.pdf',
        utilityBillVerified: 'Approved',
        boardResolution: 'https://docs.primehealthcare.ng/board-resolution.pdf',
        boardResolutionVerified: 'Approved',
        // All statuses approved
        documentStatus: 'Approved',
        applicationStatus: 'Approved',
        verificationStatus: 'Approved',
        // Bank account details
        bankAccount: '5555555555',
        accountName: 'Prime Healthcare Services Ltd',
        merchantCharge: 4.0,
        bankName: 'United Bank for Africa',
        bankCode: '033',
        // Terms and conditions
        isAgreedToTerms: true,
        agreedToTermsAt: new Date('2023-03-10T14:00:00Z'),
        agreedToTermsBy: merchantUser5.id,
        isDeleted: false,
      },
    });

    console.log('✅ Merchants created successfully');

    // Log generated LiftPay IDs for merchants
    console.log('🏷️  Generated Merchant LiftPay IDs:');
    console.log(`   ${merchant1.liftpayId} - ${merchant1.businessName}`);
    console.log(`   ${merchant2.liftpayId} - ${merchant2.businessName}`);
    console.log(`   ${merchant3.liftpayId} - ${merchant3.businessName}`);
    console.log(`   ${merchant4.liftpayId} - ${merchant4.businessName}`);
    console.log(`   ${merchant5.liftpayId} - ${merchant5.businessName}`);

    // Update merchant users with their respective merchant IDs
    await prisma.user.update({
      where: { id: merchantUser1.id },
      data: { merchantId: merchant1.id },
    });

    await prisma.user.update({
      where: { id: merchantUser2.id },
      data: { merchantId: merchant2.id },
    });






    await prisma.user.update({
      where: { id: merchantUser3.id },
      data: { merchantId: merchant3.id },
    });

    await prisma.user.update({
      where: { id: merchantUser4.id },
      data: { merchantId: merchant4.id },
    });

    await prisma.user.update({
      where: { id: merchantUser5.id },
      data: { merchantId: merchant5.id },
    });

    console.log('✅ User-merchant relationships created');

    // Create sample buyers
    const buyer1 = await prisma.buyer.upsert({
      where: { email: 'buyer@example.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        userId: buyerUser.id,
        firstName: 'Jane',
        lastName: 'Buyer',
        phoneNumber: '+2348045678901',
        email: 'buyer@example.com',
        address: '321 Buyer Street, Lagos',
        gender: 'Female',
        idType: 'National ID',
        idNumber: 'ID123456789',
        nin: 'NIN123456789',
        bvn: 'BVN123456789',
        state: 'Lagos',
        LGA: 'Ikeja',
        streetName: 'Buyer Street',
        houseNo: '321',
        zipCode: '100001',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        IsSalaried: true,
        IsTermsAndConditionAccepted: true,
      },
    });

    // Create additional sample buyers
    const buyer2 = await prisma.buyer.upsert({
      where: { email: 'bobohavilah@gmail.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        userId: buyerUser2.id, // Using the second buyer user
        firstName: 'Stephen',
        lastName: 'AKINBOBOLA',
        phoneNumber: '+23480567890101',
        email: 'bobohavilah@gmail.com',
        address: '456 Customer Avenue, Abuja',
        gender: 'Male',
        idType: 'Driver License',
        idNumber: 'DL987654321',
        nin: 'NIN987654321',
        bvn: 'BVN987654321',
        state: 'Abuja',
        LGA: 'Garki',
        streetName: 'Customer Avenue',
        houseNo: '456',
        zipCode: '900001',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        IsSalaried: false,
        IsTermsAndConditionAccepted: true,
      },
    });


    const buyer3 = await prisma.buyer.upsert({
      where: { email: 'efatoyinbo@gmail.com' },
      update: {},
      create: {
        liftpayId: "", // Will be auto-generated by trigger
        userId: buyerUser3.id,// Using the second buyer user
        firstName: 'Fatoyin',
        lastName: 'Emmamuel',
        phoneNumber: '+23480567890102',
        email: 'efatoyinbo@gmail.com',
        address: '456 Customer Avenue, Abuja',
        gender: 'Male',
        idType: 'Driver License',
        idNumber: 'DL987654321',
        nin: 'NIN987654321',
        bvn: 'BVN987654321',
        state: 'Abuja',
        LGA: 'Garki',
        streetName: 'Customer Avenue',
        houseNo: '456',
        zipCode: '900001',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        IsSalaried: false,
        IsTermsAndConditionAccepted: true,
      },
    });

    console.log('✅ Buyers created successfully');

    // Log generated LiftPay IDs for buyers
    console.log('🏷️  Generated Buyer LiftPay IDs:');
    console.log(`   ${buyer1.liftpayId} - ${buyer1.firstName} ${buyer1.lastName}`);
    console.log(`   ${buyer2.liftpayId} - ${buyer2.firstName} ${buyer2.lastName}`);
    console.log(`   ${buyer3.liftpayId} - ${buyer3.firstName} ${buyer3.lastName}`);

    // Create sample merchant directors
    await prisma.merchantDirector.createMany({
      data: [
        {
          merchantId: merchant1.id,
          director: 'John Doe',
          position: 'CEO',
          doc: 'ceo_doc.pdf',
        },
        {
          merchantId: merchant1.id,
          director: 'Sarah Smith',
          position: 'CTO',
          doc: 'cto_doc.pdf',
        },
        {
          merchantId: merchant2.id,
          director: 'Mary Johnson',
          position: 'Managing Director',
          doc: 'md_doc.pdf',
        },
        {
          merchantId: merchant4.id,
          director: 'Emma Brown',
          position: 'Chief Executive Officer',
          doc: 'ceo_doc.pdf',
        },
        {
          merchantId: merchant5.id,
          director: 'Michael Taylor',
          position: 'Medical Director',
          doc: 'md_doc.pdf',
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Merchant directors created successfully');

    // Create sample merchant shareholders
    await prisma.merchantShareHolder.createMany({
      data: [
        {
          merchantId: merchant1.id,
          shareholder: 'John Doe',
          holding: '60%',
        },
        {
          merchantId: merchant1.id,
          shareholder: 'Sarah Smith',
          holding: '40%',
        },
        {
          merchantId: merchant2.id,
          shareholder: 'Mary Johnson',
          holding: '100%',
        },
        {
          merchantId: merchant4.id,
          shareholder: 'Emma Brown',
          holding: '75%',
        },
        {
          merchantId: merchant4.id,
          shareholder: 'Robert Brown',
          holding: '25%',
        },
        {
          merchantId: merchant5.id,
          shareholder: 'Michael Taylor',
          holding: '60%',
        },
        {
          merchantId: merchant5.id,
          shareholder: 'Dr. Sarah Taylor',
          holding: '40%',
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Merchant shareholders created successfully');

    // Create sample merchant authorisers for merchant2 (approved merchant)
    await prisma.merchantAuthoriser.createMany({
      data: [
        {
          merchantId: merchant2.id,
          authoriserName: 'Mary Johnson',
          designation: 'Managing Director',
          authoriserEmail: 'mary.johnson@retailstore.com',
          authoriserPhone: '+2348023456789',
          bvn: 'BVN987654321',
          nin: 'NIN987654321',
        },
        {
          merchantId: merchant2.id,
          authoriserName: 'James Wilson',
          designation: 'Financial Controller',
          authoriserEmail: 'james.wilson@retailstore.com',
          authoriserPhone: '+2348023456790',
          bvn: 'BVN987654322',
          nin: 'NIN987654322',
        },
        {
          merchantId: merchant2.id,
          authoriserName: 'Sarah Davis',
          designation: 'Operations Manager',
          authoriserEmail: 'sarah.davis@retailstore.com',
          authoriserPhone: '+2348023456791',
          bvn: 'BVN987654323',
          nin: 'NIN987654323',
        },
        {
          merchantId: merchant4.id,
          authoriserName: 'Emma Brown',
          designation: 'Chief Executive Officer',
          authoriserEmail: 'emma.brown@swiftlogistics.com',
          authoriserPhone: '+2348045678901',
          bvn: 'BVN111222333',
          nin: 'NIN111222333',
        },
        {
          merchantId: merchant4.id,
          authoriserName: 'Robert Brown',
          designation: 'Chief Financial Officer',
          authoriserEmail: 'robert.brown@swiftlogistics.com',
          authoriserPhone: '+2348045678902',
          bvn: 'BVN111222334',
          nin: 'NIN111222334',
        },
        {
          merchantId: merchant5.id,
          authoriserName: 'Michael Taylor',
          designation: 'Medical Director',
          authoriserEmail: 'michael.taylor@primehealthcare.com',
          authoriserPhone: '+2348056789012',
          bvn: 'BVN444555666',
          nin: 'NIN444555666',
        },
        {
          merchantId: merchant5.id,
          authoriserName: 'Dr. Sarah Taylor',
          designation: 'Chief Medical Officer',
          authoriserEmail: 'sarah.taylor@primehealthcare.com',
          authoriserPhone: '+2348056789013',
          bvn: 'BVN444555667',
          nin: 'NIN444555667',
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Merchant authorisers created successfully');

    // Create sample bank accounts for merchant2 (approved merchant)
    // First, get Access Bank ID

    await prisma.bankAccount.createMany({
      data: [
        {
          bankId: "6920724a-73b7-4471-8d00-f17ff9b9b773",
          merchantId: merchant2.id,
          accountName: 'Akinbobola Olawole Stephen',
          accountNumber: '0041916727',
        },
        {
          bankId: '362c4170-7fed-4c9a-b8aa-e3dff0dac14b',
          merchantId: merchant2.id,
          accountName: 'Akinbobola Olawole Stephen',
          accountNumber: '8032196222',
        },
        {
          bankId: '362c4170-7fed-4c9a-b8aa-e3dff0dac14b',
          merchantId: merchant4.id,
          accountName: 'Damilola',
          accountNumber: '7066066089',
        },

        {
          bankId: '42d6bebc-90fa-4cfd-bd3b-e3560a327a8b',
          merchantId: merchant5.id,
          accountName: 'Akinbobola Olawole Stephen',
          accountNumber: '8032196222',
        },

      ],
      skipDuplicates: true,
    });




    console.log('✅ Bank accounts created successfully');

    // Seed Loan Penalties
    console.log('\n📊 Seeding loan penalties...');
    const penalty1 = await prisma.loanPenalty.upsert({
      where: { id: 'penalty-7-days' },
      update: {},
      create: {
        id: 'penalty-6-days',
        dayAfter: 5,
        percentage: 1.0,
        status: 'Active',
      },
    });

    const penalty2 = await prisma.loanPenalty.upsert({
      where: { id: 'penalty-8-days' },
      update: {},
      create: {
        id: 'penalty-8-days',
        dayAfter: 7,
        percentage: 1.5,
        status: 'Active',
      },
    });

    const penalty3 = await prisma.loanPenalty.upsert({
      where: { id: 'penalty-11-days' },
      update: {},
      create: {
        id: 'penalty-11-days',
        dayAfter: 10,
        percentage: 2.5,
        status: 'Active',
      },
    });
    await prisma.loanPenalty.upsert({
      where: { id: 'penalty-20-days' },
      update: {},
      create: {
        id: 'penalty-20-days',
        dayAfter: 20,
        percentage: 3.0,
        status: 'Active',
      },
    });



    console.log('✅ Loan penalties seeded successfully');

    // Seed Loan Debit Trials
    console.log('\n📊 Seeding loan debit trials...');
    const debitTrial1 = await prisma.loanDebitTrial.upsert({
      where: { id: 'debit-trial-1-day' },
      update: {},
      create: {
        id: 'debit-trial-1-day',
        dayAfter: 1,
        status: 'Active',
      },
    });

    const debitTrial2 = await prisma.loanDebitTrial.upsert({
      where: { id: 'debit-trial-3-days' },
      update: {},
      create: {
        id: 'debit-trial-3-days',
        dayAfter: 3,
        status: 'Active',
      },
    });

    const debitTrial3 = await prisma.loanDebitTrial.upsert({
      where: { id: 'debit-trial-5-days' },
      update: {},
      create: {
        id: 'debit-trial-5-days',
        dayAfter: 5,
        status: 'Active',
      },
    });

    const debitTrial4 = await prisma.loanDebitTrial.upsert({
      where: { id: 'debit-trial-inactive' },
      update: {},
      create: {
        id: 'debit-trial-inactive',
        dayAfter: 10,
        status: 'Inactive',
      },
    });

    console.log('✅ Loan debit trials seeded successfully');

    // Seed Tiers
    console.log('\n🎯 Seeding tiers...');

    const tier1 = await prisma.tier.upsert({
      where: { id: 'tier-basic' },
      update: {},
      create: {
        id: 'tier-basic',
        name: 'Basic Tier',
        from: 0,
        to: 10000,
        status: 'Active',
        discounted: 0,
      },
    });

    const tier2 = await prisma.tier.upsert({
      where: { id: 'tier-silver' },
      update: {},
      create: {
        id: 'tier-silver',
        name: 'Silver Tier',
        from: 10001,
        to: 50000,
        status: 'Active',
        discounted: 2.5,
      },
    });

    const tier3 = await prisma.tier.upsert({
      where: { id: 'tier-gold' },
      update: {},
      create: {
        id: 'tier-gold',
        name: 'Gold Tier',
        from: 50001,
        to: 100000,
        status: 'Active',
        discounted: 5,
      },
    });

    const tier4 = await prisma.tier.upsert({
      where: { id: 'tier-platinum' },
      update: {},
      create: {
        id: 'tier-platinum',
        name: 'Platinum Tier',
        from: 100001,
        to: 500000,
        status: 'Active',
        discounted: 7.5,
      },
    });

    const tier5 = await prisma.tier.upsert({
      where: { id: 'tier-diamond' },
      update: {},
      create: {
        id: 'tier-diamond',
        name: 'Diamond Tier',
        from: 500001,
        to: 999999999,
        status: 'Active',
        discounted: 10,
      },
    });

    console.log('✅ Tiers seeded successfully');

    // Seed Eligibility and Score
    console.log('\n📊 Seeding eligibility and score records...');

    const eligibility1 = await prisma.eligibilityAndScore.upsert({
      where: { id: 'eligibility-buyer1' },
      update: {},
      create: {
        id: 'eligibility-buyer1',
        buyerId: buyer1.id,
        approved: true,
        eligibility: 85.5,
        score: 85.5,
        employmentDurationScore: 20,
        creditHistoryScore: 25,
        averageBalanceScore: 18.5,
        employmentStatusScore: 12,
        overdraftScore: 10,
        message: 'Excellent credit profile. Approved for loan.',
        finalApprovedLoan: 500000,
        maxEligibleLoan: 600000,
        monthlyRepayment: 45000,
        approvedPurchaseAmount: 550000,
        requiredDownPayment: 50000,
      },
    });

    const eligibility2 = await prisma.eligibilityAndScore.upsert({
      where: { id: 'eligibility-buyer2' },
      update: {},
      create: {
        id: 'eligibility-buyer2',
        buyerId: buyer2.id,
        approved: true,
        eligibility: 72.5,
        score: 72.5,
        employmentDurationScore: 15,
        creditHistoryScore: 20,
        averageBalanceScore: 15.5,
        employmentStatusScore: 12,
        overdraftScore: 10,
        message: 'Good credit profile. Approved for moderate loan amount.',
        finalApprovedLoan: 300000,
        maxEligibleLoan: 400000,
        monthlyRepayment: 27500,
        approvedPurchaseAmount: 330000,
        requiredDownPayment: 30000,
      },
    });

    const eligibility3 = await prisma.eligibilityAndScore.upsert({
      where: { id: 'eligibility-buyer3' },
      update: {},
      create: {
        id: 'eligibility-buyer3',
        buyerId: buyer3.id,
        approved: false,
        eligibility: 45.0,
        score: 45.0,
        employmentDurationScore: 8,
        creditHistoryScore: 10,
        averageBalanceScore: 12,
        employmentStatusScore: 8,
        overdraftScore: 7,
        message: 'Below minimum threshold. Application declined.',
        finalApprovedLoan: 0,
        maxEligibleLoan: 100000,
        monthlyRepayment: 0,
        approvedPurchaseAmount: 0,
        requiredDownPayment: 0,
      },
    });



    console.log('✅ Eligibility and score records seeded successfully');

    // Create sample outlets for merchants
    const outlet1 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant1-hq' },
      update: {},
      create: {
        id: 'outlet-merchant1-hq',
        name: 'TechCorp HQ',
        address: '45 Tech Avenue, Victoria Island, Lagos',
        merchantId: merchant1.id,
        status: 'Active',
      },
    });

    const outlet2 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant2-vi' },
      update: {},
      create: {
        id: 'outlet-merchant2-vi',
        name: 'Retail Store - VI Branch',
        address: '23 Akin Adesola Street, Victoria Island, Lagos',
        merchantId: merchant2.id,
        status: 'Active',
      },
    });

    const outlet3 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant2-ikeja' },
      update: {},
      create: {
        id: 'outlet-merchant2-ikeja',
        name: 'Retail Store - Ikeja Branch',
        address: '101 Allen Avenue, Ikeja, Lagos',
        merchantId: merchant2.id,
        status: 'Active',
      },
    });

    const outlet4 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant2-lekki' },
      update: {},
      create: {
        id: 'outlet-merchant2-lekki',
        name: 'Retail Store - Lekki Branch',
        address: '15 Admiralty Way, Lekki Phase 1, Lagos',
        merchantId: merchant2.id,
        status: 'Active',
      },
    });

    // Create outlets for merchant4
    const outlet6 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant4-ikeja' },
      update: {},
      create: {
        id: 'outlet-merchant4-ikeja',
        name: 'Swift Logistics - Ikeja Hub',
        address: '200 Transport Avenue, Ikeja, Lagos',
        merchantId: merchant4.id,
        status: 'Active',
      },
    });

    const outlet7 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant4-victoria' },
      update: {},
      create: {
        id: 'outlet-merchant4-victoria',
        name: 'Swift Logistics - Victoria Island Branch',
        address: '50 Ahmadu Bello Way, Victoria Island, Lagos',
        merchantId: merchant4.id,
        status: 'Active',
      },
    });

    // Create outlets for merchant5
    const outlet8 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant5-main' },
      update: {},
      create: {
        id: 'outlet-merchant5-main',
        name: 'Prime Healthcare - Main Clinic',
        address: '321 Medical Center, Wuse 2, Abuja',
        merchantId: merchant5.id,
        status: 'Active',
      },
    });

    const outlet9 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant5-branch' },
      update: {},
      create: {
        id: 'outlet-merchant5-branch',
        name: 'Prime Healthcare - Garki Branch',
        address: '45 Health Street, Garki, Abuja',
        merchantId: merchant5.id,
        status: 'Active',
      },
    });

    const outlet5 = await prisma.outlet.upsert({
      where: { id: 'outlet-merchant3-main' },
      update: {},
      create: {
        id: 'outlet-merchant3-main',
        name: 'Food Service Main Branch',
        address: '78 Ajose Adeogun Street, Victoria Island, Lagos',
        merchantId: merchant3.id,
        status: 'Active',
      },
    });

    console.log('✅ Outlets seeded successfully');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log('👥 Users:');
    console.log('  - Admin: admin@example.com (password: 12345)');
    console.log('  - Merchant (Pending): merchant@example.com (password: 12345) → TechCorp Solutions Ltd');
    console.log('  - Merchant (Approved): merchant2@example.com (password: 12345) → Retail Store Nigeria Ltd');
    console.log('  - Merchant (Rejected): merchant3@example.com (password: 12345) → Food Service Solutions');
    console.log('  - Buyer: buyer@example.com (password: 12345)');
    console.log('  - Buyer: stephen@example.com (password: 12345)');
    console.log('\n🏦 Banks:');
    console.log(`  - ${banksData.length} Nigerian banks seeded`);
    console.log('\n🏢 Merchants with LiftPay IDs:');
    console.log(`  - ${merchant1.liftpayId} - TechCorp Solutions Ltd (Pending)`);
    console.log(`  - ${merchant2.liftpayId} - Retail Store Nigeria Ltd (FULLY APPROVED)`);
    console.log(`    ✅ All verifications approved`);
    console.log(`    ✅ All documents provided and verified`);
    console.log(`    ✅ Bank accounts linked`);
    console.log(`    ✅ Authorisers configured`);
    console.log(`    ✅ Terms and conditions accepted`);
    console.log(`  - ${merchant3.liftpayId} - Food Service Solutions (Rejected)`);
    console.log('\n👤 Buyers with LiftPay IDs:');
    console.log(`  - ${buyer1.liftpayId} - ${buyer1.firstName} ${buyer1.lastName}`);
    console.log(`  - ${buyer2.liftpayId} - ${buyer2.firstName} ${buyer2.lastName}`);
    console.log('\n🏦 Bank Accounts:');
    console.log(`  - Retail Store Nigeria Ltd: 2 accounts (Access Bank)`);
    console.log(`  - TechCorp Solutions Ltd: 1 account`);
    console.log(`  - Food Service Solutions: 1 account`);
    console.log('\n👥 Merchant Authorisers:');
    console.log(`  - Retail Store Nigeria Ltd: 3 authorisers (MD, FC, OM)`);
    console.log('\n🏪 Outlets:');
    console.log(`  - ${merchant1.businessName}: 1 outlet (TechCorp HQ)`);
    console.log(`  - ${merchant2.businessName}: 3 outlets (VI, Ikeja, Lekki)`);
    console.log(`  - ${merchant3.businessName}: 1 outlet (Main Branch)`);
    console.log('\n💰 Loan Penalties:');
    console.log(`  - 7 days late: 2.5% penalty (Active)`);
    console.log(`  - 14 days late: 5.0% penalty (Active)`);
    console.log(`  - 30 days late: 10.0% penalty (Active)`);
    console.log(`  - 60 days late: 15.0% penalty (Inactive)`);
    console.log('\n🔄 Loan Debit Trials:');
    console.log(`  - 1 day after due: Debit trial (Active)`);
    console.log(`  - 3 days after due: Debit trial (Active)`);
    console.log(`  - 5 days after due: Debit trial (Active)`);
    console.log(`  - 10 days after due: Debit trial (Inactive)`);
    console.log('\n🎯 Tiers:');
    console.log(`  - Basic Tier: ₦0 - ₦10,000 (0% discount) - Active`);
    console.log(`  - Silver Tier: ₦10,001 - ₦50,000 (2.5% discount) - Active`);
    console.log(`  - Gold Tier: ₦50,001 - ₦100,000 (5% discount) - Active`);
    console.log(`  - Platinum Tier: ₦100,001 - ₦500,000 (7.5% discount) - Active`);
    console.log(`  - Diamond Tier: ₦500,001+ (10% discount) - Active`);
    console.log('\n📊 Eligibility & Score:');
    console.log(`  - ${buyer1.firstName} ${buyer1.lastName}: Score 85.5 (Approved) - ₦500,000 loan`);
    console.log(`  - ${buyer2.firstName} ${buyer2.lastName}: Score 72.5 (Approved) - ₦300,000 loan`);
    console.log(`  - ${buyer3.firstName} ${buyer3.lastName}: Score 45.0 (Declined) - Below threshold`);

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