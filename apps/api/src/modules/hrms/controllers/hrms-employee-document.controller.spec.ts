import "reflect-metadata";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";
import { HrmsEmployeeDocumentController, HrmsDocumentLibraryController } from "./hrms-employee-document.controller";

describe("employee document endpoint access", () => {
  it.each([HrmsEmployeeDocumentController, HrmsDocumentLibraryController])(
    "requires the HRMS entitlement and workforce management permission on %p",
    (controller) => {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, controller)).toEqual({
        entitlement: "hrms.enabled",
        permission: "hrms.workforce.manage",
      });
    },
  );
});
