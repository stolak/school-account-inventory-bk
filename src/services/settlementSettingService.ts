import prisma from "../utils/prisma";

export interface UpsertSettlementSettingInput {
  merchantFeeRate?: number;
  autoSettlementCharge?: number;
  manualSettlementCharge?: number;
  Tx?: number;
  timeOfAutoSettlement?: string | null;
} 

export class SettlementSettingService {
  private readonly DEFAULT_ID = "default";

  private toResponse(setting: any) {
    return {
      ...setting,
      merchantFeeRate: Number(setting.merchantFeeRate),
      autoSettlementCharge: Number(setting.autoSettlementCharge),
      manualSettlementCharge: Number(setting.manualSettlementCharge),
    };
  }

  async getSettlementSetting() {
    const setting = await prisma.settlementSetting.upsert({
      where: { id: this.DEFAULT_ID },
      create: {
        id: this.DEFAULT_ID,
        merchantFeeRate: 3.5,
        autoSettlementCharge: 100,
        manualSettlementCharge: 100,
        Tx: 0,
        timeOfAutoSettlement: "19:00",
      },
      update: {},
    });

    return this.toResponse(setting);
  }

  async upsertSettlementSetting(input: UpsertSettlementSettingInput) {
    const setting = await prisma.settlementSetting.upsert({
      where: { id: this.DEFAULT_ID },
      create: {
        id: this.DEFAULT_ID,
        merchantFeeRate: input.merchantFeeRate ?? 0,
        autoSettlementCharge: input.autoSettlementCharge ?? 0,
        manualSettlementCharge: input.manualSettlementCharge ?? 0,
        Tx: input.Tx ?? 0,
        timeOfAutoSettlement: input.timeOfAutoSettlement ?? "",
      },
      update: { 
        ...(input.merchantFeeRate !== undefined && {
          merchantFeeRate: input.merchantFeeRate,
        }),
        ...(input.autoSettlementCharge !== undefined && {
          autoSettlementCharge: input.autoSettlementCharge,
        }),
        ...(input.manualSettlementCharge !== undefined && {
          manualSettlementCharge: input.manualSettlementCharge,
        }),
        ...(input.Tx !== undefined && { Tx: input.Tx }),
        ...(input.timeOfAutoSettlement !== undefined && {
          timeOfAutoSettlement: input.timeOfAutoSettlement
            ? input.timeOfAutoSettlement
            : "",
        }),
      },
    });

    return this.toResponse(setting);
  }
}

export const settlementSettingService = new SettlementSettingService();

