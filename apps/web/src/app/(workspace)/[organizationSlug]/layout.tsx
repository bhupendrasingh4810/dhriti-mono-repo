// apps/web/src/app/(dashboard)/[org_name]/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeJWT } from '@/lib/auth/tokens';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

function getUserOrganization(value?: string): { id: string; slug: string } | null {
  if (!value) {
    return null;
  }

  try {
    const organization = (JSON.parse(value) as {
      organization?: { id?: string; slug?: string } | null;
    }).organization;
    return organization?.id && organization.slug ? { id: organization.id, slug: organization.slug } : null;
  } catch {
    return null;
  }
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { organizationSlug: org_name } = await params;

  // Validate org name format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(org_name)) {
    redirect('/unauthorized');
  }

  // Get tokens
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const userCookie = cookieStore.get('user')?.value;

  // No tokens at all - redirect to login
  if (!accessToken && !refreshToken) {
    const callbackUrl = encodeURIComponent(`/${org_name}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  // Decode user from access token
  const user = accessToken ? decodeJWT(accessToken) : null;

  // If no valid user from access token, they'll be handled by client-side refresh
  // For now, just let them through and let the client handle token refresh
  if (!user?.sub) {
    // Don't redirect here - let the client-side auth handle refresh
    return <>{children}</>;
  }

  const organization = getUserOrganization(userCookie);
  if (!organization) {
    redirect('/onboarding');
  }

  const isMember = organization?.slug === org_name;

  if (!isMember) {
    redirect(`/unauthorized?org_name=${org_name}`);
  }

  return <>{children}</>;
}