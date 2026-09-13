import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Call your NestJS backend
        const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            return NextResponse.json(
                { error: error.message || 'Invalid credentials' },
                { status: 401 }
            );
        }

        const { user, accessToken, refreshToken } = await backendResponse.json();

        // Create response with refresh token cookie
        const response = NextResponse.json({ user, accessToken });

        // Set refresh token in HTTP-only cookie
        response.cookies.set('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Optionally store access token in memory-only cookie (cleared on browser close)
        response.cookies.set('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 15, // 15 minutes
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}