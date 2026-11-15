import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsProfileFields } from "../../HrmsProfileFields";

const mocks = vi.hoisted(() => ({ profileFields: vi.fn(), updateProfileFields: vi.fn(), allowed: true }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org-a" } } }) }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: () => mocks.allowed }) }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { employees: mocks } }));
const field = {
  id: "11111111-1111-4111-8111-111111111111",
  label: "Desk",
  type: "text",
  required: false,
  archived: false,
  options: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.allowed = true;
  mocks.profileFields.mockResolvedValue({ definitions: [], version: 0 });
  mocks.updateProfileFields.mockImplementation((_org, input) =>
    Promise.resolve({ ...input, version: input.version + 1 }),
  );
});
afterEach(cleanup);
describe("organization profile field settings", () => {
  it("creates a required select definition using medium controlled fields", async () => {
    render(<HrmsProfileFields />);
    await screen.findByRole("button", { name: "Add organization field" });
    fireEvent.click(screen.getByRole("button", { name: "Add organization field" }));
    const label = screen.getByRole("textbox", { name: "Field 1 label" });
    expect(label).toHaveClass("text-sm");
    fireEvent.change(label, { target: { value: " Work arrangement " } });
    fireEvent.click(screen.getByRole("button", { name: "Field 1 type" }));
    fireEvent.click(screen.getByRole("option", { name: "Select" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Field 1 options" }), { target: { value: "Office\nRemote" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Field 1 required" }));
    fireEvent.click(screen.getByRole("button", { name: "Save field definitions" }));
    await screen.findByText("Organization profile fields saved.");
    expect(mocks.updateProfileFields).toHaveBeenCalledWith("org-a", {
      version: 0,
      definitions: [
        expect.objectContaining({
          label: "Work arrangement",
          type: "select",
          options: ["Office", "Remote"],
          required: true,
        }),
      ],
    });
    expect(screen.getByRole("button", { name: "Field 1 type" })).toBeDisabled();
  });
  it("validates required labels and retains drafts when the server rejects a stale save", async () => {
    render(<HrmsProfileFields />);
    await screen.findByRole("button", { name: "Add organization field" });
    fireEvent.click(screen.getByRole("button", { name: "Add organization field" }));
    fireEvent.click(screen.getByRole("button", { name: "Save field definitions" }));
    expect(screen.getByRole("textbox", { name: "Field 1 label" })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.updateProfileFields).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Field 1 label" }), { target: { value: "Desk" } });
    mocks.updateProfileFields.mockRejectedValueOnce(new Error("Field catalog changed"));
    fireEvent.click(screen.getByRole("button", { name: "Save field definitions" }));
    await screen.findByText("Field catalog changed");
    expect(screen.getByRole("textbox", { name: "Field 1 label" })).toHaveValue("Desk");
  });
  it("archives saved definitions instead of deleting or changing their type", async () => {
    mocks.profileFields.mockResolvedValue({ definitions: [field], version: 2 });
    render(<HrmsProfileFields />);
    await screen.findByRole("checkbox", { name: "Field 1 archived" });
    expect(screen.queryByRole("button", { name: "Remove field 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Field 1 archived" }));
    fireEvent.click(screen.getByRole("button", { name: "Save field definitions" }));
    await waitFor(() =>
      expect(mocks.updateProfileFields).toHaveBeenCalledWith("org-a", {
        definitions: [{ ...field, archived: true }],
        version: 2,
      }),
    );
  });
  it("does not load or edit the catalog without workforce management permission", () => {
    mocks.allowed = false;
    render(<HrmsProfileFields />);
    expect(screen.getByRole("alert")).toHaveTextContent("Workforce management permission is required");
    expect(mocks.profileFields).not.toHaveBeenCalled();
  });
});
