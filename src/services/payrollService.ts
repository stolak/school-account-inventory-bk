import { EmploymentType, Prisma, SalaryComponentType, Status } from "@prisma/client";
import { activePayrollPeriodService } from "./activePayrollPeriodService";
import prisma from "../utils/prisma";

// const staffSalaryChartSelect = {
//   id: true,
//   gradeLevelId: true,
//   step: true,
//   employmentType: true,
//   componentId: true,
//   amount: true,
//   component: {
//     select: {
//       id: true,
//       name: true,
//       shortName: true,
//       type: true,
//       rank: true,
//       isTaxable: true,
//       isPensionable: true,
//       isFunction: true,
//     },
//   },
// } satisfies Prisma.SalaryChartSelect;
const staffSalaryChartSelect = {
  gradeLevelId: true,
  step: true,
  employmentType: true,
  componentId: true,
  amount: true,
} satisfies Prisma.SalaryChartSelect;
type StaffSalaryChartRow = Prisma.SalaryChartGetPayload<{ select: typeof staffSalaryChartSelect }>;

const salaryComponentSelect = {
  id: true,
  name: true,
  shortName: true,
  type: true,
  rank: true,
  isTaxable: true,
  isPensionable: true,
  isStatutory: true,
  isFunction: true,
} satisfies Prisma.SalaryComponentSelect;

type ActiveSalaryComponent = Prisma.SalaryComponentGetPayload<{
  select: typeof salaryComponentSelect;
}>;

function salaryChartSlotKey(
  gradeLevelId: string,
  step: number,
  employmentType: EmploymentType
): string {
  return `${gradeLevelId}|${step}|${employmentType}`;
}

function groupSalaryChartsBySlot(rows: StaffSalaryChartRow[]): Map<string, StaffSalaryChartRow[]> {
  const map = new Map<string, StaffSalaryChartRow[]>();
  for (const row of rows) {
    const key = salaryChartSlotKey(row.gradeLevelId, row.step, row.employmentType);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function mapSalaryChartsForStaff(
  staff: {
    gradeLevelId: string | null;
    step: number;
    employmentType: EmploymentType;
  },
  chartsBySlot: Map<string, StaffSalaryChartRow[]>,
  activeSalaryComponents: ActiveSalaryComponent[]
): Array<StaffSalaryChartRow & { component: ActiveSalaryComponent }> {
  if (!staff.gradeLevelId) return [];
  const salaryCharts =
    chartsBySlot.get(salaryChartSlotKey(staff.gradeLevelId, staff.step, staff.employmentType)) ??
    [];

  const activeComponentById = new Map(
    activeSalaryComponents.map((component) => [component.id, component])
  );

  return salaryCharts
    .filter((chart) => activeComponentById.has(chart.componentId))
    .map((chart) => ({
      ...chart,
      component: activeComponentById.get(chart.componentId)!,
    }));
}

const payrollReportComponentSelect = {
  id: true,
  name: true,
  shortName: true,
  type: true,
  rank: true,
  status: true,
  isTaxable: true,
  isPensionable: true,
  isStatutory: true,
  isFunction: true,
  accountId: true,
} satisfies Prisma.SalaryComponentSelect;

export type PayrollReportPeriodComponent = Prisma.SalaryComponentGetPayload<{
  select: typeof payrollReportComponentSelect;
}>;

export interface PayrollReportPayrollComponentRow {
  id: string;
  payrollProcessId: string;
  componentId: string;
  amount: string;
}

export interface PayrollReportStaffPayrollRow {
  id: string;
  staffId: string;
  year: number;
  month: number;
  gradeLevelId: string;
  step: number;
  employmentType: EmploymentType;
  grossEarnings: string;
  netAllowances: string;
  netEarnings: string;
  netDeductions: string;
  netPay: string;
  isApproved: boolean;
  isPosted: boolean;
  approvedAt: Date | null;
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  staff: { id: string; StaffNumber: string; name: string };
  gradeLevel: { id: string; name: string };
  payrollComponents: PayrollReportPayrollComponentRow[];
}

export interface PayrollReportResult {
  periodComponent: PayrollReportPeriodComponent[];
  staffPayroll: PayrollReportStaffPayrollRow[];
}

function sortSalaryComponentsForReport(
  components: PayrollReportPeriodComponent[]
): PayrollReportPeriodComponent[] {
  const typeOrder = (type: SalaryComponentType) => (type === SalaryComponentType.EARNING ? 0 : 1);
  return [...components].sort((a, b) => {
    const byType = typeOrder(a.type) - typeOrder(b.type);
    if (byType !== 0) return byType;
    return a.rank - b.rank || a.name.localeCompare(b.name);
  });
}

function sortPayrollComponentsForReport<
  T extends { component: { type: SalaryComponentType; rank: number; name: string } },
>(rows: T[]): T[] {
  const typeOrder = (type: SalaryComponentType) => (type === SalaryComponentType.EARNING ? 0 : 1);
  return [...rows].sort((a, b) => {
    const byType = typeOrder(a.component.type) - typeOrder(b.component.type);
    if (byType !== 0) return byType;
    return a.component.rank - b.component.rank || a.component.name.localeCompare(b.component.name);
  });
}

function mapPayrollReportComponentRow(row: {
  id: string;
  payrollProcessId: string;
  componentId: string;
  amount: { toString(): string };
}): PayrollReportPayrollComponentRow {
  return {
    id: row.id,
    payrollProcessId: row.payrollProcessId,
    componentId: row.componentId,
    amount: row.amount.toString(),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateReportYearMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("year must be an integer between 1900 and 2100");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("month must be an integer between 1 and 12");
  }
}

function normalizePayrollProcessIds(ids: unknown): string[] | undefined {
  if (ids === undefined) return undefined;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("ids must be a non-empty array when provided");
  }
  const unique = [...new Set(ids.map((id) => (typeof id === "string" ? id.trim() : "")))];
  if (unique.some((id) => !UUID_RE.test(id))) {
    throw new Error("ids must contain valid UUID payroll process ids");
  }
  return unique;
}

function payrollProcessPeriodWhere(
  year: number,
  month: number,
  ids?: string[]
): Prisma.PayrollProcessWhereInput {
  return {
    year,
    month,
    ...(ids ? { id: { in: ids } } : {}),
  };
}

async function assertPayrollProcessesMatchPeriod(
  year: number,
  month: number,
  ids: string[]
): Promise<void> {
  const count = await prisma.payrollProcess.count({
    where: payrollProcessPeriodWhere(year, month, ids),
  });
  if (count !== ids.length) {
    throw new Error("One or more payroll process ids are invalid for the given year and month");
  }
}

export interface PayrollPeriodActionInput {
  year: number;
  month: number;
  actedBy: string;
  ids?: string[];
}

export interface PayrollApprovalInput extends PayrollPeriodActionInput {
  approved: boolean;
}

export class PayrollService {
  async getPayrollReport(params: {
    year: number;
    month: number;
    staffId?: string;
  }): Promise<PayrollReportResult> {
    validateReportYearMonth(params.year, params.month);

    if (params.staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: params.staffId },
        select: { id: true },
      });
      if (!staff) throw new Error("Invalid staffId");
    }

    const periodPayrollComponents = await prisma.payrollComponent.findMany({
      where: {
        year: params.year,
        month: params.month,
      },
      select: { componentId: true },
      distinct: ["componentId"],
    });

    const uniqueComponentIds = periodPayrollComponents.map((r) => r.componentId);

    const periodComponentRows =
      uniqueComponentIds.length > 0
        ? await prisma.salaryComponent.findMany({
            where: { id: { in: uniqueComponentIds } },
            select: payrollReportComponentSelect,
          })
        : [];

    const periodComponent = sortSalaryComponentsForReport(periodComponentRows);

    const payrollProcesses = await prisma.payrollProcess.findMany({
      where: {
        year: params.year,
        month: params.month,
        ...(params.staffId ? { staffId: params.staffId } : {}),
      },
      include: {
        staff: { select: { id: true, StaffNumber: true, name: true } },
        gradeLevel: { select: { id: true, name: true } },
        payrollComponents: {
          where: { year: params.year, month: params.month },
          include: {
            component: { select: payrollReportComponentSelect },
          },
          orderBy: [{ component: { type: "asc" } }, { component: { rank: "asc" } }],
        },
      },
      orderBy: [{ staff: { name: "asc" } }],
    });

    const staffPayroll: PayrollReportStaffPayrollRow[] = payrollProcesses.map((process) => ({
      id: process.id,
      staffId: process.staffId,
      year: process.year,
      month: process.month,
      gradeLevelId: process.gradeLevelId,
      step: process.step,
      employmentType: process.employmentType,
      grossEarnings: process.grossEarnings.toString(),
      netAllowances: process.netAllowances.toString(),
      netEarnings: process.netEarnings.toString(),
      netDeductions: process.netDeductions.toString(),
      netPay: process.netPay.toString(),
      isApproved: process.isApproved,
      isPosted: process.isPosted,
      approvedAt: process.approvedAt,
      postedAt: process.postedAt,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
      staff: process.staff,
      gradeLevel: process.gradeLevel,
      payrollComponents: sortPayrollComponentsForReport(process.payrollComponents).map(
        mapPayrollReportComponentRow
      ),
    }));

    return { periodComponent, staffPayroll };
  }

  async setApproval(input: PayrollApprovalInput): Promise<{ count: number; approved: boolean }> {
    validateReportYearMonth(input.year, input.month);
    const actedBy = input.actedBy?.trim();
    if (!actedBy) throw new Error("actedBy is required");

    const ids = normalizePayrollProcessIds(input.ids);
    if (ids) await assertPayrollProcessesMatchPeriod(input.year, input.month, ids);

    const where = payrollProcessPeriodWhere(input.year, input.month, ids);

    if (!input.approved) {
      const postedCount = await prisma.payrollProcess.count({
        where: { ...where, isPosted: true },
      });
      if (postedCount > 0) {
        throw new Error("Posted payroll records cannot be unapproved");
      }
    }

    const now = new Date();
    const processData: Prisma.PayrollProcessUncheckedUpdateManyInput = input.approved
      ? {
          isApproved: true,
          approvedBy: actedBy,
          approvedAt: now,
        }
      : {
          isApproved: false,
          approvedBy: null,
          approvedAt: null,
        };

    const componentData: Prisma.PayrollComponentUncheckedUpdateManyInput = input.approved
      ? { isApproved: true }
      : { isApproved: false };

    return prisma.$transaction(async (tx) => {
      const processes = await tx.payrollProcess.findMany({
        where,
        select: { id: true },
      });
      if (processes.length === 0) {
        return { count: 0, approved: input.approved };
      }

      const processIds = processes.map((p) => p.id);

      const processResult = await tx.payrollProcess.updateMany({
        where: { id: { in: processIds } },
        data: processData,
      });

      await tx.payrollComponent.updateMany({
        where: {
          payrollProcessId: { in: processIds },
          year: input.year,
          month: input.month,
        },
        data: componentData,
      });

      return { count: processResult.count, approved: input.approved };
    });
  }

  async postPayroll(input: PayrollPeriodActionInput): Promise<{ count: number }> {
    validateReportYearMonth(input.year, input.month);
    const actedBy = input.actedBy?.trim();
    if (!actedBy) throw new Error("actedBy is required");

    const ids = normalizePayrollProcessIds(input.ids);
    if (ids) await assertPayrollProcessesMatchPeriod(input.year, input.month, ids);

    const where = payrollProcessPeriodWhere(input.year, input.month, ids);

    const notApprovedCount = await prisma.payrollProcess.count({
      where: { ...where, isApproved: false },
    });
    if (notApprovedCount > 0) {
      throw new Error("Only approved payroll records can be posted");
    }

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const toPost = await tx.payrollProcess.findMany({
        where: { ...where, isPosted: false },
        select: { id: true },
      });
      if (toPost.length === 0) {
        return { count: 0 };
      }

      const processIds = toPost.map((p) => p.id);

      const result = await tx.payrollProcess.updateMany({
        where: { id: { in: processIds }, isPosted: false },
        data: {
          isPosted: true,
          postedBy: actedBy,
          postedAt: now,
        },
      });

      await tx.payrollComponent.updateMany({
        where: {
          payrollProcessId: { in: processIds },
          year: input.year,
          month: input.month,
          isPosted: false,
        },
        data: { isPosted: true },
      });

      return { count: result.count };
    });
  }

  async compute(): Promise<{ success: boolean; message: string }> {
    try {
      const activePayrollPeriod = await activePayrollPeriodService.getActivePayrollPeriod();
      if (!activePayrollPeriod) {
        return { success: false, message: "Active payroll period not found" };
      }

      const activeStaffs = await prisma.staff.findMany({
        where: { status: Status.Active },
        select: {
          id: true,
          StaffNumber: true,
          name: true,
          employmentType: true,
          gradeLevelId: true,
          step: true,
          gradeLevel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const salaryChartRows = await prisma.salaryChart.findMany({
        where: { status: Status.Active },
        select: staffSalaryChartSelect,
      });

      const chartsBySlot = groupSalaryChartsBySlot(salaryChartRows);
      // get only active salary components
      const activeSalaryComponents = await prisma.salaryComponent.findMany({
        where: { status: Status.Active },
        select: salaryComponentSelect,
      });

      const postedInPeriod = await prisma.payrollProcess.count({
        where: {
          year: activePayrollPeriod.year,
          month: activePayrollPeriod.month,
          isPosted: true,
        },
      });
      if (postedInPeriod > 0) {
        return {
          success: false,
          message: "Cannot recompute payroll for a period that contains posted records",
        };
      }

      await prisma.payrollComponent.deleteMany({
        where: { year: activePayrollPeriod.year, month: activePayrollPeriod.month },
      });
      await prisma.payrollProcess.deleteMany({
        where: { year: activePayrollPeriod.year, month: activePayrollPeriod.month },
      });
      for (const staff of activeStaffs) {
        const salaryCharts = mapSalaryChartsForStaff(staff, chartsBySlot, activeSalaryComponents);

        // TODO: compute payroll using salaryCharts for activePayrollPeriod year/month
        // insert into payroll table
        try {
          if (salaryCharts.length > 0) {
            // find the staff salary override components for the staff
            const staffSalaryOverrideComponents =
              await prisma.staffSalaryOverrideComponent.findMany({
                where: { staffId: staff.id, status: Status.Active },
              });
            const staffSalaryOverrideComponentsById = new Map(
              staffSalaryOverrideComponents.map((component) => [component.componentId, component])
            );
            await prisma.$transaction(async (tx) => {
              // sun up all salary components that are earnings
              salaryCharts.forEach((chart) => {
                const staffSalaryOverrideComponent = staffSalaryOverrideComponentsById.get(
                  chart.componentId
                );
                if (staffSalaryOverrideComponent) {
                  chart.amount = new Prisma.Decimal(staffSalaryOverrideComponent.amount);
                } else {
                  chart.amount = new Prisma.Decimal(chart.amount);
                }
              });
              const netEarnings = salaryCharts
                .filter((chart) => chart.component.type === SalaryComponentType.EARNING)
                .reduce((acc, chart) => acc + Number(chart.amount), 0);
              // sum up all salary components that are deductions
              const netDeductions = salaryCharts
                .filter((chart) => chart.component.type === SalaryComponentType.DEDUCTION)
                .reduce((acc, chart) => acc + Number(chart.amount), 0);
              // sum up all salary components that are allowances
              const netAllowances = salaryCharts
                .filter((chart) => chart.component.type === SalaryComponentType.EARNING)
                .reduce((acc, chart) => acc + Number(chart.amount), 0);
              const netPay = netEarnings - netDeductions;
              const payrollProcess = await tx.payrollProcess.create({
                data: {
                  staffId: staff.id,
                  year: activePayrollPeriod.year,
                  month: activePayrollPeriod.month,
                  gradeLevelId: staff.gradeLevelId ?? "",
                  step: staff.step,
                  employmentType: staff.employmentType,
                  grossEarnings: netEarnings,
                  netAllowances: netAllowances,
                  netEarnings: netEarnings,
                  netDeductions: netDeductions,
                  netPay: netPay,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
              await tx.payrollComponent.createMany({
                data: salaryCharts.map((chart) => ({
                  payrollProcessId: payrollProcess.id,
                  month: activePayrollPeriod.month,
                  year: activePayrollPeriod.year,
                  componentId: chart.componentId,
                  amount: chart.amount,
                })),
              });
            });
            // console.log("salaryCharts", salaryCharts);
          }
        } catch (error) {
          console.error("Error computing payroll for staff", staff.id, error);
        }

        void salaryCharts;
      }

      return { success: true, message: "Payroll computation completed successfully" };
    } catch {
      return { success: false, message: "Failed to compute payroll" };
    }
  }
}

export const payrollService = new PayrollService();
