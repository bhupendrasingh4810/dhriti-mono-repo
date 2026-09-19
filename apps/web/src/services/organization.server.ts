import "server-only";

import { apiServiceRequest } from "@/services/api.service";

export const organizationBackend = {
  list: (accessToken: string) => apiServiceRequest("/organizations", {
    headers: { Authorization: `Bearer ${accessToken}` },
  }),
  create: (accessToken: string, body: unknown) => apiServiceRequest("/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  }),
};