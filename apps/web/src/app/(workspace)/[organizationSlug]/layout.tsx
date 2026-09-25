// apps/web/src/app/(dashboard)/[org_name]/layout.tsx

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { decodeJWT, isTokenExpired, type JWTPayload } from "@/lib/auth/tokens";

interface OrgLayoutProps {
  children: ReactNode;
  params: Promise<{
    organizationSlug: string;
  }>;
}

type UserOrganization = {
  id: string;
  slug: string;
};

function getUserOrganization(value?: string): UserOrganization | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as {
      organization?: {
        id?: string;
        slug?: string;
      } | null;
    };

    const organization = parsed.organization;

    if (!organization?.id || !organization.slug) {
      return null;
    }

    return {
      id: organization.id,
      slug: organization.slug,
    };
  } catch {
    return null;
  }
}

function getSessionUser(token?: string): JWTPayload | null {
  if (!token || isTokenExpired(token)) {
    return null;
  }

  try {
    const user = decodeJWT(token);

    return user?.sub ? user : null;
  } catch {
    return null;
  }
}

function createLoginRedirect(orgName: string) {
  const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  loginUrl.searchParams.set("callbackUrl", `/${orgName}/home`);

  return loginUrl.pathname + loginUrl.search;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { organizationSlug } = await params;

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(organizationSlug)) {
    redirect("/unauthorized");
  }

  const cookieStore = await cookies();

  const accessToken = cookieStore.get("access_token")?.value;
  const userCookie = cookieStore.get("user")?.value;

  const user = getSessionUser(accessToken);

  if (!user) {
    redirect(createLoginRedirect(organizationSlug));
  }

  const organization = getUserOrganization(userCookie);

  if (!organization) {
    redirect("/onboarding");
  }
  console.log(organization, organizationSlug);
  if (organization.slug !== organizationSlug) {
    const unauthorizedUrl = new URL("/unauthorized", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

    unauthorizedUrl.searchParams.set("organizationSlug", organizationSlug);

    redirect(unauthorizedUrl.pathname + unauthorizedUrl.search);
  }

  return <>{children}</>;
}
