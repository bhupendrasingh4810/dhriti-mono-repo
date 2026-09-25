// apps/web/src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";

import { authService } from "@/services/auth.server";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookie-helpers";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      user: null,
      message,
    },
    { status },
  );
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return jsonError("Unauthenticated", 401);
  }

  if (accessToken) {
    const backendResponse = await authService.me(accessToken);

    if (backendResponse.ok) {
      const user = await parseJson<AuthUser>(backendResponse);

      if (!user) {
        return jsonError("Invalid authentication response", 502);
      }

      return NextResponse.json({ user });
    }

    if (backendResponse.status !== 401) {
      const body = await parseJson<{
        message?: string | string[];
      }>(backendResponse);

      return NextResponse.json(
        {
          user: null,
          message: body?.message ?? "Unable to load session",
        },
        {
          status: backendResponse.status >= 400 ? backendResponse.status : 502,
        },
      );
    }
  }

  if (!refreshToken) {
    const response = jsonError("Unauthenticated", 401);
    clearAuthCookies(response);
    return response;
  }

  const refreshResponse = await authService.refresh(refreshToken);

  if (!refreshResponse.ok) {
    const response = jsonError("Unauthenticated", 401);
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await parseJson<RefreshResponse>(refreshResponse);

  if (!refreshed?.accessToken || !refreshed.user) {
    const response = jsonError("Invalid refresh response", 502);

    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({
    user: refreshed.user,
  });

  setAuthCookies(response, {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    user: refreshed.user,
  });

  return response;
}
