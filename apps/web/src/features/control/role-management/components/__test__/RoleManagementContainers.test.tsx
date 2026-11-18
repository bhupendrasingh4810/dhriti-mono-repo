import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationRoleManagement } from "../../organization-role-management";
import { PlatformRoleManagement } from "../../platform-role-management";
import type { RoleManagement } from "../../role-management-layout";

type ManagementProps = ComponentProps<typeof RoleManagement>;
const mocks = vi.hoisted(() => ({
  layout: vi.fn<(props: ManagementProps) => void>(),
  groups: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    removePermission: vi.fn(),
    attachPermission: vi.fn(),
    assignUser: vi.fn(),
    revokeUser: vi.fn(),
  },
  listPermissions: vi.fn(),
  listMembers: vi.fn(),
  platform: {
    listRoles: vi.fn(),
    listRolePermissions: vi.fn(),
    listPermissions: vi.fn(),
    listUsers: vi.fn(),
    createRole: vi.fn(),
    createPermission: vi.fn(),
    updatePermission: vi.fn(),
    deletePermission: vi.fn(),
    removeRolePermission: vi.fn(),
    attachRolePermission: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
  },
}));

vi.mock("../../role-management-layout", () => ({
  RoleManagement: (props: ManagementProps) => {
    mocks.layout(props);
    return <div>{props.title}</div>;
  },
}));
vi.mock("@/services/organization-management.service", () => ({
  organizationAccessService: { permissionGroups: mocks.groups, listPermissions: mocks.listPermissions },
  organizationManagementService: { listMembers: mocks.listMembers },
}));
vi.mock("@/services/control.service", () => ({ controlPlatformService: mocks.platform }));

const permission = { id: "read", key: "hrms.employee.read" };
const role = {
  id: "members",
  name: "Members",
  description: null,
  permissions: [{ permission }],
  _count: { assignments: 0 },
};
const user = { id: "jane", name: "Jane Doe", email: "jane@example.test" };

function layout() {
  const props = mocks.layout.mock.lastCall?.[0];
  if (!props) throw new Error("Management layout was not rendered");
  return props;
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const mock of Object.values(mocks.groups)) mock.mockResolvedValue(undefined);
  for (const mock of Object.values(mocks.platform)) mock.mockResolvedValue(undefined);
  mocks.groups.list.mockResolvedValue([role]);
  mocks.listPermissions.mockResolvedValue([permission]);
  mocks.listMembers.mockResolvedValue([{ user }]);
  mocks.platform.listRoles.mockResolvedValue([role]);
  mocks.platform.listRolePermissions.mockResolvedValue([permission]);
  mocks.platform.listPermissions.mockResolvedValue([permission]);
  mocks.platform.listUsers.mockResolvedValue({ items: [user] });
});
afterEach(cleanup);

describe("organization role-management integration", () => {
  it("loads initially and on tenant changes, but never replaces the UI during permission saves", async () => {
    let finish!: (value: (typeof role)[]) => void;
    mocks.groups.list.mockImplementationOnce(
      () =>
        new Promise<(typeof role)[]>((resolve) => {
          finish = resolve;
        }),
    );
    const { rerender } = render(<OrganizationRoleManagement organizationId="org-a" />);
    expect(layout().isLoading).toBe(true);
    await waitFor(() => expect(mocks.groups.list).toHaveBeenCalledTimes(1));
    await act(async () => {
      finish([role]);
    });
    expect(layout().isLoading).toBe(false);
    await act(() => layout().onSavePermissions(role, [{ permission, selected: true }]));
    expect(layout().isLoading).toBe(false);
    mocks.groups.list.mockImplementationOnce(
      () =>
        new Promise<(typeof role)[]>((resolve) => {
          finish = resolve;
        }),
    );
    rerender(<OrganizationRoleManagement organizationId="org-b" />);
    expect(layout().isLoading).toBe(true);
    await waitFor(() => expect(mocks.groups.list).toHaveBeenCalledTimes(3));
    await act(async () => {
      finish([]);
    });
    expect(layout().isLoading).toBe(false);
    expect(layout().roles).toEqual([]);
  });

  it("loads tenant data, preserves configuration and reloads after create/update/delete", async () => {
    render(<OrganizationRoleManagement organizationId="org-a" />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    expect(mocks.groups.list).toHaveBeenCalledWith("org-a");
    expect(mocks.listMembers).toHaveBeenCalledWith("org-a");
    expect(layout()).toMatchObject({
      users: [user],
      permissions: [permission],
      includeKey: false,
      allowPermissionId: false,
      loadError: "",
    });
    await act(() => layout().onCreate({ name: "Support" }));
    expect(mocks.groups.create).toHaveBeenCalledWith("org-a", { name: "Support" });
    await act(async () => {
      await layout().onUpdate?.(role, { name: "Updated" });
    });
    expect(mocks.groups.update).toHaveBeenCalledWith("org-a", role.id, { name: "Updated" });
    await act(async () => {
      await layout().onDelete?.(role);
    });
    expect(mocks.groups.remove).toHaveBeenCalledWith("org-a", role.id);
    expect(mocks.groups.list).toHaveBeenCalledTimes(4);
  });

  it("preserves individual/bulk permission actions and user assignment payloads", async () => {
    render(<OrganizationRoleManagement organizationId="org-a" />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    await act(() => layout().onSavePermissions(role, [{ permission, selected: true }]));
    expect(mocks.groups.attachPermission).toHaveBeenCalledWith("org-a", role.id, permission.id);
    await act(() => layout().onSavePermissions(role, [{ permission, selected: false }]));
    expect(mocks.groups.removePermission).toHaveBeenCalledWith("org-a", role.id, permission.id);
    await act(() => layout().onAssign(role, user.id));
    expect(mocks.groups.assignUser).toHaveBeenCalledWith("org-a", role.id, user.id);
    await act(() => layout().onRevoke(role, user.id));
    expect(mocks.groups.revokeUser).toHaveBeenCalledWith("org-a", role.id, user.id);
  });

  it("retains explicit tenant load errors", async () => {
    mocks.groups.list.mockRejectedValue(new Error("Organization access denied"));
    render(<OrganizationRoleManagement organizationId="org-a" />);
    await waitFor(() => expect(layout().loadError).toBe("Organization access denied"));
    expect(layout().isLoading).toBe(false);
  });

  it("writes a mixed batch and refreshes only roles once, even after a partial failure", async () => {
    render(<OrganizationRoleManagement organizationId="org-a" />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    const error = new Error("Cannot attach permission");
    const added = { id: "manage", key: "hrms.employee.manage" };
    mocks.groups.attachPermission.mockRejectedValueOnce(error);
    mocks.groups.list.mockResolvedValueOnce([{ ...role, permissions: [] }]);
    await act(async () => {
      await expect(
        layout().onSavePermissions(role, [
          { permission: added, selected: true },
          { permission, selected: false },
        ]),
      ).rejects.toBe(error);
    });
    expect(mocks.groups.attachPermission).toHaveBeenCalledWith("org-a", role.id, added.id);
    expect(mocks.groups.removePermission).toHaveBeenCalledWith("org-a", role.id, permission.id);
    expect(mocks.groups.list).toHaveBeenCalledTimes(2);
    expect(mocks.listPermissions).toHaveBeenCalledTimes(1);
    expect(mocks.listMembers).toHaveBeenCalledTimes(1);
    expect(layout().roles[0].permissions).toEqual([]);
  });
});

describe("platform role-management integration", () => {
  it("keeps skeletons until all initial data loads, without showing them again during saves", async () => {
    let finish!: (value: (typeof permission)[]) => void;
    mocks.platform.listPermissions.mockImplementationOnce(
      () =>
        new Promise<(typeof permission)[]>((resolve) => {
          finish = resolve;
        }),
    );
    render(<PlatformRoleManagement />);
    expect(layout().isLoading).toBe(true);
    await waitFor(() => expect(mocks.platform.listPermissions).toHaveBeenCalledTimes(1));
    await act(async () => {
      finish([permission]);
    });
    expect(layout().isLoading).toBe(false);
    await act(() => layout().onSavePermissions(role, [{ permission, selected: true }]));
    expect(layout().isLoading).toBe(false);
  });

  it("replaces initial skeletons with a load error when platform loading fails", async () => {
    mocks.platform.listRoles.mockRejectedValueOnce(new Error("Platform access denied"));
    render(<PlatformRoleManagement />);
    await waitFor(() => expect(layout().loadError).toBe("Platform access denied"));
    expect(layout().isLoading).toBe(false);
  });

  it("loads separate assignable/catalog permissions and retains user-name fallback", async () => {
    mocks.platform.listPermissions.mockResolvedValue([{ id: "catalog", key: "platform.internal" }]);
    mocks.platform.listUsers.mockResolvedValue({ items: [{ ...user, name: null }] });
    render(<PlatformRoleManagement />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    expect(layout()).toMatchObject({
      includeKey: true,
      allowPermissionId: false,
      permissions: [permission],
      catalogPermissions: [{ id: "catalog", key: "platform.internal" }],
      users: [{ ...user, name: user.email }],
    });
    expect(mocks.platform.listUsers).toHaveBeenCalledWith({ limit: 100 });
  });

  it("preserves role creation, permission catalog mutations and reloads", async () => {
    render(<PlatformRoleManagement />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    await act(() => layout().onCreate({ name: "Support", key: "support" }));
    expect(mocks.platform.createRole).toHaveBeenCalledWith({ key: "support", name: "Support", description: undefined });
    const input = {
      key: permission.key,
      resource: "hrms.employee",
      action: "read",
      isAssignable: true,
      isSystemOnly: false,
    };
    await act(async () => {
      await layout().onCreatePermission?.(input);
    });
    expect(mocks.platform.createPermission).toHaveBeenCalledWith(input);
    const update = { resource: "hrms.employee", action: "read", isAssignable: false, isSystemOnly: true };
    await act(async () => {
      await layout().onUpdatePermission?.(permission, update);
    });
    expect(mocks.platform.updatePermission).toHaveBeenCalledWith(permission.id, update);
    await act(async () => {
      await layout().onDeletePermission?.(permission);
    });
    expect(mocks.platform.deletePermission).toHaveBeenCalledWith(permission.id);
    expect(mocks.platform.listRoles).toHaveBeenCalledTimes(5);
  });

  it("preserves platform permission toggles, assignment and revocation", async () => {
    render(<PlatformRoleManagement />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    await act(() => layout().onSavePermissions(role, [{ permission, selected: true }]));
    expect(mocks.platform.attachRolePermission).toHaveBeenCalledWith(role.id, permission.id);
    await act(() => layout().onSavePermissions(role, [{ permission, selected: false }]));
    expect(mocks.platform.removeRolePermission).toHaveBeenCalledWith(role.id, permission.id);
    await act(() => layout().onAssign(role, user.id));
    expect(mocks.platform.assignRole).toHaveBeenCalledWith(role.id, user.id);
    await act(() => layout().onRevoke(role, user.id));
    expect(mocks.platform.revokeRole).toHaveBeenCalledWith(role.id, user.id);
  });

  it("waits for all platform writes before reconciling a partially failed batch", async () => {
    render(<PlatformRoleManagement />);
    await waitFor(() => expect(layout().roles).toEqual([role]));
    const error = new Error("Cannot remove permission");
    let finish!: () => void;
    mocks.platform.attachRolePermission.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    mocks.platform.removeRolePermission.mockRejectedValueOnce(error);
    const added = { id: "manage", key: "hrms.employee.manage" };
    let operation!: Promise<void>;
    await act(async () => {
      operation = layout().onSavePermissions(role, [
        { permission: added, selected: true },
        { permission, selected: false },
      ]);
    });
    expect(mocks.platform.listRoles).toHaveBeenCalledTimes(1);
    await act(async () => {
      const assertion = expect(operation).rejects.toBe(error);
      finish();
      await assertion;
    });
    expect(mocks.platform.listRoles).toHaveBeenCalledTimes(2);
    expect(mocks.platform.listRolePermissions).toHaveBeenCalledTimes(1);
    expect(mocks.platform.listPermissions).toHaveBeenCalledTimes(1);
    expect(mocks.platform.listUsers).toHaveBeenCalledTimes(1);
  });
});
