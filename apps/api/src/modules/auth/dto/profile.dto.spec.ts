import { ValidationPipe } from "@nestjs/common";
import { UpdateProfileDto } from "./profile.dto";
import { CreateHrmsEmployeeDto, UpdateHrmsEmployeeDto } from "../../hrms/dto/hrms-employee.dto";

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
});

function validateProfile(input: Record<string, unknown>) {
  return pipe.transform(input, { type: "body", metatype: UpdateProfileDto });
}

describe("Profile validation", () => {
  it("accepts all editable personal, contact and regional fields", async () => {
    await expect(
      validateProfile({
        prefix: "Ms.",
        name: " Aditi Sharma ",
        dateOfBirth: "1995-06-15",
        gender: "Female",
        bloodGroup: "AB-",
        nationality: "Indian",
        workEmail: "aditi@company.test",
        alternateEmail: "aditi@example.test",
        isdCode: "+91",
        mobileNumber: "9876543210",
        timezone: "Asia/Kolkata",
        locale: "en",
      }),
    ).resolves.toMatchObject({ name: "Aditi Sharma", bloodGroup: "AB-" });
  });

  it.each([
    { name: null },
    { name: "   " },
    { timezone: null },
    { locale: null },
    { dateOfBirth: "2025-02-29" },
    { dateOfBirth: "2026-04-31" },
    { dateOfBirth: "1995-06-15T00:00:00Z" },
    { bloodGroup: "C+" },
    { workEmail: "not-an-email" },
    { alternateEmail: "bad" },
    { isdCode: "91" },
    { isdCode: "+0" },
    { mobileNumber: "+919876543210" },
    { mobileNumber: "123" },
    { nationality: "x".repeat(81) },
  ])("rejects invalid data: %j", async (input) => {
    await expect(validateProfile(input)).rejects.toMatchObject({ status: 400 });
  });

  it.each([
    "employeeCode",
    "employeeNumber",
    "biometricId",
    "dateOfJoining",
    "retirementDate",
    "employmentType",
    "employmentStatus",
    "dateOfResignation",
    "hrmsProfile",
    "dateOfBirthVerified",
  ])("rejects user attempts to change HR-managed or verified fields: %s", async (field) => {
    await expect(validateProfile({ [field]: "changed" })).rejects.toMatchObject({ status: 400 });
  });

  it("allows explicit clearing of optional personal details", async () => {
    const fields = {
      prefix: null,
      dateOfBirth: null,
      gender: null,
      bloodGroup: null,
      nationality: null,
      workEmail: null,
      alternateEmail: null,
      isdCode: null,
      mobileNumber: null,
    };
    await expect(validateProfile(fields)).resolves.toMatchObject(fields);
  });
});

describe("HR-managed employee lifecycle validation", () => {
  it("accepts lifecycle data on both create and update", async () => {
    const fields = { biometricId: "BIO-42", retirementDate: "2055-06-30", resignationDate: null };
    await expect(pipe.transform(fields, { type: "body", metatype: UpdateHrmsEmployeeDto })).resolves.toMatchObject(
      fields,
    );
    await expect(
      pipe.transform(
        {
          ...fields,
          userId: "11111111-1111-4111-8111-111111111111",
          employeeNumber: "EMP-42",
          status: "ACTIVE",
        },
        { type: "body", metatype: CreateHrmsEmployeeDto },
      ),
    ).resolves.toMatchObject(fields);
  });

  it.each([
    { retirementDate: "2026-02-30" },
    { resignationDate: "2026-01-01T00:00:00Z" },
    { employeeNumber: "   " },
    { employeeNumber: null },
    { biometricId: "x".repeat(65) },
  ])("rejects invalid lifecycle data: %j", async (input) => {
    await expect(pipe.transform(input, { type: "body", metatype: UpdateHrmsEmployeeDto })).rejects.toMatchObject({
      status: 400,
    });
  });
});
