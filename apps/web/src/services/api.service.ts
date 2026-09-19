import "server-only";

export async function apiServiceRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  return fetch(`${backendUrl}${path}`, { cache: "no-store", ...options });
}