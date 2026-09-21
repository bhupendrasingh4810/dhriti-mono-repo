// apps/web/src/hooks/use-auth.ts

'use client';

import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
    getCurrentUser,
    logout as logoutSession,
} from '@/services/auth.service';

interface Organization {
    id: string;
    name: string;
    slug: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isPlatformUser: boolean;
    organization: Organization | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined,
);

const PUBLIC_ROUTES = new Set([
    '/',
    '/about',
    '/about-us',
    '/blog',
    '/contact',
    '/contact-us',
    '/faq',
    '/privacy-policy',
    '/pricing',
    '/terms-and-conditions',
]);

const AUTH_ROUTES = new Set([
    '/login',
    '/signup',
    '/get-started',
    '/forgot-password',
    '/verify',
    '/verify-email',
    '/reset-password',
    '/oauth/callback',
]);

const shouldLoadCurrentUser = (pathname: string): boolean => {
    return !(
        PUBLIC_ROUTES.has(pathname) ||
        AUTH_ROUTES.has(pathname) ||
        pathname.startsWith('/blog/')
    );
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();
    const initializedRef = useRef(false);
    const loggedOutRef = useRef(false);

    const redirectAnonymousOnboardingUser = useCallback(() => {
        if (pathname !== '/onboarding') {
            return;
        }

        router.replace(
            `/login?callbackUrl=${encodeURIComponent(pathname)}`,
        );
        router.refresh();
    }, [pathname, router]);

    const loadUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();

            loggedOutRef.current = false;
            setUser(currentUser);
            if (!currentUser) {
                redirectAnonymousOnboardingUser();
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [redirectAnonymousOnboardingUser]);

    useEffect(() => {
        if (!shouldLoadCurrentUser(pathname)) {
            setLoading(false);
            return;
        }

        if (initializedRef.current) {
            return;
        }

        initializedRef.current = true;
        void loadUser();
    }, [loadUser, pathname]);

    const refreshUser = useCallback(async () => {
        setLoading(true);

        try {
            const currentUser = await getCurrentUser();

            loggedOutRef.current = false;
            setUser(currentUser);
            if (!currentUser) {
                redirectAnonymousOnboardingUser();
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [redirectAnonymousOnboardingUser]);

    const logout = useCallback(async () => {
        if (loggedOutRef.current) {
            return;
        }

        loggedOutRef.current = true;

        try {
            await logoutSession();
        } catch {
            // The local session must still be cleared.
        } finally {
            setUser(null);
            router.replace('/login');
            router.refresh();
        }
    }, [router]);

    const value: AuthContextType = {
        user,
        loading,
        logout,
        refreshUser,
        isAuthenticated: user !== null,
    };

    return createElement(
        AuthContext.Provider,
        { value },
        children,
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used within an AuthProvider. ' +
            'Wrap your application with <AuthProvider>.',
        );
    }

    return context;
}