"use client";

import { useParams } from "next/navigation";

import { OrganizationRoleManagement } from "@/features/control/role-management/role-management";

export default function RolesPermissions() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  return <OrganizationRoleManagement organizationId={organizationSlug} />;
}
