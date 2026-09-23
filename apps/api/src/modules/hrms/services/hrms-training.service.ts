import { Injectable } from "@nestjs/common";
import type { TrainingEnrollmentStatus, TrainingStatus, TrainingType } from "@prisma/client";

import { HrmsOperationsService } from "./hrms-operations.service";

@Injectable()
export class HrmsTrainingService {
  constructor(private readonly operations: HrmsOperationsService) {}
  list(organizationId: string) { return this.operations.listTrainings(organizationId); }
  create(organizationId: string, actorUserId: string, input: { title: string; type: TrainingType; description?: string; startDate?: string; endDate?: string; status?: TrainingStatus; maxParticipants?: number }) { return this.operations.createTraining(organizationId, actorUserId, input); }
  enroll(organizationId: string, trainingId: string, actorUserId: string, employeeId: string, status?: TrainingEnrollmentStatus) { return this.operations.enrollTraining(organizationId, trainingId, actorUserId, employeeId, status); }
}