export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    isTermsAccepted: boolean;
}

export interface VerifyEmailInput {
    email: string;
    token: string;
    otp: string;
}

export interface ResendVerificationInput {
    email: string;
    token: string;
}

export interface ForgotPasswordInput {
    email: string;
}

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
}