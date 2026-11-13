import { Module } from "@nestjs/common";

import { HrmsEmployeeController } from "./controllers/hrms-employee.controller";
import { HrmsAttendanceController } from "./controllers/hrms-attendance.controller";
import { HrmsAttendanceSelfController } from "./controllers/hrms-attendance-self.controller";
import { HrmsHolidayCalendarController } from "./controllers/hrms-holiday-calendar.controller";
import { HrmsHolidayController } from "./controllers/hrms-holiday.controller";
import { HrmsLeaveController } from "./controllers/hrms-leave.controller";
import { HrmsPerformanceReviewController } from "./controllers/hrms-performance-review.controller";
import { HrmsPayrollController } from "./controllers/hrms-payroll.controller";
import { HrmsTrainingController } from "./controllers/hrms-training.controller";
import { HrmsAssetController } from "./controllers/hrms-asset.controller";
import { HrmsBenefitController } from "./controllers/hrms-benefit.controller";
import { HrmsMasterDataController } from "./controllers/hrms-master-data.controller";
import { HrmsWorkflowDefinitionController } from "./controllers/hrms-workflow-definition.controller";
import { HrmsWorkflowInstanceController } from "./controllers/hrms-workflow-instance.controller";
import { HrmsEmployeeService } from "./services/hrms-employee.service";
import { HrmsEmployeeImportService } from "./services/hrms-employee-import.service";
import { HrmsAttendanceService } from "./services/hrms-attendance.service";
import { HrmsAttendanceClockService } from "./services/hrms-attendance-clock.service";
import { HrmsAttendanceRegularizationService } from "./services/hrms-attendance-regularization.service";
import { HrmsOperationsService } from "./services/hrms-operations.service";
import { HrmsHolidayCalendarService } from "./services/hrms-holiday-calendar.service";
import { HrmsHolidayService } from "./services/hrms-holiday.service";
import { HrmsLeaveService } from "./services/hrms-leave.service";
import { HrmsPerformanceReviewService } from "./services/hrms-performance-review.service";
import { HrmsPayrollService } from "./services/hrms-payroll.service";
import { HrmsTrainingService } from "./services/hrms-training.service";
import { HrmsAssetService } from "./services/hrms-asset.service";
import { HrmsBenefitService } from "./services/hrms-benefit.service";
import { HrmsMasterDataService } from "./services/hrms-master-data.service";
import { HrmsWorkflowDefinitionService } from "./services/hrms-workflow-definition.service";
import { HrmsWorkflowInstanceService } from "./services/hrms-workflow-instance.service";

@Module({
  controllers: [
    HrmsEmployeeController,
    HrmsAttendanceController,
    HrmsAttendanceSelfController,
    HrmsHolidayCalendarController,
    HrmsHolidayController,
    HrmsLeaveController,
    HrmsPerformanceReviewController,
    HrmsPayrollController,
    HrmsTrainingController,
    HrmsAssetController,
    HrmsBenefitController,
    HrmsMasterDataController,
    HrmsWorkflowDefinitionController,
    HrmsWorkflowInstanceController,
  ],
  providers: [
    HrmsEmployeeService,
    HrmsEmployeeImportService,
    HrmsAttendanceService,
    HrmsAttendanceClockService,
    HrmsAttendanceRegularizationService,
    HrmsOperationsService,
    HrmsHolidayCalendarService,
    HrmsHolidayService,
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
