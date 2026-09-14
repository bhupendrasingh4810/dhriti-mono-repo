// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJWT, isTokenExpired, type JWTPayload } from '@/lib/auth/tokens';

const PUBLIC_ROUTES = ['/', '/pricing', '/about', '/contact'];
const AUTH_ROUTES = ['/login', '/get-started', '/forgot-password', '/verify', '/reset-password', '/oauth/callback'];
const ONBOARDING_ROUTE = '/onboarding';

const getSessionUser = (token?: string): JWTPayload | null => {
  if (!token || isTokenExpired(token)) {
    return null;
  }

  return decodeJWT(token);
};

const getUserOrganization = (value?: string): { id: string; slug: string; name: string } | null => {
  if (!value) {
    return null;
  }
  try {
    const organization = (JSON.parse(value) as {
      organization?: { id?: string; slug?: string, name?: string } | null;
    }).organization;
    return organization?.id && organization.slug && organization.name
      ? { id: organization.id, slug: organization.slug, name: organization.name }
      : null;
  } catch {
    return null;
  }
};

const isRouteMatch = (pathname: string, route: string) => (
  route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session
  const accessToken = request.cookies.get('access_token')?.value;
  const user = getSessionUser(accessToken);
  const organization = getUserOrganization(request.cookies.get('user')?.value);

  // Skip public and auth routes
  if (PUBLIC_ROUTES.some(route => isRouteMatch(pathname, route))) {
    return NextResponse.next();
  }

  if (AUTH_ROUTES.some(route => isRouteMatch(pathname, route))) {
    // If already logged in, redirect to default org
    if (user && organization) {
      return NextResponse.redirect(
        new URL(`/${organization.slug}/home`, request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname === ONBOARDING_ROUTE) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Handle org-scoped routes: /[org_name]/*
  const orgMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);

  if (orgMatch) {
    const orgName = orgMatch[1];
    // Not logged in
    if (!user) {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }

    if (!organization) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
    }

    if (organization.slug !== orgName) {
      return NextResponse.redirect(
        new URL(`/unauthorized?org_name=${orgName}`, request.url)
      );
    }

    // Valid - add org context to headers
    const response = NextResponse.next();
    response.headers.set('x-org-name', orgName);
    response.headers.set('x-user-id', user.sub);
    return response;
  }

  // Non-org authenticated routes - redirect to default org
  if (user && organization) {
    return NextResponse.redirect(
      new URL(`/${organization.slug}/home`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};