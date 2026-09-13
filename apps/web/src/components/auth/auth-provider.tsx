'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isTokenExpiringSoon } from '@/lib/auth/tokens';

interface User {
  id: string;
  email: string;
  fullName: string;
  organizations: Array<{
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'member';
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let refreshPromise: Promise<boolean> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }, []);

  const silentRefresh = useCallback(async (): Promise<boolean> => {
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
          return true;
        }

        return false;
      })();

      return await refreshPromise;
    } catch (error) {
      console.error('Silent refresh failed:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  }, [user]);

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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const checkExpiry = setInterval(async () => {
      // Get access token from cookie
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (accessToken && isTokenExpiringSoon(accessToken)) {
        await silentRefresh();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(checkExpiry);
  }, [user, silentRefresh]);

  // Handle 401 responses globally
  useEffect(() => {
    const handleApiError = async (event: CustomEvent<{ status: number }>) => {
      const { status } = event.detail;
      
      if (status === 401) {
        const refreshed = await silentRefresh();
        
        if (!refreshed) {
          const lastUrl = encodeURIComponent(pathname);
          router.push(`/login?callbackUrl=${lastUrl}`);
        }
      }
    };

    const apiErrorListener = (event: Event) => {
      void handleApiError(event as CustomEvent<{ status: number }>);
    };

    window.addEventListener('api-error', apiErrorListener);
    return () => window.removeEventListener('api-error', apiErrorListener);
  }, [pathname, router, silentRefresh]);

  const logout = async () => {
    try {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}