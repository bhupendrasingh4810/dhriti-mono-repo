// apps/web/src/lib/auth/server-session.ts
import { cookies } from 'next/headers';
import { decodeJWT } from './tokens';
import { User } from '@/types/user.types';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    organization: {
        id: string;
        name: string;
        role: string;
    };
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const userCoockie = cookieStore.get('user')?.value;

    if (!userCoockie) {
        return null;
    }

    const user: any = decodeJWT(userCoockie);

    if (!user?.id) {
        return null;
    }

    return {
        id: user.userId,
        email: user.email,
        name: user?.name || user.email,
        organization: user.organization || null,
    };
}

export async function requireSession() {
    const session = await getSession();

    if (!session) {
        throw new Error('No session');
    }

    return session;
}