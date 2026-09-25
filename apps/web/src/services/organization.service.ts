import { apiRequest } from "@/services/http.service";
import type { CreateOrganizationInput } from "@/types/request";
import type { OrganizationResponse } from "@/types/response";

export async function createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
  return apiRequest<OrganizationResponse>(
    "/api/organizations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Unable to create your organization.",
  );
}
