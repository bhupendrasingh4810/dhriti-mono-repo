// apps/web/src/app/(auth)/unauthorized/page.tsx
import { Suspense } from 'react';
import { OrgAccessDialog } from '@/components/auth/org-access-dialog';

export default async function UnauthorizedPage({
    searchParams,
}: {
    searchParams: Promise<{ org_name?: string }>;
}) {
    const params = await searchParams;
    const orgName = params.org_name || 'Unknown';

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="flex min-h-screen items-center justify-center bg-muted/50">
                <OrgAccessDialog orgName={orgName} />
            </div>
        </Suspense>
    );
}