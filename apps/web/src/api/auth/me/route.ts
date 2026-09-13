// apps/web/src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('access_token')?.value;
        const refreshToken = request.cookies.get('refresh_token')?.value;

        if (!accessToken && !refreshToken) {
            return NextResponse.json({ user: null });
        }

        // If no access token but have refresh token, try to refresh
        if (!accessToken && refreshToken) {
            // Call refresh endpoint internally
            const refreshResponse = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!refreshResponse.ok) {
                const response = NextResponse.json({ user: null });
                response.cookies.delete('refresh_token');
                response.cookies.delete('access_token');
                return response;
            }

            const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshResponse.json();

            const response = NextResponse.json({ user });

            if (newAccessToken) {
                response.cookies.set('access_token', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 15,
                    path: '/',
                });
            }

            if (newRefreshToken) {
                response.cookies.set('refresh_token', newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                    path: '/',
                });
            }

            return response;
        }

        // Fetch user from backend with access token
        const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!backendResponse.ok) {
            return NextResponse.json({ user: null });
        }

        const user = await backendResponse.json();
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ user: null });
    }
}