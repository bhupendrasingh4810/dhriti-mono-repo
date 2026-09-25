import { Module } from "@nestjs/common";

import { HrmsEmployeeController } from "./controllers/hrms-employee.controller";
import { HrmsAttendanceController } from "./controllers/hrms-attendance.controller";
import { HrmsHolidayCalendarController } from "./controllers/hrms-holiday-calendar.controller";
import { HrmsLeaveController } from "./controllers/hrms-leave.controller";
import { HrmsPerformanceReviewController } from "./controllers/hrms-performance-review.controller";
import { HrmsPayrollController } from "./controllers/hrms-payroll.controller";
import { HrmsTrainingController } from "./controllers/hrms-training.controller";
import { HrmsAssetController } from "./controllers/hrms-asset.controller";
import { HrmsBenefitController } from "./controllers/hrms-benefit.controller";
import { HrmsEmployeeService } from "./services/hrms-employee.service";
import { HrmsAttendanceService } from "./services/hrms-attendance.service";
import { HrmsOperationsService } from "./services/hrms-operations.service";
import { HrmsHolidayCalendarService } from "./services/hrms-holiday-calendar.service";
import { HrmsLeaveService } from "./services/hrms-leave.service";
import { HrmsPerformanceReviewService } from "./services/hrms-performance-review.service";
import { HrmsPayrollService } from "./services/hrms-payroll.service";
import { HrmsTrainingService } from "./services/hrms-training.service";
import { HrmsAssetService } from "./services/hrms-asset.service";
import { HrmsBenefitService } from "./services/hrms-benefit.service";

@Module({
  controllers: [
    HrmsEmployeeController,
    HrmsAttendanceController,
    HrmsHolidayCalendarController,
    HrmsLeaveController,
    HrmsPerformanceReviewController,
    HrmsPayrollController,
    HrmsTrainingController,
    HrmsAssetController,
    HrmsBenefitController,
  ],
  providers: [
    HrmsEmployeeService,
    HrmsAttendanceService,
    HrmsOperationsService,
    HrmsHolidayCalendarService,
    HrmsLeaveService,
    HrmsPerformanceReviewService,
    HrmsPayrollService,
    HrmsTrainingService,
    HrmsAssetService,
    HrmsBenefitService,
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
  ],
})
export class HrmsModule {}
