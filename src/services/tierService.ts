import { TierStatus } from "@prisma/client";
import prisma from "../utils/prisma";

// ==================== INTERFACES ====================

export interface CreateTierInput {
  name: string;
  from: number;
  to: number;
  status?: TierStatus;
  discounted: number;
}

export interface UpdateTierInput {
  name?: string;
  from?: number;
  to?: number;
  status?: TierStatus;
  discounted?: number;
}

export class TierService {
  // ==================== TIER CRUD ====================

  /**
   * Create a new tier
   */
  async createTier(input: CreateTierInput) {
    try {
      // Validate range
      if (input.from >= input.to) {
        throw new Error("'from' value must be less than 'to' value");
      }

      // Check for overlapping tiers
      const overlappingTier = await prisma.tier.findFirst({
        where: {
          OR: [
            {
              AND: [
                { from: { lte: input.from } },
                { to: { gte: input.from } },
              ],
            },
            {
              AND: [
                { from: { lte: input.to } },
                { to: { gte: input.to } },
              ],
            },
            {
              AND: [
                { from: { gte: input.from } },
                { to: { lte: input.to } },
              ],
            },
          ],
        },
      });

      if (overlappingTier) {
        throw new Error(
          `Tier range overlaps with existing tier: ${overlappingTier.name}`
        );
      }

      const tier = await prisma.tier.create({
        data: {
          name: input.name,
          from: input.from,
          to: input.to,
          status: input.status || TierStatus.Active,
          discounted: input.discounted,
        },
      });

      return { success: true, data: tier };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tier by ID
   */
  async getTierById(tierId: string) {
    try {
      const tier = await prisma.tier.findUnique({
        where: { id: tierId },
      });

      if (!tier) {
        throw new Error("Tier not found");
      }

      return { success: true, data: tier };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all tiers with optional filters
   */
  async getAllTiers(filters?: {
    status?: TierStatus;
  }) {
    try {
      const where: any = {};
      if (filters?.status) where.status = filters.status;

      const tiers = await prisma.tier.findMany({
        where,
        orderBy: [{ from: "asc" }],
      });

      return {
        success: true,
        data: tiers,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update tier
   */
  async updateTier(tierId: string, input: UpdateTierInput) {
    try {
      // Check if tier exists
      const existingTier = await prisma.tier.findUnique({
        where: { id: tierId },
      });

      if (!existingTier) {
        throw new Error("Tier not found");
      }

      // Validate range if from or to is being updated
      const fromValue = input.from ?? Number(existingTier.from);
      const toValue = input.to ?? Number(existingTier.to);

      if (fromValue >= toValue) {
        throw new Error("'from' value must be less than 'to' value");
      }

      // Check for overlapping tiers (excluding current tier)
      if (input.from !== undefined || input.to !== undefined) {
        const overlappingTier = await prisma.tier.findFirst({
          where: {
            id: { not: tierId },
            OR: [
              {
                AND: [
                  { from: { lte: fromValue } },
                  { to: { gte: fromValue } },
                ],
              },
              {
                AND: [
                  { from: { lte: toValue } },
                  { to: { gte: toValue } },
                ],
              },
              {
                AND: [
                  { from: { gte: fromValue } },
                  { to: { lte: toValue } },
                ],
              },
            ],
          },
        });

        if (overlappingTier) {
          throw new Error(
            `Tier range overlaps with existing tier: ${overlappingTier.name}`
          );
        }
      }

      const tier = await prisma.tier.update({
        where: { id: tierId },
        data: input,
      });

      return { success: true, data: tier };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete tier
   */
  async deleteTier(tierId: string) {
    try {
      const tier = await prisma.tier.delete({
        where: { id: tierId },
      });

      return {
        success: true,
        data: tier,
        message: "Tier deleted successfully",
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tier by amount
   * Find which tier a specific amount falls into
   */
  async getTierByAmount(amount: number) {
    try {
      const tier = await prisma.tier.findFirst({
        where: {
          from: { lte: amount },
          to: { gte: amount },
          status: TierStatus.Active,
        },
        orderBy: { from: "asc" },
      });

      if (!tier) {
        return {
          success: false,
          error: `No active tier found for amount: ${amount}`,
        };
      }

      return { success: true, data: tier };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate discounted amount
   */
  async calculateDiscount(amount: number) {
    try {
      const tierResult = await this.getTierByAmount(amount);

      if (!tierResult.success || !tierResult.data) {
        return {
          success: false,
          error: "No applicable tier found",
        };
      }

      const tier = tierResult.data;
      const discountAmount = (amount * Number(tier.discounted)) / 100;
      const finalAmount = amount + discountAmount;

      return {
        success: true,
        data: {
          tier: {
            id: tier.id,
            name: tier.name,
            discountPercentage: Number(tier.discounted),
          },
          originalAmount: amount,
          discountAmount,
          finalAmount,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate or deactivate tier
   */
  async toggleTierStatus(tierId: string) {
    try {
      const tier = await prisma.tier.findUnique({
        where: { id: tierId },
      });

      if (!tier) {
        throw new Error("Tier not found");
      }

      const newStatus =
        tier.status === TierStatus.Active
          ? TierStatus.Inactive
          : TierStatus.Active;

      const updatedTier = await prisma.tier.update({
        where: { id: tierId },
        data: { status: newStatus },
      });

      return {
        success: true,
        data: updatedTier,
        message: `Tier ${newStatus === TierStatus.Active ? "activated" : "deactivated"} successfully`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const tierService = new TierService();

