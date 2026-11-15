import { ErrorCode } from "../../../common/errors/error-codes";
import { plainToInstance } from "class-transformer";
import { UpdateHrmsLocationDto } from "../dto/hrms-master-data.dto";
import { HrmsMasterDataService } from "./hrms-master-data.service";

function makePrisma() {
  return {
    hrmsEmploymentType: { findFirst: jest.fn(), delete: jest.fn() },
    hrmsLocation: { findFirst: jest.fn(), delete: jest.fn(), create: jest.fn(), update: jest.fn() },
    hrmsDesignation: { findFirst: jest.fn(), delete: jest.fn() },
    hrmsEmployee: { findFirst: jest.fn() },
  };
}

describe("HrmsMasterDataService", () => {
  it("requires a complete geofence and supports clearing all fields", async () => {
    const prisma = makePrisma();
    const service = new HrmsMasterDataService(prisma as never, { record: jest.fn() } as never);
    const input = { name: "Office", code: "OFFICE", countryCode: "IN", timezone: "Asia/Kolkata" };
    await expect(service.createLocation("org", "actor", { ...input, geofenceLatitude: 0 })).rejects.toMatchObject({ status: 400 });
    expect(prisma.hrmsLocation.create).not.toHaveBeenCalled();
    prisma.hrmsLocation.create.mockResolvedValue({ id: "loc" });
    await service.createLocation("org", "actor", { ...input, geofenceLatitude: 0, geofenceLongitude: 0, geofenceRadiusMeters: 200 });
    expect(prisma.hrmsLocation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organizationId: "org", geofenceLatitude: 0, geofenceLongitude: 0, geofenceRadiusMeters: 200 }),
    }));
    prisma.hrmsLocation.findFirst.mockResolvedValue({ id: "loc", geofenceLatitude: 0, geofenceLongitude: 0, geofenceRadiusMeters: 200 });
    await expect(service.updateLocation("org", "loc", "actor", { geofenceLatitude: null })).rejects.toMatchObject({ status: 400 });
    prisma.hrmsLocation.update.mockResolvedValue({ id: "loc" });
    await service.updateLocation("org", "loc", "actor", plainToInstance(UpdateHrmsLocationDto, { geofenceRadiusMeters: 300 }));
    expect(prisma.hrmsLocation.update).toHaveBeenLastCalledWith({
      where: { id: "loc" }, data: { geofenceRadiusMeters: 300 },
    });
    await service.updateLocation("org", "loc", "actor", { geofenceLatitude: null, geofenceLongitude: null, geofenceRadiusMeters: null });
    expect(prisma.hrmsLocation.update).toHaveBeenCalledWith({
      where: { id: "loc" }, data: { geofenceLatitude: null, geofenceLongitude: null, geofenceRadiusMeters: null },
    });
  });
  it("does not delete an employment type that is referenced by an active employee in the organization", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmploymentType.findFirst.mockResolvedValue({ id: "type-a", name: "Full-time", code: "FULL_TIME" });
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsMasterDataService(prisma as never, { record: jest.fn() } as never);

    await expect(service.removeEmploymentType("org-a", "type-a", "actor-a")).rejects.toMatchObject({
      code: ErrorCode.HRMS_EMPLOYMENT_TYPE_IN_USE,
      status: 409,
    });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-a",
        deletedAt: null,
        OR: [{ employmentType: "Full-time" }, { employmentType: "FULL_TIME" }],
      },
      select: { id: true },
    });
    expect(prisma.hrmsEmploymentType.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced tenant employment type and audits the deletion", async () => {
    const prisma = makePrisma();
    const audit = { record: jest.fn() };
    prisma.hrmsEmploymentType.findFirst.mockResolvedValue({ id: "type-a", name: "Full-time", code: null });
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const service = new HrmsMasterDataService(prisma as never, audit as never);

    await expect(service.removeEmploymentType("org-a", "type-a", "actor-a")).resolves.toBeUndefined();
    expect(prisma.hrmsEmploymentType.delete).toHaveBeenCalledWith({ where: { id: "type-a" } });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "hrms.employment_type.deleted",
        organizationId: "org-a",
        actorUserId: "actor-a",
        resourceType: "HrmsEmploymentType",
        resourceId: "type-a",
      }),
    );
  });

  it("does not delete a location assigned to an active employee", async () => {
    const prisma = makePrisma();
    prisma.hrmsLocation.findFirst.mockResolvedValue({ id: "location-a" });
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsMasterDataService(prisma as never, { record: jest.fn() } as never);

    await expect(service.removeLocation("org-a", "location-a", "actor-a")).rejects.toMatchObject({
      code: ErrorCode.HRMS_LOCATION_IN_USE,
      status: 409,
    });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org-a", workLocationId: "location-a", deletedAt: null },
      select: { id: true },
    });
    expect(prisma.hrmsLocation.delete).not.toHaveBeenCalled();
  });

  it("deletes an unreferenced designation and audits the deletion", async () => {
    const prisma = makePrisma();
    const audit = { record: jest.fn() };
    prisma.hrmsDesignation.findFirst.mockResolvedValue({ id: "designation-a" });
    const service = new HrmsMasterDataService(prisma as never, audit as never);

    await expect(service.removeDesignation("org-a", "designation-a", "actor-a")).resolves.toBeUndefined();
    expect(prisma.hrmsDesignation.delete).toHaveBeenCalledWith({ where: { id: "designation-a" } });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "hrms.designation.deleted",
        resourceType: "HrmsDesignation",
      }),
    );
  });
});
