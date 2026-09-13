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
  role?: string;
}