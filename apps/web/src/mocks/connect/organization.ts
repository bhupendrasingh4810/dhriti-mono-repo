import type { ConnectOrganization } from "./types";

export const connectOrganization: ConnectOrganization = {
  id: "org_001",
  name: "Acme Technologies",
  slug: "acme-technologies",
  logo: "/mock/logos/acme.png",
  domain: "acmetech.com",
  industry: "Technology",
  size: "1000-5000",
  timezone: "Asia/Kolkata",
  locale: "en-IN",
  createdAt: "2021-03-15T09:30:00Z",
  subscription: {
    plan: "enterprise",
    status: "active",
    renewalDate: "2027-03-15",
  },
};
