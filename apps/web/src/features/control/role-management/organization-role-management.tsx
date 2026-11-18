"use client";

import { useCallback, useEffect, useState } from "react";
import { organizationAccessService, organizationManagementService } from "@/services/organization-management.service";
import type { AssignableUser, Permission, Role } from "./types";
import { messageFrom } from "./utils";
import { RoleManagement } from "./role-management-layout";

export function OrganizationRoleManagement({ organizationId }: { organizationId: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loadedOrganizationId, setLoadedOrganizationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [groups, availablePermissions, members] = await Promise.all([
        organizationAccessService.permissionGroups.list(organizationId) as Promise<Role[]>,
        organizationAccessService.listPermissions(organizationId) as Promise<Permission[]>,
        organizationManagementService.listMembers(organizationId) as unknown as Promise<
          Array<{ user: AssignableUser }>
        >,
      ]);
      setRoles(groups);
      setPermissions(availablePermissions);
      setUsers(members.map((member) => member.user));
      setLoadError("");
    } catch (reason) {
      setLoadError(messageFrom(reason, "Unable to load organization roles and permissions."));
    } finally {
      setLoadedOrganizationId(organizationId);
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <RoleManagement
      key={organizationId}
      title="Roles & permissions"
      description="Configure organization permission groups, their access, and member assignments."
      noun="Permission group"
      roles={roles}
      permissions={permissions}
      users={users}
      includeKey={false}
      allowPermissionId={false}
      loadError={loadError}
      isLoading={loadedOrganizationId !== organizationId}
      onCreate={async (input) => {
        await organizationAccessService.permissionGroups.create(organizationId, input);
        await load();
      }}
      onUpdate={async (role, input) => {
        await organizationAccessService.permissionGroups.update(organizationId, role.id, input);
        await load();
      }}
      onDelete={async (role) => {
        await organizationAccessService.permissionGroups.remove(organizationId, role.id);
        await load();
      }}
      onSavePermissions={async (role, changes) => {
        // Wait for every write, including partial failures, then refresh once per batch.
        const results = await Promise.allSettled(
          changes.map(({ permission, selected }) =>
            selected
              ? organizationAccessService.permissionGroups.attachPermission(organizationId, role.id, permission.id)
              : organizationAccessService.permissionGroups.removePermission(organizationId, role.id, permission.id),
          ),
        );
        setRoles((await organizationAccessService.permissionGroups.list(organizationId)) as Role[]);
        const failed = results.find((result) => result.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
      }}
      onAssign={async (role, userId) => {
        await organizationAccessService.permissionGroups.assignUser(organizationId, role.id, userId);
        await load();
      }}
      onRevoke={async (role, userId) => {
        await organizationAccessService.permissionGroups.revokeUser(organizationId, role.id, userId);
        await load();
      }}
    />
  );
}
