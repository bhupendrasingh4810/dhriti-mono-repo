export interface CreateOrganizationInput {
  name: string;
  slug: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
    details?: { fields?: string[] };
  };
}

export async function createOrganization(input: CreateOrganizationInput): Promise<OrganizationResponse> {
  const response = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return response.json() as Promise<OrganizationResponse>;
  }

  const responseBody = await response.json().catch(() => ({})) as ApiErrorResponse;
  const fieldMessages = responseBody.error?.details?.fields;
  throw new Error(fieldMessages?.join(" ") || responseBody.error?.message || "Unable to create your organization.");
}

export async function listOrganizations(): Promise<OrganizationResponse[]> {
  const response = await fetch("/api/organizations");
  if (response.ok) {
    return response.json() as Promise<OrganizationResponse[]>;
  }

  const responseBody = await response.json().catch(() => ({})) as ApiErrorResponse;
  throw new Error(responseBody.error?.message || "Unable to load your organizations.");
}