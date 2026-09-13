import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getResetPasswordConfirmationTemplate(
    receiverName: string,
    userEmail: string,
    loginUrl: string,
    resetDate: string,
    resetTime: string,
    ipAddress: string,
    deviceInfo: string
): string {
    let template = readFileSync(join(__dirname, 'reset-password-confirmation.template.html'), 'utf-8');

    template = template
        .replace(/{{receiver_name}}/g, receiverName)
        .replace(/{{user_email}}/g, userEmail)
        .replace(/{{login_url}}/g, loginUrl)
        .replace(/{{reset_date}}/g, resetDate)
        .replace(/{{reset_time}}/g, resetTime)
        .replace(/{{ip_address}}/g, ipAddress)
        .replace(/{{device_info}}/g, deviceInfo)
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