export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
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

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
  mfaTokenExpiresIn: number;
}

export type LoginResponse = AuthTokensResponse | MfaChallengeResponse;

export function isMfaChallenge(response: LoginResponse): response is MfaChallengeResponse {
  return "mfaRequired" in response && response.mfaRequired === true;
}
