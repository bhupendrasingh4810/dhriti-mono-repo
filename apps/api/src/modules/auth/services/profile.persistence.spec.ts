import { randomInt, randomUUID } from "node:crypto";
import { Test, type TestingModule } from "@nestjs/testing";
import { ApiConfigService } from "../../../config/config.service";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { HrmsEmployeeService } from "../../hrms/services/hrms-employee.service";
import { ProfileService } from "./profile.service";

const databaseTests = process.env.PROFILE_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("Profile database persistence", () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let profiles: ProfileService;
  let employees: HrmsEmployeeService;
  const userId = randomUUID();
  const secondUserId = randomUUID();
  const organizationId = randomUUID();
  const mobileNumber = String(randomInt(1000000000, 9999999999));
  let employeeId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for profile persistence tests");
    }
    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        ProfileService,
        HrmsEmployeeService,
        { provide: ApiConfigService, useValue: { databaseUrl: process.env.DATABASE_URL, isProduction: false } },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();
    prisma = module.get(PrismaService);
    profiles = module.get(ProfileService);
    employees = module.get(HrmsEmployeeService);
    await prisma.$connect();
    await prisma.user.createMany({
      data: [
        { id: userId, name: "Profile persistence test", email: `profile-${userId}@example.test`, status: "ACTIVE" },
        {
          id: secondUserId,
          name: "Profile rollback test",
          email: `profile-${secondUserId}@example.test`,
          status: "ACTIVE",
        },
      ],
    });
    await prisma.organization.create({
      data: { id: organizationId, name: "Profile test fixture", slug: `profile-test-${organizationId}` },
    });
    await prisma.organizationMember.create({ data: { organizationId, userId } });
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await prisma.organization.deleteMany({ where: { id: organizationId } });
        await prisma.user.deleteMany({ where: { id: { in: [userId, secondUserId] } } });
      } finally {
        await prisma.$disconnect();
      }
    }
    if (module) {
      await module.close();
    }
  });

  it("persists every requested field through the personal and HR services and reloads them from PostgreSQL", async () => {
    const employee = await employees.create(organizationId, userId, {
      userId,
      employeeNumber: "EMP-PROFILE-TEST",
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      startDate: "2020-01-15",
      biometricId: "BIO-PROFILE-TEST",
      retirementDate: "2055-06-30",
      resignationDate: "2026-10-28",
    });
    employeeId = employee.id;
    await profiles.updateProfile(userId, {
      prefix: "Dr.",
      name: "Aditi Profile Test",
      dateOfBirth: "1995-06-15",
      gender: "Female",
      bloodGroup: "AB-",
      nationality: "Indian",
      workEmail: "work@example.test",
      alternateEmail: "alternate@example.test",
      isdCode: "+91",
      mobileNumber,
      timezone: "Asia/Kolkata",
      locale: "en-IN",
    });
    expect(await profiles.getProfile(userId)).toMatchObject({
      prefix: "Dr.",
      name: "Aditi Profile Test",
      dateOfBirth: "1995-06-15",
      gender: "Female",
      bloodGroup: "AB-",
      nationality: "Indian",
      workEmail: "work@example.test",
      alternateEmail: "alternate@example.test",
      isdCode: "+91",
      mobileNumber,
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      employeeCode: "EMP-PROFILE-TEST",
      biometricId: "BIO-PROFILE-TEST",
      dateOfJoining: "2020-01-15",
      retirementDate: "2055-06-30",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
      dateOfResignation: "2026-10-28",
    });
    const stored = await prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    expect(stored.phoneNumber).toBe(`+91${mobileNumber}`);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email).toBe(
      `profile-${userId}@example.test`,
    );
  });

  it("rolls back the name change if a contact update conflicts", async () => {
    await expect(
      profiles.updateProfile(secondUserId, {
        name: "This must not persist",
        isdCode: "+91",
        mobileNumber,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: secondUserId } })).name).toBe("Profile rollback test");
    expect(await prisma.userProfile.findUnique({ where: { userId: secondUserId } })).toBeNull();
  });

  it("persists null clearing while preserving unrelated employment and sign-in data", async () => {
    await profiles.updateProfile(userId, {
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
    await employees.update(organizationId, employeeId, userId, {
      employeeNumber: "EMP-PROFILE-UPDATED",
      biometricId: null,
      retirementDate: null,
      resignationDate: null,
    });
    expect(await profiles.getProfile(userId)).toMatchObject({
      name: "Aditi Profile Test",
      prefix: null,
      dateOfBirth: null,
      gender: null,
      bloodGroup: null,
      nationality: null,
      workEmail: null,
      alternateEmail: null,
      isdCode: null,
      mobileNumber: null,
      employeeCode: "EMP-PROFILE-UPDATED",
      biometricId: null,
      retirementDate: null,
      dateOfResignation: null,
      dateOfJoining: "2020-01-15",
      employmentType: "FULL_TIME",
      employmentStatus: "ACTIVE",
    });
  });
});
