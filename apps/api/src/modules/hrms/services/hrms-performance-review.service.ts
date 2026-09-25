import { Injectable } from "@nestjs/common";
import type { ReviewStatus, ReviewType } from "@prisma/client";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsPerformanceReviewService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) {
    return this.operations.listReviews(organizationId);
  }
  create(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      reviewerEmployeeId: string;
      reviewType: ReviewType;
      cycle: string;
      startDate: string;
      dueDate: string;
      status?: ReviewStatus;
      overallRating?: number;
      comments?: string;
    },
  ) {
    return this.operations.createReview(organizationId, actorUserId, input);
  }
}
