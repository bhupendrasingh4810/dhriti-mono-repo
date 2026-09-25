import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getInvitationTemplate(
  recipientName: string,
  recipientEmail: string,
  senderName: string,
  organizationName: string,
  invitationUrl: string,
  expiryDays: number,
): string {
  let template = readFileSync(join(__dirname, "invitation.html"), "utf-8");

  template = template
    .replace(/{{recipient_name}}/g, recipientName)
    .replace(/{{recipient_email}}/g, recipientEmail)
    .replace(/{{sender_name}}/g, senderName)
    .replace(/{{organization_name}}/g, organizationName)
    .replace(/{{invitation_url}}/g, invitationUrl)
    .replace(/{{expiry_days}}/g, expiryDays.toString())
    .replace(/{{help_center_url}}/g, "https://help.dhriti.com")
    .replace(/{{contact_url}}/g, "https://dhriti.com/support")
    .replace(/{{privacy_url}}/g, "https://dhriti.com/privacy")
    .replace(/{{terms_url}}/g, "https://dhriti.com/terms")
    .replace(/{{twitter_url}}/g, "https://twitter.com/dhriti")
    .replace(/{{linkedin_url}}/g, "https://linkedin.com/company/dhriti")
    .replace(/{{github_url}}/g, "https://github.com/dhriti");

  return template;
}
