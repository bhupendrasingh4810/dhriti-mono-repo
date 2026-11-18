import "server-only";
import { headers as incomingHeaders } from "next/headers";
import { trustedClientIpHeaders } from "./client-ip.server";

export async function apiServiceRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  const headers = new Headers(options.headers);
  if (process.env.TRUST_INGRESS_CLIENT_IP === "true") {
    for (const [name, value] of Object.entries(trustedClientIpHeaders(await incomingHeaders()))) {
      headers.set(name, value);
    }
  }
  return fetch(`${backendUrl}${path}`, { cache: "no-store", ...options, headers });
}
