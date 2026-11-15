import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";

const DAY = 86_400_000;

function period(now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const months = Array.from({ length: 6 }, (_, index) =>
    new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1)).toISOString().slice(0, 7),
  );
  return { start, end, todayEnd, months };
}

@Injectable()
export class HrmsDashboardMetricsService {
  constructor(private readonly db: PrismaService) {}

  async leave(organizationId: string, now = new Date()) {
    const { start, todayEnd, months } = period(now);
    const requests = await this.db.hrmsLeaveRequest.findMany({
      where: { organizationId, status: "APPROVED", startDate: { lt: todayEnd }, endDate: { gte: start } },
      select: { startDate: true, endDate: true, totalDays: true, dayAllocation: true },
    });
    const totals = new Map(months.map((month) => [month, 0]));
    let excludedLegacyRequests = 0;
    for (const request of requests) {
      const first = request.startDate.getTime();
      const last = request.endDate.getTime();
      const span = (last - first) / DAY + 1;
      if (
        !Number.isInteger(span) ||
        span < 1 ||
        !Number.isFinite(request.totalDays) ||
        request.totalDays <= 0 ||
        request.totalDays > span
      ) {
        throw new Error("Invalid leave date range");
      }
      if (request.dayAllocation !== null) {
        if (!Array.isArray(request.dayAllocation) || request.dayAllocation.length !== span) {
          throw new Error("Invalid leave date allocation");
        }
        const seen = new Set<string>();
        let total = 0;
        for (const entry of request.dayAllocation) {
          if (
            !entry ||
            typeof entry !== "object" ||
            Array.isArray(entry) ||
            typeof entry.date !== "string" ||
            typeof entry.units !== "number" ||
            ![0, 0.5, 1].includes(entry.units) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)
          ) {
            throw new Error("Invalid leave date allocation");
          }
          const date = new Date(`${entry.date}T00:00:00Z`);
          if (
            !Number.isFinite(date.getTime()) ||
            date.toISOString().slice(0, 10) !== entry.date ||
            date.getTime() < first ||
            date.getTime() > last ||
            seen.has(entry.date)
          ) {
            throw new Error("Invalid leave date allocation");
          }
          seen.add(entry.date);
          total += entry.units;
          const month = entry.date.slice(0, 7);
          if (date >= start && date < todayEnd && totals.has(month)) {
            totals.set(month, (totals.get(month) ?? 0) + entry.units);
          }
        }
        if (total !== request.totalDays) {
          throw new Error("Leave allocation does not match total days");
        }
      } else if (request.totalDays === span || (span === 1 && request.totalDays === 0.5)) {
        // Legacy full-calendar ranges and single half-days can be allocated exactly.
        for (let day = Math.max(first, start.getTime()); day <= last && day < todayEnd.getTime(); day += DAY) {
          const month = new Date(day).toISOString().slice(0, 7);
          totals.set(month, (totals.get(month) ?? 0) + (span === 1 ? request.totalDays : 1));
        }
      } else if (
        request.startDate.toISOString().slice(0, 7) === request.endDate.toISOString().slice(0, 7) &&
        request.endDate < todayEnd
      ) {
        const month = request.startDate.toISOString().slice(0, 7);
        if (totals.has(month)) {
          totals.set(month, (totals.get(month) ?? 0) + request.totalDays);
        }
      } else {
        // Do not guess the month split for historical leave without per-day allocations.
        excludedLegacyRequests++;
      }
    }
    return { months: months.map((month) => ({ month, days: totals.get(month) ?? 0 })), excludedLegacyRequests };
  }

  async payroll(organizationId: string, now = new Date()) {
    const { start, end, months } = period(now);
    const records = await this.db.hrmsPayrollRecord.groupBy({
      by: ["payDate", "currency"],
      where: { organizationId, status: { in: ["APPROVED", "PAID"] }, payDate: { gte: start, lt: end } },
      _sum: { netPay: true },
    });
    const currencies = new Map<string, Map<string, Prisma.Decimal>>();
    for (const record of records) {
      if (record._sum.netPay === null || !Number.isFinite(record._sum.netPay)) {
        throw new Error("Invalid payroll total");
      }
      const month = record.payDate.toISOString().slice(0, 7);
      const totals = currencies.get(record.currency) ?? new Map<string, Prisma.Decimal>();
      totals.set(month, (totals.get(month) ?? new Prisma.Decimal(0)).plus(record._sum.netPay));
      currencies.set(record.currency, totals);
    }
    return {
      months,
      series: [...currencies.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([currency, totals]) => ({
          currency,
          values: months.map((month) => (totals.get(month) ?? new Prisma.Decimal(0)).toString()),
        })),
    };
  }
}
