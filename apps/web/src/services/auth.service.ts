import { ApiRequestError, apiRequest } from "@/services/http.service";
import type { UpdatePersonalProfileInput } from "@dhriti/types";

import type {
  RegisterInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/types/request";

import type {
  RegisterResponse,
  LoginResponse,
  CurrentUserResponse,
  AuthUserResponse,
  AuthTokensResponse,
  UserProfileResponse,
} from "@/types/response";

export async function login(input: Pick<RegisterInput, "email" | "password">): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to sign in.",
  );
}

export async function getCurrentUser(): Promise<AuthUserResponse | null> {
  try {
    const result = await apiRequest<CurrentUserResponse>(
      "/api/auth/me",
      {
        method: "GET",
      },
      "Unable to load your session.",
    );

    return result.user;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      await logout().catch(() => undefined);
      return null;
    }

    throw error;
  }
}

export async function refreshSession(): Promise<AuthUserResponse | null> {
  const result = await apiRequest<CurrentUserResponse>(
    "/api/auth/refresh",
    {
      method: "POST",
    },
    "Unable to refresh your session.",
  );

  return result.user;
}

export async function logout(): Promise<void> {
  await apiRequest<void>(
    "/api/auth/logout",
    {
      method: "POST",
    },
    "Unable to sign out.",
  );
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to create your account.",
  );
}

export async function verifyEmail(input: VerifyEmailInput): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>(
    "/api/auth/verify-email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to verify your email.",
  );
}

export async function resendVerification(input: ResendVerificationInput): Promise<void> {
  await apiRequest<void>(
    "/api/auth/resend-verification",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to resend the verification email.",
  );
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await apiRequest<void>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to request a password reset.",
  );
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiRequest<void>(
    "/api/auth/reset-password",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to reset your password.",
  );
}

export async function uploadProfilePhoto(file: File): Promise<AuthUserResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<AuthUserResponse>(
    "/api/auth/me/avatar",
    {
      method: "POST",
      body: formData,
    },
    "Unable to upload profile photo.",
  );
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>("/api/auth/profile", { cache: "no-store" }, "Unable to load your profile.");
}

export async function updateUserProfile(input: UpdatePersonalProfileInput): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(
    "/api/auth/profile",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Unable to save your profile.",
  );
}
