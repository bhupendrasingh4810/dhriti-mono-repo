import type { NextRequest } from "next/server";
import { proxyBackendRequest } from "@/services/backend-proxy.server";

function profileRequest(request: NextRequest) {
  return proxyBackendRequest(request, {
    params: Promise.resolve({ path: ["auth", "me"] }),
  });
}

export const GET = profileRequest;
export const PATCH = profileRequest;
