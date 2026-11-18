"use client";

import { useCallback, useEffect, useState } from "react";
import { controlPlatformService, type ControlPlatformRole, type PlatformUser } from "@/services/control.service";
import type { AssignableUser, Permission, Role } from "./types";
import { messageFrom } from "./utils";
import { RoleManagement } from "./role-management-layout";

export function PlatformRoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [catalogPermissions, setCatalogPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [roleData, permissionData, permissionCatalogData, userData] = await Promise.all([
        controlPlatformService.listRoles(),
        controlPlatformService.listRolePermissions(),
        controlPlatformService.listPermissions(),
        controlPlatformService.listUsers({ limit: 100 }),
      ]);
      setRoles(roleData as ControlPlatformRole[]);
      setPermissions(permissionData);
      setCatalogPermissions(permissionCatalogData);
      setUsers(
        userData.items.map((user: PlatformUser) => ({ id: user.id, name: user.name ?? user.email, email: user.email })),
      );
      setLoadError("");
    } catch (reason) {
      setLoadError(messageFrom(reason, "Unable to load platform roles and permissions."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <RoleManagement
      title="Platform roles"
      description="Manage internal platform roles, explicit permissions, and staff access."
      noun="Platform role"
      roles={roles}
      permissions={permissions}
      catalogPermissions={catalogPermissions}
      users={users}
      includeKey
      allowPermissionId={false}
      loadError={loadError}
      isLoading={isLoading}
      onCreate={async (input) => {
        await controlPlatformService.createRole({
          key: input.key ?? "",
          name: input.name,
          description: input.description,
        });
        await load();
      }}
      onCreatePermission={async (input) => {
        await controlPlatformService.createPermission(input);
        await load();
      }}
      onUpdatePermission={async (permission, input) => {
        await controlPlatformService.updatePermission(permission.id, input);
        await load();
      }}
      onDeletePermission={async (permission) => {
        await controlPlatformService.deletePermission(permission.id);
        await load();
      }}
      onSavePermissions={async (role, changes) => {
        // A single refresh reconciles successful writes even when another write failed.
        const results = await Promise.allSettled(
          changes.map(({ permission, selected }) =>
            selected
              ? controlPlatformService.attachRolePermission(role.id, permission.id)
              : controlPlatformService.removeRolePermission(role.id, permission.id),
          ),
        );
        setRoles(await controlPlatformService.listRoles());
        const failed = results.find((result) => result.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
      }}
      onAssign={async (role, userId) => {
        await controlPlatformService.assignRole(role.id, userId);
        await load();
      }}
      onRevoke={async (role, userId) => {
        await controlPlatformService.revokeRole(role.id, userId);
        await load();
      }}
    />
  );
}
