import { Injectable, Logger } from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportReportDto, ExportFormat } from './dto/export-report.dto';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Reports Service
 * Business logic for generating various reports
 * Connected to real database via Prisma
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get financial summary report
   * Includes revenue, expenses, and profit/loss
   */
  async getFinancialReport(orgId: string, query: ReportQueryDto) {
    this.logger.log(
      `Generating financial report for organisation ${orgId}`,
    );

    const { fromDate, toDate, currency = 'EUR' } = query;

    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = toDate ? new Date(toDate) : new Date();

    // Run parallel queries for performance
    const [
      paidInvoices,
      allInvoices,
      overdueInvoices,
      approvedExpenses,
      expensesByCategory,
    ] = await Promise.all([
      // Sum of paid invoices (revenue)
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          status: 'PAID',
          paidDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      // All invoices in period
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          issueDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      // Overdue invoices
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          status: 'OVERDUE',
          issueDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      // Approved expenses
      this.prisma.expense.aggregate({
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      // Expenses by category
      this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = paidInvoices._sum.totalAmount?.toNumber() || 0;
    const totalInvoiced = allInvoices._sum.totalAmount?.toNumber() || 0;
    const totalOverdue = overdueInvoices._sum.totalAmount?.toNumber() || 0;
    const totalExpenses = approvedExpenses._sum.amount?.toNumber() || 0;

    const expenseCategories: Record<string, number> = {};
    expensesByCategory.forEach((cat: { category: string; _sum: { amount: Decimal | null } }) => {
      expenseCategories[cat.category.toLowerCase()] = cat._sum.amount?.toNumber() || 0;
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      reportType: 'financial',
      organisationId: orgId,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      currency,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      revenue: {
        invoiced: totalInvoiced,
        paid: totalRevenue,
        outstanding: totalInvoiced - totalRevenue,
        overdue: totalOverdue,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expenseCategories,
      },
      cashFlow: {
        inflow: totalRevenue,
        outflow: totalExpenses,
        net: netProfit,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get tax summary report
   * Includes VAT summary and tax deductions
   */
  async getTaxReport(orgId: string, query: ReportQueryDto) {
    this.logger.log(
      `Generating tax report for organisation ${orgId}`,
    );

    const { fromDate, toDate, currency = 'EUR' } = query;

    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = toDate ? new Date(toDate) : new Date();
    const year = startDate.getFullYear();

    // Get organisation country for tax rules
    const org = await this.prisma.organisation.findUnique({
      where: { id: orgId },
      select: { country: true },
    });

    const [
      invoiceVAT,
      expenseVAT,
      deductionSuggestions,
      confirmedDeductions,
      deductionsByCategory,
      taxSummary,
    ] = await Promise.all([
      // VAT collected on invoices
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          status: 'PAID',
          paidDate: { gte: startDate, lte: endDate },
        },
        _sum: { taxAmount: true, totalAmount: true },
      }),
      // VAT paid on expenses
      this.prisma.expense.aggregate({
        where: {
          orgId,
          status: 'APPROVED',
          date: { gte: startDate, lte: endDate },
        },
        _sum: { vatAmount: true },
      }),
      // Deduction suggestion counts
      this.prisma.deductionSuggestion.groupBy({
        by: ['status'],
        where: {
          orgId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      // Confirmed deductions
      this.prisma.deductionSuggestion.aggregate({
        where: {
          orgId,
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { deductibleAmount: true },
      }),
      // Deductions by category
      this.prisma.deductionSuggestion.groupBy({
        by: ['categoryCode'],
        where: {
          orgId,
          status: 'CONFIRMED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { deductibleAmount: true },
      }),
      // Tax deduction summary for the year
      this.prisma.taxDeductionSummary.findFirst({
        where: {
          orgId,
          year,
          countryCode: org?.country || 'DE',
        },
      }),
    ]);

    const vatCollected = invoiceVAT._sum.taxAmount?.toNumber() || 0;
    const vatPaid = expenseVAT._sum.vatAmount?.toNumber() || 0;
    const netVatDue = vatCollected - vatPaid;

    const totalRevenue = invoiceVAT._sum.totalAmount?.toNumber() || 0;
    const totalDeductions = confirmedDeductions._sum.deductibleAmount?.toNumber() || 0;
    const taxableIncome = totalRevenue - totalDeductions;

    // Build deduction category breakdown
    const deductionCategories: Record<string, number> = {};
    deductionsByCategory.forEach((cat: { categoryCode: string; _sum: { deductibleAmount: Decimal | null } }) => {
      const categoryName = cat.categoryCode.toLowerCase().replace(/_/g, '_');
      deductionCategories[categoryName] = cat._sum.deductibleAmount?.toNumber() || 0;
    });

    // Count suggestions by status
    const suggestionCounts = {
      suggested: 0,
      confirmed: 0,
      rejected: 0,
    };
    deductionSuggestions.forEach((item: { status: string; _count: number }) => {
      if (item.status === 'SUGGESTED') suggestionCounts.suggested = item._count;
      if (item.status === 'CONFIRMED') suggestionCounts.confirmed = item._count;
      if (item.status === 'REJECTED') suggestionCounts.rejected = item._count;
    });

    // Simplified tax calculation (would be more complex in production)
    // Using German tax rates as example
    const incomeTaxRate = 0.30; // 30% simplified
    const tradeTaxRate = 0.05; // 5% simplified
    const incomeTax = taxableIncome > 0 ? taxableIncome * incomeTaxRate : 0;
    const tradeTax = taxableIncome > 0 ? taxableIncome * tradeTaxRate : 0;

    return {
      reportType: 'tax',
      organisationId: orgId,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      currency,
      vat: {
        collected: vatCollected,
        paid: vatPaid,
        netVatDue,
        vatRate: 19.0, // Default German VAT rate
      },
      deductions: {
        total: totalDeductions,
        byCategory: deductionCategories,
        ...suggestionCounts,
      },
      taxableIncome: {
        gross: totalRevenue,
        deductions: totalDeductions,
        net: taxableIncome,
      },
      estimatedTax: {
        incomeTax: Math.round(incomeTax * 100) / 100,
        tradeTax: Math.round(tradeTax * 100) / 100,
        total: Math.round((incomeTax + tradeTax) * 100) / 100,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get invoice summary report
   * Includes aging, outstanding, and paid invoices
   */
  async getInvoicesReport(orgId: string, query: ReportQueryDto) {
    this.logger.log(
      `Generating invoice report for organisation ${orgId}`,
    );

    const { fromDate, toDate, currency = 'EUR' } = query;

    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = toDate ? new Date(toDate) : new Date();

    const [
      totalStats,
      invoicesByStatus,
      paidInvoices,
    ] = await Promise.all([
      // Total invoice stats
      this.prisma.invoice.aggregate({
        where: {
          orgId,
          issueDate: { gte: startDate, lte: endDate },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Group by status
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: {
          orgId,
          issueDate: { gte: startDate, lte: endDate },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Paid invoices for average payment time
      this.prisma.invoice.findMany({
        where: {
          orgId,
          status: 'PAID',
          paidDate: { not: null },
          issueDate: { gte: startDate, lte: endDate },
        },
        select: { issueDate: true, paidDate: true },
      }),
    ]);

    // Build status breakdown
    const statusBreakdown: Record<string, { count: number; amount: number }> = {};
    let paidAmount = 0;
    let overdueAmount = 0;

    invoicesByStatus.forEach((item: { status: string; _count: number; _sum: { totalAmount: Decimal | null } }) => {
      const status = item.status.toLowerCase();
      const amount = item._sum.totalAmount?.toNumber() || 0;
      statusBreakdown[status] = {
        count: item._count,
        amount,
      };
      if (item.status === 'PAID') paidAmount = amount;
      if (item.status === 'OVERDUE') overdueAmount = amount;
    });

    const totalAmount = totalStats._sum.totalAmount?.toNumber() || 0;
    const outstandingAmount = totalAmount - paidAmount;

    // Calculate aging buckets for unpaid invoices
    const now = new Date();
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: {
        orgId,
        status: { in: ['SENT', 'OVERDUE'] },
        issueDate: { gte: startDate, lte: endDate },
      },
      select: { dueDate: true, totalAmount: true },
    });

    const aging = {
      current: { count: 0, amount: 0 },
      days_1_30: { count: 0, amount: 0 },
      days_31_60: { count: 0, amount: 0 },
      days_60_plus: { count: 0, amount: 0 },
    };

    unpaidInvoices.forEach((invoice: { dueDate: Date; totalAmount: Decimal }) => {
      const daysOverdue = Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = invoice.totalAmount.toNumber();

      if (daysOverdue < 0) {
        aging.current.count++;
        aging.current.amount += amount;
      } else if (daysOverdue <= 30) {
        aging.days_1_30.count++;
        aging.days_1_30.amount += amount;
      } else if (daysOverdue <= 60) {
        aging.days_31_60.count++;
        aging.days_31_60.amount += amount;
      } else {
        aging.days_60_plus.count++;
        aging.days_60_plus.amount += amount;
      }
    });

    // Calculate average payment time
    let averagePaymentTime = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum: number, invoice: { issueDate: Date; paidDate: Date | null }) => {
        if (invoice.paidDate) {
          const days = Math.floor((invoice.paidDate.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }
        return sum;
      }, 0);
      averagePaymentTime = Math.round(totalDays / paidInvoices.length);
    }

    return {
      reportType: 'invoices',
      organisationId: orgId,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      currency,
      summary: {
        totalInvoices: totalStats._count,
        totalAmount,
        paidAmount,
        outstandingAmount,
        overdueAmount,
      },
      byStatus: statusBreakdown,
      aging,
      averagePaymentTime,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get HR summary report
   * Includes payroll summary and leave balances
   */
  async getHrReport(orgId: string, query: ReportQueryDto) {
    this.logger.log(
      `Generating HR report for organisation ${orgId}`,
    );

    const { fromDate, toDate, currency = 'EUR' } = query;

    const startDate = fromDate ? new Date(fromDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = toDate ? new Date(toDate) : new Date();
    const currentYear = new Date().getFullYear();

    const [
      employeesByStatus,
      payrollStats,
      leaveEntitlements,
      leaveRequests,
      timeEntries,
    ] = await Promise.all([
      // Employee counts by status
      this.prisma.employee.groupBy({
        by: ['status'],
        where: { orgId },
        _count: true,
      }),
      // Payroll data for the period
      this.prisma.payslip.findMany({
        where: {
          employee: { orgId },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          grossSalary: true,
          netSalary: true,
          deductions: true,
          employee: {
            select: {
              contracts: {
                where: { isActive: true },
                select: { department: true },
                take: 1,
              },
            },
          },
        },
      }),
      // Leave entitlements for current year
      this.prisma.leaveEntitlement.findMany({
        where: {
          employee: { orgId },
          year: currentYear,
        },
        select: {
          leaveType: true,
          totalDays: true,
          usedDays: true,
        },
      }),
      // Leave requests in period
      this.prisma.leaveRequest.findMany({
        where: {
          employee: { orgId },
          startDate: { gte: startDate, lte: endDate },
        },
        select: {
          leaveType: true,
          totalDays: true,
        },
      }),
      // Time entries in period
      this.prisma.timeEntry.findMany({
        where: {
          employee: { orgId },
          date: { gte: startDate, lte: endDate },
          status: 'APPROVED',
        },
        select: {
          totalHours: true,
          overtimeHours: true,
        },
      }),
    ]);

    // Employee counts
    const employeeCounts = {
      total: 0,
      active: 0,
      onLeave: 0,
      terminated: 0,
    };
    employeesByStatus.forEach((item: { status: string; _count: number }) => {
      employeeCounts.total += item._count;
      if (item.status === 'ACTIVE') employeeCounts.active = item._count;
      if (item.status === 'ON_LEAVE') employeeCounts.onLeave = item._count;
      if (item.status === 'TERMINATED') employeeCounts.terminated = item._count;
    });

    // Payroll calculations
    let totalGross = 0;
    let totalNet = 0;
    const departmentTotals: Record<string, number> = {};

    payrollStats.forEach((payslip: {
      grossSalary: Decimal;
      netSalary: Decimal;
      employee: { contracts: { department: string | null }[] }
    }) => {
      totalGross += payslip.grossSalary.toNumber();
      totalNet += payslip.netSalary.toNumber();

      const department = payslip.employee.contracts[0]?.department || 'unassigned';
      if (!departmentTotals[department]) {
        departmentTotals[department] = 0;
      }
      departmentTotals[department] += payslip.grossSalary.toNumber();
    });

    const totalDeductions = totalGross - totalNet;
    const averageGross = payrollStats.length > 0 ? totalGross / payrollStats.length : 0;
    const averageNet = payrollStats.length > 0 ? totalNet / payrollStats.length : 0;

    // Leave calculations
    const leaveByType: Record<string, { used: number; remaining: number }> = {};
    let totalUsed = 0;
    let totalRemaining = 0;

    leaveEntitlements.forEach((entitlement: {
      leaveType: string;
      totalDays: Decimal;
      usedDays: Decimal;
    }) => {
      const type = entitlement.leaveType.toLowerCase();
      const used = entitlement.usedDays.toNumber();
      const remaining = entitlement.totalDays.toNumber() - used;

      if (!leaveByType[type]) {
        leaveByType[type] = { used: 0, remaining: 0 };
      }
      leaveByType[type].used += used;
      leaveByType[type].remaining += remaining;
      totalUsed += used;
      totalRemaining += remaining;
    });

    // Time tracking calculations
    let totalHours = 0;
    let totalOvertime = 0;

    timeEntries.forEach((entry: {
      totalHours: Decimal;
      overtimeHours: Decimal;
    }) => {
      totalHours += entry.totalHours.toNumber();
      totalOvertime += entry.overtimeHours.toNumber();
    });

    const regularHours = totalHours - totalOvertime;
    const averageHours = employeeCounts.active > 0 ? totalHours / employeeCounts.active : 0;

    return {
      reportType: 'hr',
      organisationId: orgId,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      currency,
      employees: employeeCounts,
      payroll: {
        totalGrossSalary: Math.round(totalGross * 100) / 100,
        totalNetSalary: Math.round(totalNet * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        averageGrossSalary: Math.round(averageGross * 100) / 100,
        averageNetSalary: Math.round(averageNet * 100) / 100,
        byDepartment: departmentTotals,
      },
      leave: {
        totalDaysUsed: Math.round(totalUsed * 10) / 10,
        totalDaysRemaining: Math.round(totalRemaining * 10) / 10,
        byType: leaveByType,
      },
      timeTracking: {
        totalHours: Math.round(totalHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        overtimeHours: Math.round(totalOvertime * 100) / 100,
        averageHoursPerEmployee: Math.round(averageHours * 100) / 100,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export report in specified format
   * Currently returns mock export confirmation - will be implemented later
   */
  async exportReport(orgId: string, dto: ExportReportDto) {
    this.logger.log(
      `Exporting ${dto.reportType} report for organisation ${orgId} as ${dto.format}`,
    );

    const { reportType, format, fromDate, toDate, title } = dto;

    // Mock export - will be replaced with actual file generation
    const fileName = this.generateFileName(reportType, format, fromDate, toDate);

    return {
      success: true,
      message: 'Report export initiated',
      reportType,
      format,
      fileName,
      title: title || this.generateReportTitle(reportType, fromDate, toDate),
      period: {
        from: fromDate || new Date(new Date().getFullYear(), 0, 1).toISOString(),
        to: toDate || new Date().toISOString(),
      },
      estimatedCompletionTime: '30 seconds',
      downloadUrl: `/api/reports/downloads/${fileName}`, // Mock URL
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate file name for exported report
   */
  private generateFileName(
    reportType: string,
    format: ExportFormat,
    fromDate?: string,
    toDate?: string,
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const dateRange = fromDate && toDate
      ? `${fromDate}_to_${toDate}`
      : timestamp;

    return `${reportType}_report_${dateRange}.${format}`;
  }

  /**
   * Generate human-readable report title
   */
  private generateReportTitle(
    reportType: string,
    fromDate?: string,
    toDate?: string,
  ): string {
    const typeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);

    if (fromDate && toDate) {
      return `${typeLabel} Report (${fromDate} to ${toDate})`;
    }

    const year = new Date().getFullYear();
    return `${typeLabel} Report ${year}`;
  }
}
