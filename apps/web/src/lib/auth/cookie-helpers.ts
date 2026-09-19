import type { NextResponse } from 'next/server';

import {
    accessTokenCookie,
    refreshTokenCookie,
    userCookie,
} from './cookies';

type AuthUser = Record<string, unknown>;

export function setAuthCookies(
    response: NextResponse,
    input: {
        accessToken: string;
        refreshToken?: string;
        user?: AuthUser;
        accessTokenMaxAge?: number;
        refreshTokenMaxAge?: number;
    },
) {
    response.cookies.set(
        'access_token',
        input.accessToken,
        {
            ...accessTokenCookie,
            maxAge: input.accessTokenMaxAge ?? accessTokenCookie.maxAge,
        },
    );

    if (input.refreshToken) {
        response.cookies.set(
            'refresh_token',
            input.refreshToken,
            {
                ...refreshTokenCookie,
                maxAge: input.refreshTokenMaxAge ?? refreshTokenCookie.maxAge,
            },
        );
    }

    if (input.user) {
        response.cookies.set(
            'user',
            JSON.stringify(input.user),
            {
                ...userCookie,
                maxAge: input.refreshTokenMaxAge ?? userCookie.maxAge,
            },
        );
    }
}

export function clearAuthCookies(response: NextResponse) {
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('user');
}