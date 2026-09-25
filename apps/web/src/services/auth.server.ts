import "server-only";

import { apiServiceRequest } from "@/services/api.service";

type JsonBody = Record<string, unknown>;

function jsonRequest(path: string, body: JsonBody) {
  return apiServiceRequest(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export const authService = {
  register: (body: JsonBody) => jsonRequest("/auth/register", body),

  login: (body: JsonBody) => jsonRequest("/auth/login", body),

  verifyEmail: (body: JsonBody) => jsonRequest("/auth/verify-email", body),

  resendVerification: (body: JsonBody) => jsonRequest("/auth/resend-verification", body),

  forgotPassword: (body: JsonBody) => jsonRequest("/auth/forgot-password", body),

  resetPassword: (body: JsonBody) => jsonRequest("/auth/reset-password", body),

  refresh: (refreshToken: string) =>
    jsonRequest("/auth/refresh", {
      refreshToken,
    }),

  logout: (accessToken: string) =>
    apiServiceRequest("/auth/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),

  me: (accessToken: string) =>
    apiServiceRequest("/auth/me", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),

  uploadAvatar: (accessToken: string, formData: FormData) =>
    apiServiceRequest("/auth/me/avatar", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      cache: "no-store",
    }),
};
