import { Injectable } from "@nestjs/common";
import type { LeaveStatus, LeaveType } from "@prisma/client";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsLeaveService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) {
    return this.operations.listLeave(organizationId);
  }
  create(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
    },
  ) {
    return this.operations.createLeave(organizationId, actorUserId, input);
  }
  updateStatus(
    organizationId: string,
    leaveId: string,
    actorUserId: string,
    status: LeaveStatus,
    rejectionReason?: string,
  ) {
    return this.operations.updateLeaveStatus(organizationId, leaveId, actorUserId, status, rejectionReason);
  }
}
