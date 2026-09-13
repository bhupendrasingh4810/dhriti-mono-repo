import { readFileSync } from "node:fs";
import { join } from "node:path";

export function getWelcomeTemplate(receiverName: string, receiverEmail: string, onboardingUrl: string): string {
  let template = readFileSync(join(__dirname, "welcome.template.html"), "utf-8");
  
  // Replace variables
  template = template
  .replace(/{{receiver_name}}/g, receiverName)
    .replace(/{{receiver_email}}/g, receiverEmail)
    .replace(/{{onboarding_url}}/g, onboardingUrl)
    .replace(/{{help_center_url}}/g, 'https://help.dhriti.com')
    .replace(/{{privacy_url}}/g, 'https://dhriti.com/privacy')
    .replace(/{{terms_url}}/g, 'https://dhriti.com/terms')
    .replace(/{{contact_url}}/g, 'https://dhriti.com/contact')
    .replace(/{{twitter_url}}/g, 'https://twitter.com/dhriti')
    .replace(/{{linkedin_url}}/g, 'https://linkedin.com/company/dhriti')
    .replace(/{{github_url}}/g, 'https://github.com/dhriti');
  
  return template;
}

