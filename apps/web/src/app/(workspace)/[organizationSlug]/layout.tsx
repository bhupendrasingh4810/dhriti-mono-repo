// apps/web/src/app/(dashboard)/[org_name]/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeJWT } from '@/lib/auth/tokens';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
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

  // No tokens at all - redirect to login
  if (!accessToken && !refreshToken) {
    const callbackUrl = encodeURIComponent(`/${org_name}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  // Decode user from access token
  const user = accessToken ? decodeJWT(accessToken) : null;

  // If no valid user from access token, they'll be handled by client-side refresh
  // For now, just let them through and let the client handle token refresh
  if (!user?.userId) {
    // Don't redirect here - let the client-side auth handle refresh
    return <>{children}</>;
  }

  // Verify org membership
  const isMember = user.organizations?.some(
    (org: { name: string }) => org.name === org_name
  );

  if (!isMember) {
    redirect(`/unauthorized?org_name=${org_name}`);
  }

  return <>{children}</>;
}