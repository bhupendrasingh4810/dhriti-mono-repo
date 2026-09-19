import "server-only";

import { apiServiceRequest } from "@/services/api.service";

export const onboardingBackend = {
    get: (accessToken: string) => apiServiceRequest("/onboarding", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    }),
    create: (accessToken: string, body: unknown) => apiServiceRequest("/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
    }),
};