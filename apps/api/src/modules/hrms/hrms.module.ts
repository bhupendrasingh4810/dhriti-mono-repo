import { Module } from "@nestjs/common";

import { HrmsEmployeeController } from "./hrms-employee.controller";
import { HrmsEmployeeService } from "./hrms-employee.service";
import { HrmsAttendanceController } from "./hrms-attendance.controller";
import { HrmsAttendanceService } from "./hrms-attendance.service";
import { HrmsOperationsController } from "./hrms-operations.controller";
import { HrmsOperationsService } from "./hrms-operations.service";

@Module({
  controllers: [HrmsEmployeeController, HrmsAttendanceController, HrmsOperationsController],
  providers: [HrmsEmployeeService, HrmsAttendanceService, HrmsOperationsService],
  exports: [HrmsEmployeeService, HrmsAttendanceService, HrmsOperationsService],
})
export class HrmsModule {}