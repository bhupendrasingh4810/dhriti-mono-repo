import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getResendOtpTemplate(
    receiverName: string,
    userEmail: string,
    otpCode: string,
    expiryMinutes: number,
    verificationUrl: string
): string {
    let template = readFileSync(join(__dirname, 'resend-otp.template.html'), 'utf-8');

    template = template
        .replace(/{{receiver_name}}/g, receiverName)
        .replace(/{{user_email}}/g, userEmail)
        .replace(/{{otp_code}}/g, otpCode)
        .replace(/{{expiry_minutes}}/g, expiryMinutes.toString())
        .replace(/{{verification_url}}/g, verificationUrl)
        .replace(/{{help_center_url}}/g, 'https://help.dhriti.com')
        .replace(/{{contact_url}}/g, 'https://dhriti.com/support')
        .replace(/{{privacy_url}}/g, 'https://dhriti.com/privacy')
        .replace(/{{terms_url}}/g, 'https://dhriti.com/terms')
        .replace(/{{twitter_url}}/g, 'https://twitter.com/dhriti')
        .replace(/{{linkedin_url}}/g, 'https://linkedin.com/company/dhriti')
        .replace(/{{github_url}}/g, 'https://github.com/dhriti');

    return template;
}