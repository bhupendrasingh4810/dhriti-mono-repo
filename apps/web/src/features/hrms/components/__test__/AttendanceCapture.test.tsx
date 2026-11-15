import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectAttendanceCapture, getPunchPosition } from "../../attendance-capture";

const getCurrentPosition = vi.fn();
beforeEach(() => {
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: "desktop-browser" });
  getCurrentPosition.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("punch-only GPS capture", () => {
  it("never requests coordinates while enforcement is off", async () => {
    expect(await collectAttendanceCapture("REMOTE", false)).toEqual({
      mode: "REMOTE",
      source: "WEB",
      device: "DESKTOP",
    });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("requests one fresh high-accuracy reading and labels mobile browser capture", async () => {
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Mozilla Android Mobile" });
    const timestamp = Date.now();
    getCurrentPosition.mockImplementation((resolve) =>
      resolve({ coords: { latitude: 0, longitude: 0, accuracy: 75 }, timestamp }),
    );
    expect(await collectAttendanceCapture("FIELD", true)).toEqual({
      mode: "FIELD",
      source: "MOBILE_WEB",
      device: "PHONE",
      position: { latitude: 0, longitude: 0, accuracy: 75, capturedAt: new Date(timestamp).toISOString() },
    });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
  });

  it.each([
    [1, "permission denied"],
    [2, "unavailable"],
    [3, "timed out"],
  ])("surfaces geolocation error %s without fallback", async (code, message) => {
    getCurrentPosition.mockImplementation((_resolve, reject) => reject({ code }));
    await expect(getPunchPosition()).rejects.toThrow(String(message));
  });

  it("requires a secure context", async () => {
    vi.stubGlobal("isSecureContext", false);
    await expect(getPunchPosition()).rejects.toThrow("HTTPS");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
