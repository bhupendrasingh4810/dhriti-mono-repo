import { Test } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { ErrorCode } from "../../../common/errors/error-codes";
import { ProfileService } from "./profile.service";

function makeUser() {
  return {
    id: "profile-user",
    name: "Aditi Sharma",
    email: "aditi@example.test",
    avatarUrl: null,
    role: "EMPLOYEE",
    status: "ACTIVE",
    createdAt: new Date("2026-10-01T00:00:00Z"),
    deletedAt: null,
    isPlatformUser: false,
    auth: null,
    profile: {
      prefix: "Ms.",
      workEmail: "aditi@company.test",
      alternateEmail: "aditi.personal@example.test",
      isdCode: "+91",
      phoneNumber: "+919876543210",
      timezone: "Asia/Kolkata",
      locale: "en",
    },
    hrmsProfile: {
      dateOfBirth: new Date("1995-06-15T00:00:00Z"),
      dateOfBirthVerified: true,
      gender: "Female",
      bloodGroup: "O+",
      nationality: "Indian",
      salary: "private",
    },
  };
}

function makeEmployee() {
  return {
    id: "employee-1",
    employeeNumber: "EMP-42",
    biometricId: "BIO-42",
    startDate: new Date("2026-10-01T00:00:00Z"),
    retirementDate: new Date("2055-06-30T00:00:00Z"),
    resignationDate: null,
    employmentType: "FULL_TIME",
    status: "ACTIVE",
  };
}

function makePrisma() {
  const transaction = {
    user: { findUnique: jest.fn().mockResolvedValue(makeUser()), update: jest.fn() },
    userProfile: { upsert: jest.fn() },
    userHRMSProfile: { upsert: jest.fn() },
    userAuth: { updateMany: jest.fn() },
  };
  return {
    ...transaction,
    hrmsEmployee: { findFirst: jest.fn().mockResolvedValue(makeEmployee()) },
    organizationMember: {
      findFirst: jest.fn().mockResolvedValue({ organization: { id: "org-1", name: "Studio", slug: "studio" } }),
    },
    $transaction: jest.fn(async (work: (client: typeof transaction) => Promise<void>) => work(transaction)),
  };
}

describe("ProfileService", () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: ProfileService;

  beforeEach(async () => {
    prisma = makePrisma();
    const module = await Test.createTestingModule({
      providers: [ProfileService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ProfileService);
  });

  it("returns all requested fields, date-only dates, separate contact emails, and a split international phone number", async () => {
    const profile = await service.getProfile("profile-user");
    expect(profile).toMatchObject({
      prefix: "Ms.",
      name: "Aditi Sharma",
      employeeCode: "EMP-42",
      dateOfBirth: "1995-06-15",
      gender: "Female",
      bloodGroup: "O+",
      nationality: "Indian",
      email: "aditi@example.test",
      workEmail: "aditi@company.test",
      alternateEmail: "aditi.personal@example.test",
      isdCode: "+91",
      mobileNumber: "9876543210",
      biometricId: "BIO-42",
      dateOfJoining: "2026-10-01",
      retirementDate: "2055-06-30",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      dateOfResignation: null,
      timezone: "Asia/Kolkata",
      locale: "en",
    });
    expect(profile).not.toHaveProperty("salary");
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith({
      where: { userId: "profile-user", organizationId: "org-1", deletedAt: null },
    });
  });

  it("returns explicit nulls for missing optional data and never invents an employment status", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...makeUser(), profile: null, hrmsProfile: null });
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const profile = await service.getProfile("profile-user");
    for (const key of [
      "prefix",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "nationality",
      "workEmail",
      "alternateEmail",
      "isdCode",
      "mobileNumber",
      "employeeCode",
      "biometricId",
      "dateOfJoining",
      "retirementDate",
      "employmentType",
      "employmentStatus",
      "dateOfResignation",
    ]) {
      expect(profile).toHaveProperty(key, null);
    }
    expect(profile.timezone).toBe("UTC");
    expect(profile.locale).toBe("en");
  });

  it("does not read employment data when the user has no organization", async () => {
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    expect((await service.getProfile("profile-user")).employeeCode).toBeNull();
    expect(prisma.hrmsEmployee.findFirst).not.toHaveBeenCalled();
  });

  it("atomically persists personal and contact data, reusing existing profile extensions", async () => {
    await service.updateProfile("profile-user", {
      name: "Aditi S.",
      prefix: "Dr.",
      dateOfBirth: "1996-06-15",
      gender: "Female",
      bloodGroup: "A+",
      nationality: "Indian",
      workEmail: "aditi.s@company.test",
      alternateEmail: null,
      isdCode: "+44",
      mobileNumber: "7700900000",
      timezone: "Europe/London",
      locale: "en-GB",
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "profile-user" }, data: { name: "Aditi S." } });
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "profile-user" },
      create: {
        userId: "profile-user",
        prefix: "Dr.",
        workEmail: "aditi.s@company.test",
        alternateEmail: null,
        isdCode: "+44",
        phoneNumber: "+447700900000",
        timezone: "Europe/London",
        locale: "en-GB",
      },
      update: {
        prefix: "Dr.",
        workEmail: "aditi.s@company.test",
        alternateEmail: null,
        isdCode: "+44",
        phoneNumber: "+447700900000",
        timezone: "Europe/London",
        locale: "en-GB",
      },
    });
    expect(prisma.userHRMSProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          dateOfBirth: new Date("1996-06-15T00:00:00Z"),
          dateOfBirthVerified: false,
          gender: "Female",
          bloodGroup: "A+",
          nationality: "Indian",
        },
      }),
    );
  });

  it("preserves DOB verification when an unchanged birthday is submitted", async () => {
    await service.updateProfile("profile-user", { dateOfBirth: "1995-06-15" });
    const update = prisma.userHRMSProfile.upsert.mock.calls[0][0].update;
    expect(update).not.toHaveProperty("dateOfBirthVerified");
  });

  it("clears phone verification only when the international phone number changes", async () => {
    await service.updateProfile("profile-user", { isdCode: "+91", mobileNumber: "9876543210" });
    expect(prisma.userAuth.updateMany).not.toHaveBeenCalled();
    await service.updateProfile("profile-user", { isdCode: "+44", mobileNumber: "7700900000" });
    expect(prisma.userAuth.updateMany).toHaveBeenCalledWith({
      where: { userId: "profile-user" },
      data: { phoneVerifiedAt: null },
    });
  });

  it("clears optional personal and contact fields with null without touching employment data", async () => {
    await service.updateProfile("profile-user", {
      prefix: null,
      dateOfBirth: null,
      gender: null,
      bloodGroup: null,
      nationality: null,
      workEmail: null,
      alternateEmail: null,
      isdCode: null,
      mobileNumber: null,
    });
    expect(prisma.userProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { prefix: null, workEmail: null, alternateEmail: null, isdCode: null, phoneNumber: null },
      }),
    );
    expect(prisma.userHRMSProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { dateOfBirth: null, dateOfBirthVerified: false, gender: null, bloodGroup: null, nationality: null },
      }),
    );
  });

  it.each([
    { isdCode: "+91" },
    { mobileNumber: "9876543210" },
    { isdCode: null, mobileNumber: "9876543210" },
    { isdCode: "+91", mobileNumber: "12345678901234" },
    { dateOfBirth: "2999-01-01" },
  ])("rejects invalid cross-field values before mutating data: %j", async (input) => {
    await expect(service.updateProfile("profile-user", input)).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      status: 400,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects deleted users before any write", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...makeUser(), deletedAt: new Date() });
    await expect(service.updateProfile("profile-user", { name: "New name" })).rejects.toMatchObject({
      code: ErrorCode.USER_NOT_FOUND,
      status: 404,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("surfaces a duplicate mobile number as a conflict and rethrows unexpected database failures", async () => {
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6" }),
    );
    await expect(
      service.updateProfile("profile-user", { isdCode: "+91", mobileNumber: "9876543211" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "This mobile number is already registered",
    });
    const error = new Error("Database unavailable");
    prisma.$transaction.mockRejectedValueOnce(error);
    await expect(service.updateProfile("profile-user", { prefix: "Dr." })).rejects.toBe(error);
  });
});
