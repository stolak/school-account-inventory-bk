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

export class PayrollService {
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

      for (const staff of activeStaffs) {
        const salaryCharts = mapSalaryChartsForStaff(staff, chartsBySlot, activeSalaryComponents);

        // TODO: compute payroll using salaryCharts for activePayrollPeriod year/month
        // insert into payroll table
        try {
          if (salaryCharts.length > 0) {
            await prisma.$transaction(async (tx) => {
              // sun up all salary components that are earnings
              salaryCharts.forEach((chart) => {
                if (chart.component.type === SalaryComponentType.EARNING) {
                  chart.amount = new Prisma.Decimal(80000);
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
            console.log("salaryCharts", salaryCharts);
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
