import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceClockPanel } from "../attendance-clock-panel";

const mocks = vi.hoisted(() => ({
  today: vi.fn(),
  clockIn: vi.fn(),
  clockOut: vi.fn(),
  startBreak: vi.fn(),
  endBreak: vi.fn(),
  getCurrentPosition: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org" } } }) }));
vi.mock("@/features/hrms/use-my-shift", () => ({ useMyShift: () => ({ shift: null, loading: false }) }));
vi.mock("@/features/settings/use-app-settings", () => ({ useAppSettings: () => null }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { attendanceSelf: mocks } }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: mocks.getCurrentPosition },
  });
  mocks.today.mockResolvedValue({
    employeeId: "employee",
    record: null,
    capturePolicy: { enabled: true, maxAccuracyMeters: 100, workLocation: { name: "HQ", configured: true } },
  });
  mocks.getCurrentPosition.mockImplementation((resolve) =>
    resolve({
      coords: { latitude: 0, longitude: 0, accuracy: 10 },
      timestamp: Date.now(),
    }),
  );
  mocks.clockIn.mockImplementation((_org, _date, capture) =>
    Promise.resolve({
      id: "record",
      checkIn: new Date().toISOString(),
      checkOut: null,
      breakMinutes: 0,
      breakStartedAt: null,
      checkInCapture: { ...capture, validation: "GEOFENCE_ACCEPTED", fence: null },
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("attendance clock GPS controls", () => {
  it("requests GPS only after a punch and submits the explicitly chosen work mode", async () => {
    render(<AttendanceClockPanel />);
    const clockIn = await screen.findByRole("button", { name: "Clock in" });
    await waitFor(() => expect(clockIn).toBeEnabled());
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Work mode" }));
    fireEvent.click(screen.getByRole("option", { name: "Field" }));
    fireEvent.click(clockIn);
    await waitFor(() =>
      expect(mocks.clockIn).toHaveBeenCalledWith(
        "org",
        expect.any(String),
        expect.objectContaining({
          mode: "FIELD",
          source: "WEB",
          position: expect.objectContaining({ latitude: 0, longitude: 0, accuracy: 10 }),
        }),
      ),
    );
    expect(await screen.findByText(/In: Field/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Work mode" })).toBeDisabled();
  });

  it("shows a denied-permission error and never submits a fallback punch", async () => {
    mocks.getCurrentPosition.mockImplementation((_resolve, reject) => reject({ code: 1 }));
    render(<AttendanceClockPanel />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Clock in" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Location permission denied");
    expect(mocks.clockIn).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Clock in" })).toBeEnabled();
  });

  it("keeps existing clocking usable without requesting location while GPS is disabled", async () => {
    mocks.today.mockResolvedValue({
      record: null,
      capturePolicy: { enabled: false, maxAccuracyMeters: 100, workLocation: null },
    });
    render(<AttendanceClockPanel />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Clock in" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    await waitFor(() => expect(mocks.clockIn).toHaveBeenCalled());
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
    expect(mocks.clockIn.mock.calls[0][2]).not.toHaveProperty("position");
  });

  it("gets another GPS reading for clock-out and retains the original work mode", async () => {
    const record = {
      id: "record",
      checkIn: new Date().toISOString(),
      checkOut: null,
      breakMinutes: 0,
      breakStartedAt: null,
      checkInCapture: {
        mode: "REMOTE",
        source: "MOBILE_WEB",
        device: "PHONE",
        validation: "GPS_ACCEPTED",
      },
    };
    mocks.today.mockResolvedValue({
      record,
      capturePolicy: { enabled: true, maxAccuracyMeters: 100, workLocation: null },
    });
    mocks.clockOut.mockResolvedValue({ ...record, checkOut: new Date().toISOString() });
    render(<AttendanceClockPanel />);
    const clockOut = await screen.findByRole("button", { name: "Clock out" });
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(clockOut);
    await waitFor(() => expect(mocks.clockOut).toHaveBeenCalledWith(
      "org",
      expect.objectContaining({ mode: "REMOTE", position: expect.objectContaining({ accuracy: 10 }) }),
    ));
    expect(mocks.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Day complete")).toBeInTheDocument();
  });

  it("shows server accuracy rejection without claiming a successful clock-in", async () => {
    mocks.clockIn.mockRejectedValue(new Error("GPS accuracy must be 100 meters or better."));
    render(<AttendanceClockPanel />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Clock in" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("GPS accuracy must be 100 meters or better");
    expect(screen.queryByRole("button", { name: "Clock out" })).not.toBeInTheDocument();
  });
});
