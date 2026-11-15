import "reflect-metadata";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";
import { HrmsEmployeeController } from "./hrms-employee.controller";
import { EmployeeTimelineQueryDto } from "../dto/hrms-employee.dto";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

describe("employee profile endpoint contracts", () => {
  it.each(["profile", "updateProfile", "profileFields", "updateProfileFields", "timeline"] as const)(
    "guards %s with workforce permissions and the HRMS entitlement",
    (method) => {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsEmployeeController.prototype[method])).toEqual({
        entitlement: "hrms.enabled",
        permission: "hrms.workforce.manage",
      });
    },
  );
  it("defaults pagination and enforces finite integer bounds", () => {
    expect(plainToInstance(EmployeeTimelineQueryDto, {})).toMatchObject({ page: 1, pageSize: 20 });
    expect(validateSync(plainToInstance(EmployeeTimelineQueryDto, { page: "2", pageSize: "100" }))).toEqual([]);
    for (const query of [{ page: "0" }, { page: "1.5" }, { page: "NaN" }, { pageSize: "0" }, { pageSize: "101" }]) {
      expect(validateSync(plainToInstance(EmployeeTimelineQueryDto, query)).length).toBeGreaterThan(0);
    }
  });
});
