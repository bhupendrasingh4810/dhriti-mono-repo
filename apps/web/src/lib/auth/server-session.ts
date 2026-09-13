// apps/web/src/lib/auth/server-session.ts
import { cookies } from 'next/headers';
import { decodeJWT } from './tokens';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    organizations: Array<{
        id: string;
        name: string;
        role: string;
    }>;
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
        return null;
    }

    const user = decodeJWT(accessToken);

    if (!user?.userId) {
        return null;
    }

    return {
        id: user.userId,
        email: user.email,
        name: user?.name || user.email,
        organizations: user.organizations || [],
    };
}

export async function requireSession() {
    const session = await getSession();

    if (!session) {
        throw new Error('No session');
    }

    return session;
}