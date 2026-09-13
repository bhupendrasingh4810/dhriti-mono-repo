/**
 * Simple JWT utilities for client-side operations only.
 */

export interface JWTPayload {
    userId: string;
    email: string;
    name: string;
    organizations: Array<{
        id: string;
        name: string;
        role: string;
    }>;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
}

/**
 * Decode JWT payload without verification (client-side only).
 * ⚠️ Don't trust this data for security decisions - always verify on backend.
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1];
        const decoded = JSON.parse(atob(payload));
        return decoded as JWTPayload;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}

/**
 * Check if token is expired based on exp claim.
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeJWT(token);

    if (!decoded?.exp) {
        return true;
    }

    // exp is in seconds, convert to milliseconds
    return decoded.exp * 1000 < Date.now();
}

/**
 * Get time until token expires (in milliseconds).
 * Returns 0 if token is already expired or invalid.
 */
export function getTimeUntilExpiry(token: string): number {
    const decoded = decodeJWT(token);

    if (!decoded?.exp) {
        return 0;
    }

    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
    return Math.max(0, timeUntilExpiry);
}

/**
 * Check if token will expire soon (within threshold).
 * @param token - JWT token
 * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
 */
export function isTokenExpiringSoon(token: string, thresholdMs: number = 5 * 60 * 1000): boolean {
    const timeUntilExpiry = getTimeUntilExpiry(token);
    return timeUntilExpiry < thresholdMs && timeUntilExpiry > 0;
}