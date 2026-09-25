import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeJWT, isTokenExpired, type JWTPayload } from "@/lib/auth/tokens";

const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/about-us",
  "/blog",
  "/contact",
  "/contact-us",
  "/faq",
  "/privacy-policy",
  "/pricing",
  "/terms-and-conditions",
]);

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/get-started",
  "/forgot-password",
  "/verify",
  "/verify-email",
  "/reset-password",
  "/oauth/callback",
]);

const ONBOARDING_ROUTE = "/onboarding";
const INVITATION_ACCEPT_ROUTE = "/invitation/accept";

const getSessionUser = (token?: string): JWTPayload | null => {
  if (!token || isTokenExpired(token)) {
    return null;
  }

  try {
    return decodeJWT(token);
  } catch {
    return null;
  }
};

const getUserOrganization = (
  value?: string,
): {
  id: string;
  slug: string;
  name: string;
} | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      organization?: {
        id?: string;
        slug?: string;
        name?: string;
      } | null;
    };

    const organization = parsed.organization;

    if (!organization?.id || !organization.slug || !organization.name) {
      return null;
    }

    return {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
    };
  } catch {
    return null;
  }
};

const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.has(pathname) || pathname === "/blog" || pathname.startsWith("/blog/");
};

const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.has(pathname);
};

const createLoginRedirect = (request: NextRequest) => {
  const loginUrl = new URL("/login", request.url);

  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(loginUrl);
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const user = getSessionUser(request.cookies.get("access_token")?.value);

  const organization = getUserOrganization(request.cookies.get("user")?.value);

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isAuthRoute(pathname)) {
    if (user && organization) {
      return NextResponse.redirect(new URL(`/${organization.slug}/home`, request.url));
    }

    return NextResponse.next();
  }

  if (pathname === ONBOARDING_ROUTE) {
    return user ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === INVITATION_ACCEPT_ROUTE) {
    return NextResponse.next();
  }

  const organizationMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);

  if (!organizationMatch) {
    return NextResponse.next();
  }

  const organizationSlug = organizationMatch[1];

  if (!user) {
    return createLoginRedirect(request);
  }

  if (!organization) {
    return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
  }

  if (organization.slug !== organizationSlug) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);

    unauthorizedUrl.searchParams.set("org_name", organizationSlug);

    return NextResponse.redirect(unauthorizedUrl);
  }

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-org-name", organizationSlug);
  requestHeaders.set("x-user-id", user.sub);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
