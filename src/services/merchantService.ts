import { authService } from "./authService";
import { emailService } from "./emailService";
import { outletService } from "./outletService";
import prisma from "../utils/prisma";

export interface CreateMerchantInput {
  businessName: string;
  businessEmail: string;
  authorizedPerson: string;
  authorizedDesignation: string;
  authorizedPhoneNo: string;
  authorizedEmail: string;
  typeOfServiceOrProducts: string;
  cacNumber: string;
  dateOfIncorporation: string;
  tin: string;
  registrationAddress: string;
  businessDescription: string;
  businessCategory: string;
  businessType?: string;
  businessPhone: string;
  officeWebsite: string;
  password: string;
}

export interface UpdateMerchantInput {
  businessName?: string;
  businessEmail?: string;
  authorizedPerson?: string;
  authorizedDesignation?: string;
  authorizedPhoneNo?: string;
  authorizedEmail?: string;
  typeOfServiceOrProducts?: string;
  cacNumber?: string;
  dateOfIncorporation?: string;
  tin?: string;
  registrationAddress?: string;
  businessDescription?: string;
  businessCategory?: string;
  businessType?: string;
  businessPhone?: string;
  officeWebsite?: string;

  // Verification flags
  isDirectorsVerified?: string;
  isShareholdersVerified?: string;
  isAuthorisersVerified?: string;
  isBankAccountVerified?: string;

  // Documents and verification statuses
  cacCertificate?: string;
  isCACCertificateVerified?: string;

  memart?: string;
  isMEMERTCertificateVerified?: string;

  cac2Form?: string;
  isCAC2CAC7FormVerified?: string;

  utilityBill?: string;
  utilityBillVerified?: string;

  boardResolution?: string;
  boardResolutionVerified?: string;

  documentStatus?: string;
  applicationStatus?: string;
  verificationStatus?: string;
  merchantCharge?: number;
  // Banking and financial details
  bankAccount?: string;
  accountName?: string;
  walletId?: bigint;
  bankName?: string;
  bankCode?: string;
  directors?: Array<{ director?: string; position?: string; doc?: string }>;
  shareholders?: Array<{ shareholder?: string; shareholder1Holding?: string }>;
  authorisers?: Array<{
    authoriserName?: string;
    designation?: string;
    authoriserEmail?: string;
    authoriserPhone?: string;
    bvn?: string;
    nin?: string;
  }>;
  bankDetails?: Array<{
    bankId?: string;
    bank?: { bankName: string; bankCode: string };
    accountName?: string;
    accountNumber?: string;
  }>;
  rejectionReasons?: Array<{ section: string; reason: string }>;
  agreedToTerms?: boolean;
}

export interface FormatedtInput {
  businessName?: string;
  businessEmail?: string;
  authorizedPerson?: string;
  authorizedDesignation?: string;
  authorizedPhoneNo?: string;
  authorizedEmail?: string;
  typeOfServiceOrProducts?: string;
  cacNumber?: string;
  dateOfIncorporation?: string;
  tin?: string;
  registrationAddress?: string;
  businessDescription?: string;
  businessCategory?: string;
  businessType?: string;
  businessPhone?: string;
  officeWebsite?: string;

  // Verification flags
  isBusinessInfoVerified?: string;
  isAuthorizedPersonVerified?: string;
  isDirectorsVerified?: string;
  isShareholdersVerified?: string;
  isAuthorisersVerified?: string;
  isBankAccountVerified?: string;

  // Documents and verification statuses
  cacCertificate?: string;
  isCACCertificateVerified?: string;

  memart?: string;
  isMEMERTCertificateVerified?: string;

  cac2Form?: string;
  isCAC2CAC7FormVerified?: string;

  utilityBill?: string;
  utilityBillVerified?: string;

  boardResolution?: string;
  boardResolutionVerified?: string;

  documentStatus?: string;
  applicationStatus?: string;
  verificationStatus?: string;
  merchantCharge?: number;

  // Banking and financial details
  bankDetails?: Array<{
    bankId?: string;
    accountName?: string;
    accountNumber?: string;
  }>;

  bankAccount?: string;
  accountName?: string;
  walletId?: bigint;
  bankName?: string;
  bankCode?: string;
  isAgreedToTerms?: boolean;
}

export const merchantSelect = {
  id: true,
  businessName: true,
  businessEmail: true,
  authorizedPerson: true,
  authorizedDesignation: true,
  authorizedPhoneNo: true,
  authorizedEmail: true,
  typeOfServiceOrProducts: true,
  cacNumber: true,
  dateOfIncorporation: true,
  tin: true,
  registrationAddress: true,
  businessDescription: true,
  businessCategory: true,
  businessType: true,
  businessPhone: true,
  officeWebsite: true,
  liftpayId: true,

  // Relations
  shareholders: {
    select: {
      id: true,
      shareholder: true,
      holding: true,
    },
  },
  directors: {
    select: {
      id: true,
      director: true,
      position: true,
      doc: true,
    },
  },

  authorisers: {
    select: {
      id: true,
      authoriserName: true,
      designation: true,
      authoriserEmail: true,
      authoriserPhone: true,
      bvn: true,
      nin: true,
    },
  },
  banks: {
    select: {
      id: true,
      bankId: true,
      accountName: true,
      accountNumber: true,
      bank: {
        select: {
          id: true,
          bankName: true,
          bankCode: true,
        },
      },
    },
  },
  users: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      role: true,
    },
  },

  // Verification flags
  isAuthorizedPersonVerified: true,
  isDirectorsVerified: true,
  isShareholdersVerified: true,
  isBusinessInfoVerified: true,
  isAuthorisersVerified: true,
  isBankAccountVerified: true,
  // Documents and verification statuses
  cacCertificate: true,
  isCACCertificateVerified: true,

  memart: true,
  isMEMERTCertificateVerified: true,

  cac2Form: true,
  isCAC2CAC7FormVerified: true,

  utilityBill: true,
  utilityBillVerified: true,

  boardResolution: true,
  boardResolutionVerified: true,

  documentStatus: true,
  applicationStatus: true,
  verificationStatus: true,

  // Banking and financial details
  bankAccount: true,
  accountName: true,
  walletId: true,
  bankName: true,
  bankCode: true,
  merchantCharge: true,
  // Metadata
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  isAgreedToTerms: true,
  agreedToTermsAt: true,
  agreedToTermsBy: true,
  agreedByUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
    },
  },
  RejectionReason: {
    select: {
      id: true,
      rejectionReason: true,
      createdAt: true,
    },
  },
} as const;
const allowedKeys: (keyof FormatedtInput)[] = [
  "businessName",
  "businessEmail",
  "authorizedPerson",
  "authorizedDesignation",
  "authorizedPhoneNo",
  "authorizedEmail",
  "typeOfServiceOrProducts",
  "cacNumber",
  "dateOfIncorporation",
  "tin",
  "registrationAddress",
  "businessDescription",
  "businessCategory",
  "businessType",
  "businessPhone",
  "officeWebsite",
  "officeWebsite",
  "isBusinessInfoVerified",
  "isAuthorizedPersonVerified",
  "isDirectorsVerified",
  "isShareholdersVerified",
  "cacCertificate",
  "isCACCertificateVerified",
  "memart",
  "isMEMERTCertificateVerified",
  "cac2Form",
  "isCAC2CAC7FormVerified",
  "utilityBill",
  "utilityBillVerified",
  "boardResolution",
  "boardResolutionVerified",
  "documentStatus",
  "applicationStatus",
  "verificationStatus",
  "isAuthorisersVerified",
  "isBankAccountVerified",
  "merchantCharge",
  "isAgreedToTerms",
];
export class MerchantService {
  async createMerchant(input: CreateMerchantInput) {
    const { businessEmail, businessName, authorizedPerson, authorizedEmail } =
      input;
    if (!businessEmail) {
      throw new Error("Business email is required");
    }
    if (!businessName) {
      throw new Error("Business name is required");
    }
    if (!authorizedPerson) {
      throw new Error("Authorized person name is required");
    }

    if (!authorizedEmail) {
      throw new Error("Authorized email is required");
    }
    // Check if merchant with email already exists
    const existingByEmail = await prisma.merchant.findFirst({
      where: { businessEmail: businessEmail },
    });
    if (existingByEmail) {
      throw new Error("Merchant Business email  already exists");
    }
// check if email exist with user
    const existingByUserEmail= await prisma.user.findFirst({ where:{email:authorizedEmail}})
    if (existingByUserEmail) {
      throw new Error("Contact person email already exists with a user");
    }
    // Create merchant first
    const merchant = await prisma.merchant.create({
      data: {
        liftpayId: "", // Will be auto-generated by trigger
        businessName: input.businessName,
        businessEmail: input.businessEmail,
        authorizedPerson: input.authorizedPerson,
        authorizedDesignation: input.authorizedDesignation,
        authorizedPhoneNo: input.authorizedPhoneNo,
        authorizedEmail: input.authorizedEmail,
        typeOfServiceOrProducts: input.businessCategory,
        cacNumber: input.cacNumber,
        dateOfIncorporation: input.dateOfIncorporation,
        tin: input.tin,
        registrationAddress: input.registrationAddress,
        businessDescription: input.businessDescription,
        businessCategory: input.businessCategory,
        businessPhone: input.businessPhone,
        officeWebsite: input.officeWebsite,
        merchantCharge: process.env.MERCHANT_CHARGE || 0,
        businessType: input.businessType
      },
      select: merchantSelect,
    });
    if (!merchant) {
      throw new Error("Merchant not created");
    }
    // split authorizedPerson into firstName and lastName
    const [firstName, lastName] = input.authorizedPerson.split(" ");
    const newUser = await authService.create({
      email: input.authorizedEmail,
      password: input.password,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: input.authorizedPhoneNo,
      merchantId: merchant.id,
      role: "Merchant",
      userType: "Merchant",
      isVerified: false,
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
    });
    if (!newUser) {
      throw new Error("User not created");
    }
    await this.createAuthorisers(merchant.id, [{
      authoriserName: firstName,
      designation: input.authorizedDesignation || "Authorized Person",
      authoriserEmail: input.authorizedEmail,
      authoriserPhone: input.authorizedPhoneNo,
      nin: "NIN not provided",
      bvn: "BVN not provided",
    }]);
    // Create merchant

    return merchant;
  }

  async getMerchantById(id: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: merchantSelect,
    });
    if (!merchant) {
      throw new Error("Merchant not found");
    }
    return merchant;
  }

  async listMerchants(filters?: {
    documentStatus?: string;
    applicationStatus?: string;
  }) {
    const whereClause: any = { isDeleted: false };

    // Add documentStatus filter if provided
    if (filters?.documentStatus) {
      whereClause.documentStatus = filters.documentStatus;
    }

    // Add applicationStatus filter if provided
    if (filters?.applicationStatus) {
      whereClause.applicationStatus = filters.applicationStatus;
    }

    const merchants = await prisma.merchant.findMany({
      select: merchantSelect,
      where: whereClause,
      orderBy: { id: "desc" },
    });
    return merchants;
  }

  async updateMerchant(id: string, data: UpdateMerchantInput, req: any) {
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Merchant not found");
    }

    // Check for email uniqueness if updating email
    if (data.businessEmail) {
      const byEmail = await prisma.merchant.findFirst({
        where: {
          AND: [{ id: { not: id } }, { businessEmail: data.businessEmail }],
        },
      });
      if (byEmail) {
        throw new Error("Another merchant exists with provided business email");
      }
    }
    // check if any properties exist in data and push it to updateData
    // Filter data to only include properties that match FormatedtInput interface

    const updateData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        allowedKeys.includes(key as keyof FormatedtInput)
      ) {
        updateData[key] = value;
      }
    });
    if (Object.keys(updateData).length === 0) {
      console.log("No valid fields provided for update");
      return this.getMerchantById(id);
    }
    const prevMerchant = await prisma.merchant.findUnique({ where: { id } });
    const {
      isAgreedToTerms,
      documentStatus,
      applicationStatus,
      verificationStatus,
      agreedToTermsBy,
    } = prevMerchant || {};
    // if(isAgreedToTerms) {
    //   throw new Error("Merchant has already agreed to terms");
    // }
    if (!isAgreedToTerms && !agreedToTermsBy && updateData.isAgreedToTerms) {
      updateData.isAgreedToTerms = true;
      updateData.agreedToTermsAt = new Date();
      updateData.agreedToTermsBy = req.user.id;
    }

    if (updateData.isAgreedToTerms) {
      updateData.applicationStatus = "Approved";
      updateData.verificationStatus = "Approved";
      updateData.documentStatus = "Approved";
    }
    const merchant = await prisma.merchant.update({
      where: { id },
      data: updateData,
      select: merchantSelect,
    });

    if (data?.directors) {
      await this.createDirectors(id, data.directors);
    }
    if (data?.shareholders) {
      await this.createShareholders(id, data.shareholders);
    }
    if (data?.authorisers) {
      await this.createAuthorisers(id, data.authorisers);
    }
    if (data?.bankDetails) {
      await this.createBankAccounts(id, data.bankDetails);
    }
    if (data?.rejectionReasons) {
      await this.createRejectionReasons(id, data.rejectionReasons); // TODO: Implement this
    }
    if (
      documentStatus !== "Approved" &&
      applicationStatus !== "Approved" &&
      data.documentStatus == "Approved" &&
      data.applicationStatus == "Approved"
    ) {
      const merchantAuthoriser = await this.getMerchantById(id);

      const authorisers = merchantAuthoriser?.authorisers;
      // create each merchant authoriser as user and send email to merchant authoriser
      for (const authoriser of authorisers) {
        const existingUser = await prisma.user.findUnique({
          where: { email: authoriser.authoriserEmail },
        });
        if (existingUser) {
          continue;
        }
        const [firstName, lastName] = authoriser.authoriserName.split(" ");
        await authService.create({
          email: authoriser.authoriserEmail,
          password: authoriser.authoriserEmail,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: authoriser.authoriserPhone,
          merchantId: id,
          role: "Merchant",
          userType: "Merchant",
          isVerified: false,
          isPhoneVerified: false,
          isEmailVerified: false,
          isActive: true,
        });
      }
      // send email to merchant authoriser
      for (const authoriser of authorisers) {
        emailService.sendTemplateEmail({
          to: authoriser.authoriserEmail,
          templateName: "representativeValidation",
          subject:
            "LiftPay Merchant Registration – Authorized Representative Validation Required",
          data: {
            representative_name: authoriser.authoriserName,
            merchant_business_name: merchantAuthoriser?.businessName,
            validation_link: `${process.env.FRONTEND_URL}/merchant/dashboard/documentation`,
          },
        });
      }
    }
    if (!isAgreedToTerms && merchant.isAgreedToTerms) {
      // create new
      await outletService.createOutlet({
        merchantId: merchant.id,
        name: merchant.businessName,
        address: merchant.registrationAddress || "No address provided",
        // managerId: merchant.users[0].id,
      });
      // send email to merchant
      const merchantUser = merchant.users;
      for (const user of merchantUser) {
        emailService.sendTemplateEmail({
          to: user.email,
          templateName: "merchantVerificationComplete",
          subject: "Welcome to LiftPay Merchant Network",
          data: {
            merchant_name: merchant.businessName,
            merchant_dashboard_link: `${process.env.MERCHANT_DASHBOARD_URL}/merchant/dashboard`,
          },
        });
      }
    }

    return merchant;
  }

  async deleteMerchant(id: string) {
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Merchant not found");
    }
    await prisma.merchant.delete({ where: { id } });
    return { message: "Merchant deleted successfully" };
  }

  async createDirectors(
    merchantId: string,
    directors: Array<{ director?: string; position?: string; doc?: string }>
  ) {
    if (!directors || directors.length === 0) {
      return [];
    }
    // delete all directors and shareholders
    await prisma.merchantDirector.deleteMany({ where: { merchantId } });

    const directorsData = directors
      .filter((director) => director.director || director.position) // Filter out entries where both director and position are null/empty
      .map((director) => ({
        merchantId,
        director: director.director || null,
        position: director.position || null,
        doc: director.doc || null,
      }));

    await prisma.merchantDirector.createMany({
      data: directorsData,
    });

    // Return the created directors with their IDs
    const directorsWithIds = await prisma.merchantDirector.findMany({
      where: { merchantId },
      take: directors.length,
    });

    return directorsWithIds;
  }

  async createShareholders(
    merchantId: string,
    shareholders: Array<{ shareholder?: string; holding?: string }>
  ) {
    if (!shareholders || shareholders.length === 0) {
      return [];
    }
    // delete all directors and shareholders
    await prisma.merchantShareHolder.deleteMany({ where: { merchantId } });
    const shareholdersData = shareholders
      .filter((shareholder) => shareholder.shareholder || shareholder.holding) // Filter out entries where both shareholder and holding are null/empty
      .map((shareholder) => ({
        merchantId,
        shareholder: shareholder.shareholder || null,
        holding: shareholder.holding || null,
      }));

    await prisma.merchantShareHolder.createMany({
      data: shareholdersData,
    });

    // Return the created shareholders with their IDs
    const shareholdersWithIds = await prisma.merchantShareHolder.findMany({
      where: { merchantId },
      take: shareholders.length,
    });

    return shareholdersWithIds;
  }

  async createAuthorisers(
    merchantId: string,
    authorisers: Array<{
      authoriserName?: string;
      designation?: string;
      authoriserEmail?: string;
      authoriserPhone?: string;
      bvn?: string;
      nin?: string;
    }>
  ) {
    if (!authorisers || authorisers.length === 0) {
      return [];
    }
    // delete all authorisers
    await prisma.merchantAuthoriser.deleteMany({ where: { merchantId } });

    const authorisersData = authorisers
      .filter(
        (authoriser) =>
          authoriser.authoriserName &&
          authoriser.designation &&
          authoriser.authoriserEmail &&
          authoriser.authoriserPhone &&
          authoriser.nin
      ) // Filter out entries where required fields are missing
      .map((authoriser) => ({
        merchantId,
        authoriserName: authoriser.authoriserName!,
        designation: authoriser.designation!,
        authoriserEmail: authoriser.authoriserEmail!,
        authoriserPhone: authoriser.authoriserPhone!,
        bvn: authoriser.bvn || null,
        nin: authoriser.nin!,
      }));

    await prisma.merchantAuthoriser.createMany({
      data: authorisersData,
    });

    // Return the created authorisers with their IDs
    const authorisersWithIds = await prisma.merchantAuthoriser.findMany({
      where: { merchantId },
      take: authorisers.length,
    });

    return authorisersWithIds;
  }

  async createBankAccounts(
    merchantId: string,
    bankAccounts: Array<{
      bankId?: string;
      accountName?: string;
      accountNumber?: string;
    }>
  ) {
    if (!bankAccounts || bankAccounts.length === 0) {
      return [];
    }
    // delete all bank accounts
    await prisma.bankAccount.deleteMany({ where: { merchantId } });

    const bankAccountsData = bankAccounts
      .filter(
        (bankAccount) =>
          bankAccount.bankId &&
          bankAccount.accountName &&
          bankAccount.accountNumber
      ) // Filter out entries where required fields are missing
      .map((bankAccount) => ({
        merchantId,
        bankId: bankAccount.bankId!,
        accountName: bankAccount.accountName!,
        accountNumber: bankAccount.accountNumber!,
      }));

    await prisma.bankAccount.createMany({
      data: bankAccountsData,
    });

    // Return the created bank accounts with their IDs
    const bankAccountsWithIds = await prisma.bankAccount.findMany({
      where: { merchantId },
      take: bankAccounts.length,
    });

    return bankAccountsWithIds;
  }

  async createRejectionReasons(
    merchantId: string,
    rejectionReasons: Array<{ section: string; reason: string }>
  ) {
    if (!rejectionReasons || rejectionReasons.length === 0) {
      return [];
    }
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) {
      throw new Error("Merchant not found");
    }
    const merchantEmail = merchant.authorizedEmail;
    const merchantName = merchant.businessName;
    const rejectionReasonsData = rejectionReasons
      .map(
        (rejectionReason) =>
          `${rejectionReason.section}: ${rejectionReason.reason}`
      )
      .join("\n");
    // insert into rejection reasons
    await prisma.rejectionReason.create({
      data: {
        merchantId,
        rejectionReason: rejectionReasonsData,
      },
    });

    //send email to merchant
    // emailService.sendEmail({
    //   to: "stolaksoftech@yahaoo.com",
    //   subject: "Rejection Reasons",
    //   text: rejectionReasonsData,
    // });

    const dashboardUrl = `${process.env.FRONTEND_URL}/merchant/dashboard`;

    emailService.sendTemplateEmail({
      to: merchantEmail!,
      templateName: "documentRejection",
      subject:
        "Action Required – Some of Your LiftPay Merchant Documents Need Attention",
      data: {
        merchant_name: merchantName,
        rejectionReasons: rejectionReasons,
        merchant_dashboard_link: dashboardUrl,
      },
    });
  }

  async getMerchantWithDetails(id: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        shareholders: true,
        directors: true,
        authorisers: true,
        banks: {
          include: {
            bank: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            userType: true,
            isActive: true,
          },
        },
      },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    return merchant;
  }

  /**
   * Get total number of active merchants
   * Active merchants are those who are approved and not deleted
   */
  async getTotalActiveMerchants(): Promise<number> {
    try {
      const count = await prisma.merchant.count({
        where: {
          isDeleted: false,
          applicationStatus: "Approved",
          verificationStatus: "Approved",
          documentStatus: "Approved",
        },
      });
      return count;
    } catch (error) {
      console.error("Error getting total active merchants:", error);
      throw new Error("Failed to get total active merchants");
    }
  }
}

export const merchantService = new MerchantService();
