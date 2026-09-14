export type UserRole = 'PLATFORM_ADMIN' | 'ORG_OWNER' | 'ORG_ADMIN' | 'MEMBER' | 'GUEST';
export interface Organization {
  id: string;
  name: string;
  slug: string;
}
export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  status?: "available" | "busy" | "away" | "offline";
  statusMsg?: string;
  timezone?: string;
  avatar?: string;
  role?: UserRole;
  organization?: Organization;
}