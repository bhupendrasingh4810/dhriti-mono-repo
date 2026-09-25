import { Injectable } from "@nestjs/common";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsPayrollService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) {
    return this.operations.listPayroll(organizationId);
  }
  create(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      period: string;
      periodStart: string;
      periodEnd: string;
      payDate: string;
      grossSalary: number;
      totalDeductions: number;
      netPay: number;
      currency?: string;
      notes?: string;
    },
  ) {
    return this.operations.createPayroll(organizationId, actorUserId, input);
  }
  approve(organizationId: string, payrollId: string, actorUserId: string) {
    return this.operations.approvePayroll(organizationId, payrollId, actorUserId);
  }
}
