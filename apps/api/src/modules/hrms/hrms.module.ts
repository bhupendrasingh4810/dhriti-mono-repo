import { Module } from "@nestjs/common";
import { HrmsWorkWeekController } from "./controllers/hrms-work-week.controller";
import { HrmsWorkWeekService } from "./services/hrms-work-week.service";
import { HrmsDashboardMetricsService } from "./services/hrms-dashboard-metrics.service";
import { FileModule } from "../file/file.module";
import { HrmsRecruitmentController } from "./controllers/hrms-recruitment.controller";
import { HrmsRecruitmentService } from "./services/hrms-recruitment.service";
import { HrmsRecruitmentCandidateService } from "./services/hrms-recruitment-candidate.service";
import {
  HrmsEmployeeDocumentController,
  HrmsDocumentLibraryController,
} from "./controllers/hrms-employee-document.controller";
import { HrmsEmployeeDocumentService } from "./services/hrms-employee-document.service";

import { HrmsEmployeeController } from "./controllers/hrms-employee.controller";
import { HrmsAttendanceController } from "./controllers/hrms-attendance.controller";
import { HrmsAttendanceSelfController } from "./controllers/hrms-attendance-self.controller";
import { HrmsHolidayCalendarController } from "./controllers/hrms-holiday-calendar.controller";
import { HrmsHolidayController } from "./controllers/hrms-holiday.controller";
import { HrmsLeaveCenterController } from "./controllers/hrms-leave-center.controller";
import { HrmsLeaveController } from "./controllers/hrms-leave.controller";
import { HrmsPerformanceReviewController } from "./controllers/hrms-performance-review.controller";
import { HrmsPayrollController } from "./controllers/hrms-payroll.controller";
import { HrmsTrainingController } from "./controllers/hrms-training.controller";
import { HrmsAssetController } from "./controllers/hrms-asset.controller";
import { HrmsAssetOperationsController } from "./controllers/hrms-asset-operations.controller";
import { HrmsAssetOperationsService } from "./services/hrms-asset-operations.service";
import { HrmsAssetEvidenceService } from "./services/hrms-asset-evidence.service";
import { HrmsBenefitController } from "./controllers/hrms-benefit.controller";
import { HrmsMasterDataController } from "./controllers/hrms-master-data.controller";
import { HrmsWorkflowDefinitionController } from "./controllers/hrms-workflow-definition.controller";
import { HrmsWorkflowInstanceController } from "./controllers/hrms-workflow-instance.controller";
import { HrmsEmployeeService } from "./services/hrms-employee.service";
import { HrmsEmployeeFoundationService } from "./services/hrms-employee-foundation.service";
import { HrmsEmployeeImportService } from "./services/hrms-employee-import.service";
import { HrmsAttendanceService } from "./services/hrms-attendance.service";
import { HrmsAttendanceClockService } from "./services/hrms-attendance-clock.service";
import { HrmsAttendanceRegularizationService } from "./services/hrms-attendance-regularization.service";
import { HrmsOperationsService } from "./services/hrms-operations.service";
import { HrmsHolidayCalendarService } from "./services/hrms-holiday-calendar.service";
import { HrmsHolidayService } from "./services/hrms-holiday.service";
import { HrmsLeaveCenterService } from "./services/hrms-leave-center.service";
import { HrmsLeaveService } from "./services/hrms-leave.service";
import { HrmsPerformanceReviewService } from "./services/hrms-performance-review.service";
import { HrmsPayrollService } from "./services/hrms-payroll.service";
import { HrmsPayrollWorkspaceService } from "./services/hrms-payroll-workspace.service";
import { HrmsTrainingService } from "./services/hrms-training.service";
import { HrmsAssetService } from "./services/hrms-asset.service";
import { HrmsBenefitService } from "./services/hrms-benefit.service";
import { HrmsMasterDataService } from "./services/hrms-master-data.service";
import { HrmsWorkflowDefinitionService } from "./services/hrms-workflow-definition.service";
import { HrmsWorkflowInstanceService } from "./services/hrms-workflow-instance.service";

@Module({
  imports: [FileModule],
  controllers: [
    HrmsRecruitmentController,
    HrmsWorkWeekController,
    HrmsDocumentLibraryController,
    HrmsEmployeeDocumentController,
    HrmsEmployeeController,
    HrmsAttendanceController,
    HrmsAttendanceSelfController,
    HrmsHolidayCalendarController,
    HrmsHolidayController,
    HrmsLeaveController,
    HrmsLeaveCenterController,
    HrmsPerformanceReviewController,
    HrmsPayrollController,
    HrmsTrainingController,
    HrmsAssetController,
    HrmsAssetOperationsController,
    HrmsBenefitController,
    HrmsMasterDataController,
    HrmsWorkflowDefinitionController,
    HrmsWorkflowInstanceController,
  ],
  providers: [
    HrmsDashboardMetricsService,
    HrmsRecruitmentService,
    HrmsRecruitmentCandidateService,
    HrmsEmployeeFoundationService,
    HrmsWorkWeekService,
    HrmsEmployeeDocumentService,
    HrmsPayrollWorkspaceService,
    HrmsEmployeeService,
    HrmsEmployeeImportService,
    HrmsAttendanceService,
    HrmsAttendanceClockService,
    HrmsAttendanceRegularizationService,
    HrmsOperationsService,
    HrmsHolidayCalendarService,
    HrmsHolidayService,
    HrmsLeaveService,
    HrmsLeaveCenterService,
    HrmsPerformanceReviewService,
    HrmsPayrollService,
    HrmsTrainingService,
    HrmsAssetService,
    HrmsAssetOperationsService,
    HrmsAssetEvidenceService,
    HrmsBenefitService,
    HrmsMasterDataService,
    HrmsWorkflowDefinitionService,
    HrmsWorkflowInstanceService,
  ],
  exports: [
    HrmsEmployeeService,
    HrmsAttendanceService,
    HrmsHolidayCalendarService,
    HrmsLeaveService,
    HrmsPerformanceReviewService,
    HrmsPayrollService,
    HrmsTrainingService,
    HrmsAssetService,
    HrmsBenefitService,
    HrmsMasterDataService,
    HrmsWorkflowDefinitionService,
    HrmsWorkflowInstanceService,
  ],
})
export class HrmsModule {}
