import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!backendResponse.ok) {
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
      response.cookies.delete('refresh_token');
      response.cookies.delete('access_token');
      return response;
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await backendResponse.json();
    const response = NextResponse.json({ user });
    if (newRefreshToken) {
      response.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });
    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}