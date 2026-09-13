import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getResetPasswordTemplate(
    userEmail: string,
    resetPasswordUrl: string,
    expiryMinutes: number
): string {
    let template = readFileSync(join(__dirname, 'reset-password.template.html'), 'utf-8');

    template = template
        .replace(/{{user_email}}/g, userEmail)
        .replace(/{{reset_password_url}}/g, resetPasswordUrl)
        .replace(/{{expiry_minutes}}/g, expiryMinutes.toString())
        .replace(/{{help_center_url}}/g, 'https://help.dhriti.com')
        .replace(/{{contact_url}}/g, 'https://dhriti.com/support')
        .replace(/{{privacy_url}}/g, 'https://dhriti.com/privacy')
        .replace(/{{terms_url}}/g, 'https://dhriti.com/terms')
        .replace(/{{security_url}}/g, 'https://dhriti.com/security')
        .replace(/{{twitter_url}}/g, 'https://twitter.com/dhriti')
        .replace(/{{linkedin_url}}/g, 'https://linkedin.com/company/dhriti')
        .replace(/{{github_url}}/g, 'https://github.com/dhriti');

    return template;
}