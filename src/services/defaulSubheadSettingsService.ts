import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";

export type DefaulSubheadSettingsRow = Prisma.DefaulSubheadSettingsGetPayload<
  Record<string, never>
>;

export class DefaulSubheadSettingsService {
  private prisma = prisma;

  async list(): Promise<DefaulSubheadSettingsRow[]> {
    return this.prisma.defaulSubheadSettings.findMany({
      orderBy: { settingsId: "asc" },
      include: {
        subhead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getBySettingsId(settingsId: string): Promise<DefaulSubheadSettingsRow | null> {
    const trimmedId = settingsId.trim();
    if (!trimmedId) {
      throw new Error("settingsId is required");
    }
    return this.prisma.defaulSubheadSettings.findUnique({
      where: { settingsId: trimmedId },
      include: {
        subhead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Partial update by business key `settingsId`. At least one of `settings` or `subheadId` must be provided.
   */
  async update(
    settingsId: string,
    input: { settings?: string; subheadId?: number | null }
  ): Promise<DefaulSubheadSettingsRow> {
    const trimmedId = settingsId.trim();
    if (!trimmedId) {
      throw new Error("settingsId is required");
    }

    const hasSettings = input.settings !== undefined;
    const hasSubheadId = input.subheadId !== undefined;
    if (!hasSettings && !hasSubheadId) {
      throw new Error("At least one field must be provided to update");
    }

    if (hasSettings) {
      if (typeof input.settings !== "string") {
        throw new Error("settings must be a string when provided");
      }
      if (!input.settings.trim()) {
        throw new Error("settings cannot be empty when provided");
      }
    }

    if (hasSubheadId && input.subheadId !== null && input.subheadId !== undefined) {
      const sid = input.subheadId;
      if (!Number.isInteger(sid) || sid < 1) {
        throw new Error("subheadId must be a positive integer when provided");
      }
      const sub = await this.prisma.accountSubhead.findUnique({
        where: { id: sid },
        select: { id: true },
      });
      if (!sub) {
        throw new Error("Invalid subheadId: account subhead not found");
      }
    }

    const existing = await this.prisma.defaulSubheadSettings.findUnique({
      where: { settingsId: trimmedId },
    });
    if (!existing) {
      throw new Error("Default subhead settings not found");
    }

    const data: Prisma.DefaulSubheadSettingsUpdateInput = {};
    if (hasSettings) {
      data.settings = input.settings!.trim();
    }
    if (hasSubheadId) {
      if (input.subheadId === null) {
        data.subhead = { disconnect: true };
      } else {
        data.subhead = { connect: { id: input.subheadId } };
      }
    }

    return this.prisma.defaulSubheadSettings.update({
      where: { settingsId: trimmedId },
      data,
    });
  }
}

export const defaulSubheadSettingsService = new DefaulSubheadSettingsService();
