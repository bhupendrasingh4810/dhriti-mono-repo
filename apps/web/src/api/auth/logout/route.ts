// apps/web/src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refresh_token')?.value;

        // Notify backend to invalidate refresh token (optional but recommended)
        if (refreshToken) {
            await fetch(`${process.env.BACKEND_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            }).catch(() => {
                // Ignore backend logout errors - still clear cookies
            });
        }

        const response = NextResponse.json({ success: true });
        response.cookies.delete('refresh_token');
        response.cookies.delete('access_token');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}