import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { AppSettingsService } from "../../settings/app-settings.service";
import { HrmsAttendanceClockService } from "./hrms-attendance-clock.service";
import { HrmsAttendanceRegularizationService } from "./hrms-attendance-regularization.service";

// Explicit opt-in; all synthetic database fixtures, settings and evidence roll back.
const databaseTest = process.env.HRMS_GPS_DB_INTEGRATION === "true" ? describe : describe.skip;

databaseTest("GPS attendance persistence", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());

  it("enforces saved policy, retains original evidence through corrections, and isolates organizations", async () => {
    const rollback = new Error("Rollback GPS fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(operation: (client: Prisma.TransactionClient) => Promise<T>) => operation(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic GPS fixture", slug: `gps-test-${randomUUID()}` },
          });
          const user = await tx.user.create({
            data: { name: "Synthetic employee", email: `${randomUUID()}@gps.example.test` },
          });
          const settings = new AppSettingsService(transactional as never);
          expect((await settings.get("hrms", org.id)).attendanceGpsEnabled).toBe(false);
          const location = await tx.hrmsLocation.create({
            data: {
              organizationId: org.id,
              name: "GPS test office",
              code: "OFFICE",
              countryCode: "IN",
              timezone: "UTC",
              geofenceLatitude: 0,
              geofenceLongitude: 0,
              geofenceRadiusMeters: 200,
            },
          });
          const employee = await tx.hrmsEmployee.create({
            data: {
              organizationId: org.id,
              userId: user.id,
              employeeNumber: "GPS-1",
              status: "ACTIVE",
              workLocationId: location.id,
            },
          });
          await tx.hrmsOrganizationSettings.update({
            where: { organizationId: org.id },
            data: { attendanceGpsEnabled: true },
          });
          const clock = new HrmsAttendanceClockService(transactional as never, settings);
          const date = new Date().toISOString().slice(0, 10);
          const capture = {
            mode: "OFFICE" as const,
            source: "MOBILE_WEB" as const,
            device: "PHONE" as const,
            position: { latitude: 0, longitude: 0, accuracy: 100, capturedAt: new Date().toISOString() },
          };
          await expect(clock.clockIn(org.id, user.id, date)).rejects.toMatchObject({ status: 400 });
          expect(await tx.hrmsAttendanceRecord.count({ where: { employeeId: employee.id } })).toBe(0);
          expect((await clock.today(org.id, user.id, date)).capturePolicy.workLocation).toEqual({
            name: location.name,
            configured: true,
          });
          await clock.clockIn(org.id, user.id, date, capture);
          await expect(
            clock.clockOut(org.id, user.id, { ...capture, position: { ...capture.position, latitude: 1 } }),
          ).rejects.toMatchObject({ status: 400 });
          const out = await clock.clockOut(org.id, user.id, capture);
          expect(out.checkInCapture).toMatchObject({
            validation: "GEOFENCE_ACCEPTED",
            fence: { locationId: location.id },
          });
          expect(out.checkOutCapture).toMatchObject({ validation: "GEOFENCE_ACCEPTED" });

          const checkIn = new Date(Date.now() - 3600000);
          const request = await tx.hrmsAttendanceRegularization.create({
            data: {
              organizationId: org.id,
              employeeId: employee.id,
              date: new Date(date),
              type: "OTHER",
              reason: "Synthetic correction",
              requestedCheckIn: checkIn,
            },
          });
          const regularizations = new HrmsAttendanceRegularizationService(
            transactional as never,
            { record: jest.fn() } as never,
          );
          await regularizations.decide(org.id, request.id, user.id, "APPROVED", "Synthetic approval");
          const corrected = await tx.hrmsAttendanceRecord.findUniqueOrThrow({ where: { id: out.id } });
          expect(corrected.checkIn).toEqual(checkIn);
          expect(corrected.checkInCapture).toEqual(out.checkInCapture);
          expect(corrected.checkOutCapture).toEqual(out.checkOutCapture);
          const foreign = await tx.organization.create({
            data: { name: "Other synthetic tenant", slug: `gps-test-${randomUUID()}` },
          });
          await expect(clock.records(foreign.id, user.id)).rejects.toMatchObject({ status: 404 });
          throw rollback;
        },
        { timeout: 30000 },
      ),
    ).rejects.toBe(rollback);
  });
});
