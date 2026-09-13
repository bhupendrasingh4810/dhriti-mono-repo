export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  isTermsAccepted: boolean;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  token: string;
}

export interface VerifyEmailInput {
  email: string;
  token: string;
  otp: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  sessionId: string;
  user: AuthUserResponse;
  organization: OrganizationResponse | null;
}

export interface ResendVerificationInput {
  email: string;
  token: string;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
    details?: {
      fields?: string[];
    };
  };
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured.');
  }

  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return response.json() as Promise<RegisterResponse>;
  }

  const responseBody = await response.json().catch(() => ({})) as ApiErrorResponse;
  const fieldMessages = responseBody.error?.details?.fields;
  throw new Error(fieldMessages?.join(' ') || responseBody.error?.message || 'Unable to create your account.');
}

export async function verifyEmail(input: VerifyEmailInput): Promise<AuthTokensResponse> {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return response.json() as Promise<AuthTokensResponse>;
  }

  const responseBody = await response.json().catch(() => ({})) as ApiErrorResponse;
  const fieldMessages = responseBody.error?.details?.fields;
  throw new Error(fieldMessages?.join(' ') || responseBody.error?.message || 'Unable to verify your email.');
}

export async function resendVerification(input: ResendVerificationInput): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured.');
  }

  const response = await fetch(`${baseUrl}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return;
  }

  const responseBody = await response.json().catch(() => ({})) as ApiErrorResponse;
  const fieldMessages = responseBody.error?.details?.fields;
  throw new Error(fieldMessages?.join(' ') || responseBody.error?.message || 'Unable to resend the verification email.');
}