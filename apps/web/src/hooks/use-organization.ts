'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';

/**
 * Hook to access the current organization context.
 * Extracts organization from URL and validates user membership.
 */
export function useOrganization() {
    const { user } = useAuth();
    const pathname = usePathname();

    // Extract current organization from URL path
    const currentOrg = useMemo(() => {
        const match = pathname.match(/^\/([^/]+)/);
        return match?.[1] || null;
    }, [pathname]);

    // Find the organization in user's organizations list
    const organization = useMemo(() => {
        if (!user || !currentOrg) {
            return null;
        }

        return (
            (user?.organization?.name === currentOrg) || null
        );
    }, [user, currentOrg]);

    const isMember = !!organization;
    // const role = organization?.role || null;

    return {
        /** Current organization name from URL */
        currentOrg,
        /** Full organization object with id, name, role */
        organization,
        /** Whether user is a member of this organization */
        isMember,
        /** User's role in this organization (owner, admin, member) */
        // role,
        /** Alias for isMember - can user access this org? */
        canAccess: isMember
    };
}