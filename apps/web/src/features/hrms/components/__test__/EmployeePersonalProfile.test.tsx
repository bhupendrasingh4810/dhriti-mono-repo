import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hrmsEmployeeProfileSchema } from "@dhriti/validation";
import { EmployeePersonalProfile } from "../../workforce/employee-personal-profile";
import { EmployeeProfileDrawer } from "../../workforce/employee-profile-drawer";
import type { HrmsEmployee } from "@/services/hrms.service";

const mocks = vi.hoisted(() => ({ profile: vi.fn(), updateProfile: vi.fn() }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { employees: mocks } }));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.profile.mockResolvedValue({
    profile: hrmsEmployeeProfileSchema.parse({ preferredName: "Alex" }),
    version: 2,
    catalog: { definitions: [], version: 0 },
  });
  mocks.updateProfile.mockImplementation((_org, _id, input) =>
    Promise.resolve({ ...input, version: input.version + 1, catalog: { definitions: [], version: 0 } }),
  );
});
async function setup() {
  render(<EmployeePersonalProfile organizationId="org-a" employeeId="employee-a" />);
  await screen.findByRole("button", { name: "Edit personal profile" });
  fireEvent.click(screen.getByRole("button", { name: "Edit personal profile" }));
}
describe("employee personal profile", () => {
  it("renders typed organization fields, validates required policy and submits typed values with catalog version", async () => {
    const textId = "11111111-1111-4111-8111-111111111111";
    const numberId = "22222222-2222-4222-8222-222222222222";
    const selectId = "33333333-3333-4333-8333-333333333333";
    const checkboxId = "44444444-4444-4444-8444-444444444444";
    const dateId = "55555555-5555-4555-8555-555555555555";
    const archivedId = "66666666-6666-4666-8666-666666666666";
    mocks.profile.mockResolvedValue({
      profile: hrmsEmployeeProfileSchema.parse({ organizationFields: { [archivedId]: "History" } }),
      version: 3,
      catalog: {
        version: 7,
        definitions: [
          { id: textId, label: "Desk", type: "text", required: true, archived: false, options: [] },
          { id: numberId, label: "Experience years", type: "number", required: true, archived: false, options: [] },
          {
            id: selectId,
            label: "Work arrangement",
            type: "select",
            required: true,
            archived: false,
            options: ["Office", "Remote"],
          },
          {
            id: checkboxId,
            label: "Equipment checklist",
            type: "checkbox",
            required: true,
            archived: false,
            options: [],
          },
          { id: dateId, label: "Certificate expiry", type: "date", required: false, archived: false, options: [] },
          { id: archivedId, label: "Old desk", type: "text", required: true, archived: true, options: [] },
        ],
      },
    });
    await setup();
    expect(screen.queryByRole("textbox", { name: "Old desk" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Certificate expiry" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    expect(screen.getByRole("textbox", { name: "Desk" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox", { name: "Equipment checklist" })).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(screen.getByRole("textbox", { name: "Desk" }), { target: { value: "A12" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Experience years" }), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Work arrangement" }));
    fireEvent.click(screen.getByRole("option", { name: "Remote" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Equipment checklist" }));
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(
        "org-a",
        "employee-a",
        expect.objectContaining({
          version: 3,
          catalogVersion: 7,
          profile: expect.objectContaining({
            organizationFields: {
              [textId]: "A12",
              [numberId]: 0,
              [selectId]: "Remote",
              [checkboxId]: true,
              [archivedId]: "History",
            },
          }),
        }),
      ),
    );
  });
  it("keeps drafts when switching profile tabs and confirms before closing with unsaved changes", async () => {
    const employee: HrmsEmployee = {
      id: "employee-a",
      createdAt: "",
      updatedAt: "",
      employeeNumber: "EMP-1",
      status: "ACTIVE",
      employmentType: null,
      workLocationId: null,
      shiftId: null,
      departmentId: null,
      designationId: null,
      reportingManagerId: null,
      startDate: null,
      endDate: null,
      biometricId: null,
      user: { id: "user-a", name: "Alex", email: "alex@example.com", avatarUrl: null },
      workLocation: null,
      shift: null,
      department: null,
      designation: null,
      reportingManager: null,
    };
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EmployeeProfileDrawer employee={employee} organizationId="org-a" onClose={onClose} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Personal" }));
    await screen.findByRole("button", { name: "Edit personal profile" });
    fireEvent.click(screen.getByRole("button", { name: "Edit personal profile" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Preferred name" }), { target: { value: "New draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    fireEvent.click(screen.getByRole("button", { name: "Personal" }));
    expect(screen.getByRole("textbox", { name: "Preferred name" })).toHaveValue("New draft");
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    expect(await screen.findByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard changes" }));
    expect(onClose).toHaveBeenCalledOnce();
    confirm.mockRestore();
  });
  it("loads organization-scoped data and submits personal details, skills and custom fields with their version", async () => {
    await setup();
    expect(mocks.profile).toHaveBeenCalledWith("org-a", "employee-a");
    const name = screen.getByRole("textbox", { name: "Preferred name" });
    expect(name).toHaveClass("text-sm");
    fireEvent.change(name, { target: { value: " Alex Morgan " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Personal email" }), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Skill 1" }), { target: { value: " TypeScript " } });
    fireEvent.click(screen.getByRole("button", { name: "Add custom field" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Field 1 name" }), { target: { value: " Desk " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Field 1 value" }), { target: { value: " A12 " } });
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    await screen.findByText("Employee profile saved.");
    expect(mocks.updateProfile).toHaveBeenCalledWith(
      "org-a",
      "employee-a",
      expect.objectContaining({
        version: 2,
        catalogVersion: 0,
        profile: expect.objectContaining({
          preferredName: "Alex Morgan",
          personalEmail: "alex@example.com",
          skills: ["TypeScript"],
          customFields: [{ name: "Desk", value: "A12" }],
        }),
      }),
    );
    expect(name).toHaveAttribute("readonly");
  });
  it("validates required skill and custom field names inline and preserves unsaved values on API failure", async () => {
    await setup();
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    fireEvent.click(screen.getByRole("button", { name: "Add custom field" }));
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    expect(screen.getByRole("textbox", { name: "Skill 1" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Field 1 name" })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Skill 1" }), { target: { value: "React" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Field 1 name" }), { target: { value: "Desk" } });
    mocks.updateProfile.mockRejectedValueOnce(new Error("Employee profile changed. Reload before saving."));
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    await screen.findByText("Employee profile changed. Reload before saving.");
    expect(screen.getByRole("textbox", { name: "Skill 1" })).toHaveValue("React");
    expect(screen.getByRole("button", { name: "Reload saved profile" })).toBeEnabled();
  });
  it("cancels edits and supports clearing stored skills and custom fields", async () => {
    mocks.profile.mockResolvedValue({
      profile: hrmsEmployeeProfileSchema.parse({ skills: ["React"], customFields: [{ name: "Desk", value: "A12" }] }),
      version: 0,
      catalog: { definitions: [], version: 0 },
    });
    await setup();
    fireEvent.click(screen.getByRole("button", { name: "Remove skill 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel changes" }));
    expect(screen.getByRole("textbox", { name: "Skill 1" })).toHaveValue("React");
    fireEvent.click(screen.getByRole("button", { name: "Edit personal profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove skill 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove custom field 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Save personal profile" }));
    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith(
        "org-a",
        "employee-a",
        expect.objectContaining({
          profile: expect.objectContaining({ skills: [], customFields: [] }),
        }),
      ),
    );
  });
  it("surfaces load failures and allows retry without pretending the profile is empty", async () => {
    mocks.profile.mockRejectedValueOnce(new Error("Profile unavailable"));
    render(<EmployeePersonalProfile organizationId="org-a" employeeId="employee-a" />);
    await screen.findByText("Profile unavailable");
    expect(screen.queryByRole("button", { name: "Edit personal profile" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry profile" }));
    await screen.findByRole("button", { name: "Edit personal profile" });
  });
});
