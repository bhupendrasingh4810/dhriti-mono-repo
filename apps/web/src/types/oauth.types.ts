export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'linkedin';

export type OAuthMode = 'login' | 'signup';

export interface OAuthButtonProps {
    provider?: OAuthProvider;
    mode?: OAuthMode;
    onClick?: (provider: OAuthProvider) => void;
    disabled?: boolean;
    className?: string;
}