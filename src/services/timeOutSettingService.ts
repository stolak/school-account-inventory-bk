import prisma from "../utils/prisma";

export interface UpsertTimeOutSettingInput {
  accountlinkingTimeout?: number;
  directPayTimeout?: number;
  scoringTimeout?: number;
  merchantCreationTimeout?: number;
  planselectionTimeout?: number;
  upfrontPaymentTimeout?: number;
  maxLinkAttempts?: number;
  periodBetweenAttempts?: number;
}

export class TimeOutSettingService {
  private readonly DEFAULT_ID = "default";

  async getTimeOutSetting() {
    return prisma.timeOutSetting.upsert({
      where: { id: this.DEFAULT_ID },
      create: {
        id: this.DEFAULT_ID,
        accountlinkingTimeout: 5,
        directPayTimeout: 5,
        scoringTimeout: 5,
        merchantCreationTimeout: 5,
        planselectionTimeout: 5,
        upfrontPaymentTimeout: 5,
        maxLinkAttempts: 2,
        periodBetweenAttempts: 6,
      },
      update: {},
    });
  }

  async upsertTimeOutSetting(input: UpsertTimeOutSettingInput) {
    return prisma.timeOutSetting.upsert({
      where: { id: this.DEFAULT_ID },
      create: {
        id: this.DEFAULT_ID,
        accountlinkingTimeout: input.accountlinkingTimeout ?? 5,
        directPayTimeout: input.directPayTimeout ?? 5,
        scoringTimeout: input.scoringTimeout ?? 5,
        merchantCreationTimeout: input.merchantCreationTimeout ?? 5,
        planselectionTimeout: input.planselectionTimeout ?? 5,
        upfrontPaymentTimeout: input.upfrontPaymentTimeout ?? 5,
        maxLinkAttempts: input.maxLinkAttempts ?? 2,
        periodBetweenAttempts: input.periodBetweenAttempts ?? 6,
      },
      update: {
        ...(input.accountlinkingTimeout !== undefined && {
          accountlinkingTimeout: input.accountlinkingTimeout,
        }),
        ...(input.directPayTimeout !== undefined && {
          directPayTimeout: input.directPayTimeout,
        }),
        ...(input.scoringTimeout !== undefined && {
          scoringTimeout: input.scoringTimeout,
        }),
        ...(input.merchantCreationTimeout !== undefined && {
          merchantCreationTimeout: input.merchantCreationTimeout,
        }),
        ...(input.planselectionTimeout !== undefined && {
          planselectionTimeout: input.planselectionTimeout,
        }),
        ...(input.upfrontPaymentTimeout !== undefined && {
          upfrontPaymentTimeout: input.upfrontPaymentTimeout,
        }),
        ...(input.maxLinkAttempts !== undefined && {
          maxLinkAttempts: input.maxLinkAttempts,
        }),
        ...(input.periodBetweenAttempts !== undefined && {
          periodBetweenAttempts: input.periodBetweenAttempts,
        }),
      },
    });
  }
}

export const timeOutSettingService = new TimeOutSettingService();

