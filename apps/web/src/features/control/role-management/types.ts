export type Permission = {
  id: string;
  key: string;
  name?: string;
  resource?: string;
  action?: string;
  productKey?: string | null;
  description?: string | null;
  isAssignable?: boolean;
  isSystemOnly?: boolean;
};

export type PermissionInput = {
  key: string;
  resource: string;
  action: string;
  productKey?: string;
  description?: string;
  isAssignable: boolean;
  isSystemOnly: boolean;
};

export type PermissionChange = { permission: Permission; selected: boolean };

export type Role = {
  id: string;
  key?: string;
  name: string;
  description: string | null;
  isSystem?: boolean;
  permissions: Array<{ permission: Permission }>;
  assignments?: Array<{ user: AssignableUser & { profile?: { jobTitle: string | null } | null } }>;
  _count: { assignments: number };
};

export type AssignableUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  designation?: string | null;
};
