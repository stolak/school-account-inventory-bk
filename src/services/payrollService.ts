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

function validateReportYearMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error("year must be an integer between 1900 and 2100");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("month must be an integer between 1 and 12");
  }
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

      // const salaryComponentsByType = groupSalaryComponentsByType(activeSalaryComponents);
      // delete all payroll components for the active payroll period
      await prisma.payrollComponent.deleteMany({
        where: { year: activePayrollPeriod.year, month: activePayrollPeriod.month },
      });
      // delete all payroll processes for the active payroll period
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
                  createdAt: new Date(),
                  updatedAt: new Date(),
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
