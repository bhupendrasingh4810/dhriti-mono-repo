import "server-only";
import { isIP } from "node:net";

/** Enable only behind an ingress that overwrites X-Real-IP and isolates the API from direct traffic. */
export function trustedClientIpHeaders(headers: Headers): Record<string, string> {
  if (process.env.TRUST_INGRESS_CLIENT_IP !== "true") return {};
  const ip = headers.get("x-real-ip");
  if (!ip || !isIP(ip)) throw new Error("Trusted ingress must supply one valid X-Real-IP address");
  return { "x-forwarded-for": ip };
}
