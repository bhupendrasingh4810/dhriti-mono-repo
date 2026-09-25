import { apiRequest } from "@/services/http.service";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>;

export interface TenantRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
  query?: object;
}

export function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

export function withQuery(path: string, query?: object): string {
  if (!query) {
    return path;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (
        item !== null &&
        item !== undefined &&
        (typeof item === "string" || typeof item === "number" || typeof item === "boolean")
      ) {
        search.append(key, String(item));
      }
    }
  }

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function jsonRequest<TResponse, TInput>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  input: TInput,
  options: TenantRequestOptions = {},
  fallbackError = "Request failed.",
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  return apiRequest<TResponse>(
    withQuery(path, options.query),
    { ...options, method, headers, body: JSON.stringify(input) },
    fallbackError,
  );
}

export function request<TResponse>(
  path: string,
  options: TenantRequestOptions = {},
  fallbackError = "Request failed.",
): Promise<TResponse> {
  return apiRequest<TResponse>(withQuery(path, options.query), options, fallbackError);
}

export function tenantRequest<TResponse>(
  organizationId: string,
  path: string,
  options: TenantRequestOptions = {},
  fallbackError = "Request failed.",
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("x-organization-id", organizationId);

  return apiRequest<TResponse>(withQuery(path, options.query), { ...options, headers }, fallbackError);
}

export function tenantJsonRequest<TResponse, TInput>(
  organizationId: string,
  path: string,
  method: "POST" | "PUT" | "PATCH",
  input: TInput,
  options: TenantRequestOptions = {},
  fallbackError = "Request failed.",
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-organization-id", organizationId);

  return apiRequest<TResponse>(
    withQuery(path, options.query),
    { ...options, method, headers, body: JSON.stringify(input) },
    fallbackError,
  );
}
