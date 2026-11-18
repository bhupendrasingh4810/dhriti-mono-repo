import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PermissionCatalogDrawer,
  PermissionEditor,
  RoleAssignment,
  RoleCreationForm,
  RoleList,
  RoleManagement,
  type Permission,
  type Role,
} from "../../role-management";

afterEach(cleanup);

const permissions: Permission[] = [
  { id: "read", key: "hrms.employee.read", productKey: "hrms", resource: "hrms.employee", action: "read" },
  { id: "manage", key: "hrms.employee.manage", productKey: "hrms", resource: "hrms.employee", action: "manage" },
  { id: "channel", key: "connect.channel.read", productKey: "connect" },
];
const users = [
  { id: "jane", name: "Jane Doe", email: "jane@example.test" },
  { id: "john", name: "John Smith", email: "john@example.test" },
];
const role: Role = {
  id: "members",
  name: "Members",
  description: "Everyday employee access",
  permissions: [{ permission: permissions[0] }],
  assignments: [{ user: { ...users[0], profile: { jobTitle: "Engineer" } } }],
  _count: { assignments: 1 },
};

describe("reusable role-management controls", () => {
  it("preserves role search, selection, editing and empty states", () => {
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    render(
      <RoleList roles={[role]} selectedId={role.id} onSelect={onSelect} onEdit={onEdit} noun="Permission group" />,
    );
    const select = screen.getByRole("button", { name: /Members.*1 assignments/ });
    expect(select).toHaveAttribute("type", "button");
    expect(select).toHaveClass("!block", "!bg-transparent", "!text-inherit");
    fireEvent.click(select);
    expect(onSelect).toHaveBeenCalledWith(role.id);
    fireEvent.click(screen.getByRole("button", { name: "Edit Members" }));
    expect(onEdit).toHaveBeenCalledWith(role);
    fireEvent.change(screen.getByRole("textbox", { name: "Search permission groups" }), {
      target: { value: "unknown" },
    });
    expect(screen.getByText("No permission groups match your search.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search permission groups" }), {
      target: { value: "employee" },
    });
    expect(screen.getByRole("button", { name: /Members.*1 assignments/ })).toBeInTheDocument();
  });

  it("validates creation fields, trims the payload and retains the responsive drawer", async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(<RoleCreationForm noun="Platform role" includeKey isOpen onClose={onClose} onCreate={onCreate} />);
    expect(screen.getByRole("dialog")).toHaveClass("h-full", "w-full", "max-w-xl");
    const submit = screen.getByRole("button", { name: "Create Platform role" });
    expect(submit).toHaveAttribute("type", "submit");
    fireEvent.click(submit);
    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Key is required.")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: " Support " } });
    fireEvent.change(screen.getByRole("textbox", { name: /Key/ }), { target: { value: " support " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), { target: { value: " Help users " } });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({ name: "Support", key: "support", description: "Help users" }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("does not close the creation form when creation fails", async () => {
    const onClose = vi.fn();
    render(
      <RoleCreationForm
        noun="Permission group"
        includeKey={false}
        isOpen
        onClose={onClose}
        onCreate={vi.fn().mockResolvedValue(false)}
      />,
    );
    expect(screen.queryByRole("textbox", { name: /Key/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Members" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Permission group" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Create Permission group" })).toBeEnabled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /Name/ })).toHaveValue("Members");
  });

  it("preserves permission search, individual toggles, filtered group selection and global selection", () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    const onToggleMany = vi.fn().mockResolvedValue(undefined);
    render(
      <PermissionEditor
        role={role}
        permissions={permissions}
        allowPermissionId={false}
        onToggle={onToggle}
        onToggleMany={onToggleMany}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Remove hrms.employee.read" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Add hrms.employee.manage" }));
    expect(onToggle).toHaveBeenCalledWith(permissions[1], false);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select all" })[0]);
    expect(onToggleMany).toHaveBeenLastCalledWith(permissions, false);
    fireEvent.change(screen.getByRole("textbox", { name: "Search permissions" }), { target: { value: "manage" } });
    expect(screen.queryByRole("checkbox", { name: "Add connect.channel.read" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select all" })[1]);
    expect(onToggleMany).toHaveBeenLastCalledWith([permissions[1]], false);
  });

  it("keeps optional permission-ID attachment as a form submission", async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(
      <PermissionEditor role={role} permissions={[]} allowPermissionId onToggle={onToggle} onToggleMany={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Permission ID" }), { target: { value: " custom-id " } });
    fireEvent.click(screen.getByRole("button", { name: "Attach" }));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith({ id: "custom-id", key: "custom-id" }, false));
    expect(screen.getByRole("textbox", { name: "Permission ID" })).toHaveValue("");
  });

  it("keeps assignment search, member selection and explicit revoke confirmation", async () => {
    const onAssign = vi.fn().mockResolvedValue(undefined);
    const onRevoke = vi.fn().mockResolvedValue(undefined);
    render(<RoleAssignment role={role} users={users} onAssign={onAssign} onRevoke={onRevoke} />);
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add member" }));
    expect(screen.queryByRole("checkbox", { name: "Select Jane Doe" })).not.toBeInTheDocument();
    const add = screen.getByRole("button", { name: "Add members" });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Find members to add" }), { target: { value: "John" } });
    fireEvent.click(screen.getByText("John Smith"));
    fireEvent.click(screen.getByRole("button", { name: "Add 1 member" }));
    await waitFor(() => expect(onAssign).toHaveBeenCalledWith("john"));
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Find members to add" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Revoke Members from Jane Doe" }));
    expect(onRevoke).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Revoke access?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke access" }));
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith("jane"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.change(screen.getByRole("textbox", { name: "Search assignees" }), { target: { value: "unknown" } });
    expect(screen.getByText("No assignees found.")).toBeInTheDocument();
  });

  it("preserves catalog creation validation, checkbox values and immutable permission keys", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <PermissionCatalogDrawer
        isOpen
        permissions={permissions}
        onClose={vi.fn()}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Permission" }));
    fireEvent.click(screen.getByRole("button", { name: "Save permission" }));
    expect(screen.getByText("Key is required.")).toBeInTheDocument();
    expect(screen.getByText("Resource is required.")).toBeInTheDocument();
    expect(screen.getByText("Action is required.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Permission key/ }), {
      target: { value: "hrms.settings.manage" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /Resource/ }), { target: { value: "hrms.settings" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Action/ }), { target: { value: "manage" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "System-only permission" }));
    fireEvent.click(screen.getByRole("button", { name: "Save permission" }));
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "hrms.settings.manage",
          resource: "hrms.settings",
          action: "manage",
          isAssignable: true,
          isSystemOnly: true,
        }),
      ),
    );
    await screen.findByRole("button", { name: "Edit hrms.employee.read" });
    fireEvent.click(screen.getByRole("button", { name: "Edit hrms.employee.read" }));
    expect(screen.getByRole("textbox", { name: /Permission key/ })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save permission" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(permissions[0], expect.objectContaining({ description: "Updated" })),
    );
    expect(onUpdate.mock.calls[0][1]).not.toHaveProperty("key");
  });

  it("preserves catalog search and deletion callbacks", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <PermissionCatalogDrawer
        isOpen
        permissions={permissions}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole("heading", { name: "Permission catalog (3)" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search permissions" }), { target: { value: "manage" } });
    expect(screen.getByRole("heading", { name: "Permission catalog (3)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete hrms.employee.read" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete hrms.employee.manage" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(permissions[1]));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

const layoutProps = () => ({
  title: "Roles & permissions",
  description: "Configure access",
  noun: "Permission group",
  roles: [role],
  permissions,
  users,
  includeKey: false,
  allowPermissionId: false,
  loadError: "",
  onCreate: vi.fn().mockResolvedValue(undefined),
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn().mockResolvedValue(undefined),
  onSavePermissions: vi.fn().mockResolvedValue(undefined),
  onAssign: vi.fn().mockResolvedValue(undefined),
  onRevoke: vi.fn().mockResolvedValue(undefined),
});

describe("shared management layout", () => {
  it("shows accessible skeleton panels until loading completes, without empty-state flashes", () => {
    const props = layoutProps();
    const { rerender } = render(<RoleManagement {...props} roles={[]} isLoading />);
    const status = screen.getByRole("status", { name: "Loading roles and permissions", busy: true });
    expect(status.querySelector('[aria-hidden="true"]')).toHaveClass("motion-safe:animate-pulse");
    expect(screen.queryByText("Select a role")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save permissions" })).not.toBeInTheDocument();
    rerender(<RoleManagement {...props} isLoading={false} />);
    expect(screen.queryByRole("status", { name: "Loading roles and permissions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save permissions" })).toBeInTheDocument();
  });

  it("keeps the permission grid mounted, editable and scrolled throughout a save", async () => {
    const props = layoutProps();
    let finish!: () => void;
    props.onSavePermissions.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { rerender } = render(<RoleManagement {...props} />);
    const search = screen.getByRole("textbox", { name: "Search permissions" });
    fireEvent.change(search, { target: { value: "hrms" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Add hrms.employee.manage" }));
    const checkbox = screen.getByRole("checkbox", { name: "Remove hrms.employee.manage" });
    const scrollPanel = checkbox.closest(".overflow-y-auto");
    expect(scrollPanel).not.toBeNull();
    if (!scrollPanel) throw new Error("Missing permission scroll panel");
    scrollPanel.scrollTop = 120;
    fireEvent.click(screen.getByRole("button", { name: "Save permissions" }));
    expect(screen.queryByRole("status", { name: "Loading roles and permissions" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save permissions" })).toHaveAttribute("aria-busy", "true");
    expect(checkbox).toBeEnabled();
    expect(checkbox.closest("label")).not.toHaveClass("opacity-60");
    expect(screen.getAllByRole("checkbox").every((control) => !control.hasAttribute("disabled"))).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: "Remove hrms.employee.read" }));
    // The roles refresh arrives before the save promise resolves, as in both containers.
    rerender(
      <RoleManagement
        {...props}
        roles={[{ ...role, permissions: [...role.permissions, { permission: permissions[1] }] }]}
      />,
    );
    await act(async () => {
      finish();
    });
    expect(screen.getByRole("checkbox", { name: "Remove hrms.employee.manage" })).toBe(checkbox);
    expect(screen.getByRole("checkbox", { name: "Add hrms.employee.read" })).not.toBeChecked();
    expect(search).toHaveValue("hrms");
    expect(checkbox.closest(".overflow-y-auto")).toBe(scrollPanel);
    expect(scrollPanel.scrollTop).toBe(120);
    expect(screen.getByRole("button", { name: "Save permissions" })).toBeEnabled();
    expect(props.onSavePermissions).toHaveBeenCalledTimes(1);
  });

  it("updates selections locally and only saves on click, then shows a success toast", async () => {
    const props = layoutProps();
    const { container } = render(<RoleManagement {...props} />);
    expect(container.querySelector(".xl\\:grid-cols-\\[280px_minmax\\(0\\,1fr\\)\\]")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Add hrms.employee.manage" }));
    expect(screen.getByRole("checkbox", { name: "Remove hrms.employee.manage" })).toBeChecked();
    expect(props.onSavePermissions).not.toHaveBeenCalled();
    expect(screen.queryByText("Saving permission changes…")).not.toBeInTheDocument();
    expect(screen.queryByText("Permissions saved successfully.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save permissions" }));
    await waitFor(() =>
      expect(props.onSavePermissions).toHaveBeenCalledWith(expect.objectContaining({ id: role.id }), [
        { permission: permissions[1], selected: true },
      ]),
    );
    expect(await screen.findByText("Permissions saved successfully.")).toBeInTheDocument();
  });

  it("retains failed permission changes for retry and never shows a success toast", async () => {
    const props = layoutProps();
    props.onSavePermissions.mockRejectedValue(new Error("Cannot save permissions"));
    render(<RoleManagement {...props} />);
    expect(screen.getByRole("button", { name: "Save permissions" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Add hrms.employee.manage" }));
    fireEvent.click(screen.getByRole("button", { name: "Save permissions" }));
    expect(await screen.findByText("Cannot save permissions")).toBeInTheDocument();
    expect(screen.queryByText("Permissions saved successfully.")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Remove hrms.employee.manage" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save permissions" })).toBeEnabled();
  });

  it("validates edits, preserves the update payload, and closes after success", async () => {
    const props = layoutProps();
    render(<RoleManagement {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Members" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: " New name " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(props.onUpdate).toHaveBeenCalledWith(role, { name: "New name", description: role.description }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not offer deletion for a system group", () => {
    const props = layoutProps();
    render(<RoleManagement {...props} roles={[{ ...role, isSystem: true }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Members" }));
    expect(screen.queryByRole("button", { name: "Delete Members" })).not.toBeInTheDocument();
  });

  it("keeps the creation drawer open and reports API failures", async () => {
    const props = layoutProps();
    props.onCreate.mockRejectedValue(new Error("Name already exists"));
    render(<RoleManagement {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "New Permission group" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), { target: { value: "Members" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Permission group" }));
    expect(await screen.findByText("Name already exists")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
