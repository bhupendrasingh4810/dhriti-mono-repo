export interface RegisterResponse {
    userId: string;
    email: string;
    token: string;
}

export interface OrganizationResponse {
    id: string;
    name: string;
    slug: string;
}

export interface AuthUserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    organization: OrganizationResponse | null;
}

export interface AuthTokensResponse {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
    sessionId: string;
    user: AuthUserResponse;
}

export interface LoginResponse {
    user: AuthUserResponse;
}

export interface CurrentUserResponse {
    user: AuthUserResponse | null;
}

export interface OrganizationResponse {
    id: string;
    name: string;
    slug: string;
}