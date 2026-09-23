import { Injectable } from "@nestjs/common";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsBenefitService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) { return this.operations.listBenefits(organizationId); }
  create(organizationId: string, actorUserId: string, input: { employeeId: string; provider: string; planName: string; policyNumber?: string; coverageStarts: string; coverageEnds?: string; isActive?: boolean }) { return this.operations.createBenefit(organizationId, actorUserId, input); }
}