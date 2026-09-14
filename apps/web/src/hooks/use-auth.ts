// apps/web/src/hooks/use-auth.ts
'use client';

import { createContext, createElement, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    slug: string;
}
interface User {
    id: string;
    email: string;
    name: string;
    organization: Organization | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Track refresh in progress to avoid multiple simultaneous refreshes
let refreshPromise: Promise<boolean> | null = null;
let handlingUnauthorized = false;

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = useCallback(async (): Promise<User | null> => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                return null;
            }

            const data = await res.json();
            return data.user || null;
        } catch {
            return null;
        }
    }, []);

    const silentRefresh = useCallback(async (): Promise<boolean> => {
        // If refresh already in progress, wait for it
        if (refreshPromise) {
            return await refreshPromise;
        }

        try {
            refreshPromise = (async () => {
                const res = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    throw new Error('Refresh failed');
                }

                const data = await res.json();

                if (data.user) {
                    setUser(data.user);
                }
                return Boolean(data.user);
            })();

            return await refreshPromise;
        } catch (error) {
            console.error('Silent refresh failed:', error);
            return false;
        } finally {
            refreshPromise = null;
        }
    }, []);

    const loadUser = useCallback(async () => {
        try {
            const fetchedUser = await fetchUser();
            setUser(fetchedUser);
        } catch (error) {
            console.error('Failed to load user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [fetchUser]);

    // Load user on mount
    useEffect(() => {
        void Promise.resolve().then(loadUser);
    }, [loadUser]);

    // Access tokens are HTTP-only, so refresh active sessions on an interval.
    useEffect(() => {
        if (!user) return;

        const refreshInterval = setInterval(() => {
            void silentRefresh();
        }, 10 * 60 * 1000);

        return () => clearInterval(refreshInterval);
    }, [user, silentRefresh]);

    useEffect(() => {
        const originalFetch = window.fetch.bind(window);

        const handleUnauthorized = async () => {
            if (handlingUnauthorized) {
                return;
            }
            handlingUnauthorized = true;

            const currentUrl = new URL(window.location.href);
            const existingCallbackUrl = currentUrl.searchParams.get("callbackUrl");
            const loginUrl = existingCallbackUrl
                ? `/login?callbackUrl=${encodeURIComponent(existingCallbackUrl)}`
                : currentUrl.pathname === "/login"
                    ? "/login"
                    : `/login?callbackUrl=${encodeURIComponent(`${currentUrl.pathname}${currentUrl.search}`)}`;
            try {
                await originalFetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });
            } finally {
                setUser(null);
                window.location.assign(loginUrl);
            }
        };

        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            const requestUrl = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].pathname : args[0].url;
            if (response.status === 401 && !requestUrl.includes("/api/auth/")) {
                void handleUnauthorized();
            }
            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const logout = async () => {
        try {
            // Store last URL for potential post-logout redirect
            localStorage.setItem('last_url_before_logout', pathname);

            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const refreshUser = async () => {
        await loadUser();
    };

    const value = {
        user,
        loading,
        logout,
        refreshUser,
        isAuthenticated: !!user,
    };

    return createElement(AuthContext.Provider, { value }, children);
}

/**
 * Hook to access authentication state and actions.
 * Must be used within an AuthProvider.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, logout, isAuthenticated } = useAuth();
 *   
 *   if (loading) return <Spinner />;
 *   if (!isAuthenticated) return <LoginPrompt />;
 *   
 *   return <div>Welcome, {user?.name}!</div>;
 * }
 * ```
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            'useAuth must be used within an AuthProvider. ' +
            'Make sure you have wrapped your app with <AuthProvider> in the root layout.'
        );
    }

    return context;
}