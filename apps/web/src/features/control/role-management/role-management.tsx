"use client";

// Preserve existing route and feature imports while components remain independently reusable.
export { RoleList } from "./role-list";
export { RoleCreationForm } from "./role-creation-form";
export { PermissionCatalogDrawer } from "./permission-catalog-drawer";
export { PermissionEditor } from "./permission-editor";
export { RoleAssignment } from "./role-assignment";
export { RoleManagement } from "./role-management-layout";
export { OrganizationRoleManagement } from "./organization-role-management";
export { PlatformRoleManagement } from "./platform-role-management";
export type { AssignableUser, Permission, PermissionInput, Role } from "./types";
