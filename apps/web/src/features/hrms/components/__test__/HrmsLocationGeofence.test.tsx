import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsLocations } from "../../HrmsLocations";

const mocks = vi.hoisted(() => ({ list: vi.fn(), update: vi.fn(), departments: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org" } } }) }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { locations: mocks } }));
vi.mock("@/services/organization-management.service", () => ({
  organizationAccessService: { departments: { list: mocks.departments } },
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue([
    {
      id: "loc",
      name: "HQ",
      code: "HQ",
      countryCode: "IN",
      city: "Delhi",
      timezone: "Asia/Kolkata",
      isActive: true,
      geofenceLatitude: 0,
      geofenceLongitude: 0,
      geofenceRadiusMeters: 200,
    },
  ]);
  mocks.departments.mockResolvedValue([]);
  mocks.update.mockResolvedValue({});
});
afterEach(cleanup);

describe("work location geofence configuration", () => {
  it("shows saved zero coordinates and validates all-or-none fence fields inline", async () => {
    render(<HrmsLocations onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit HQ" }));
    expect(screen.getByRole("textbox", { name: "Latitude" })).toHaveValue("0");
    fireEvent.change(screen.getByRole("textbox", { name: "Longitude" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("textbox", { name: "Longitude" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("All three geofence fields are required.")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("saves complete fence removal explicitly as nulls", async () => {
    render(<HrmsLocations onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit HQ" }));
    for (const name of ["Latitude", "Longitude", "Radius (meters)"]) {
      fireEvent.change(screen.getByRole("textbox", { name }), { target: { value: "" } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        "org",
        "loc",
        expect.objectContaining({
          geofenceLatitude: null,
          geofenceLongitude: null,
          geofenceRadiusMeters: null,
        }),
      ),
    );
  });

  it("rejects out-of-range coordinates and non-integer radii before submitting", async () => {
    render(<HrmsLocations onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit HQ" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Latitude" }), { target: { value: "91" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Radius (meters)" }), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("textbox", { name: "Latitude" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Radius (meters)" })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
