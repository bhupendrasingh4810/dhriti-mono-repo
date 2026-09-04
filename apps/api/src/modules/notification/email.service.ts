import { Injectable, Logger } from "@nestjs/common";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email delivery port. The default implementation logs the message so auth
 * flows are fully testable without SMTP. Swap in an SMTP/SES adapter behind
 * this interface when wiring real delivery.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(`Email queued to=${message.to} subject="${message.subject}"`);
    this.logger.debug(message.text);
  }

  async sendVerificationEmail(to: string, name: string, verificationUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Verify your Dhriti account",
      text: `Hi ${name}, verify your email to activate your account: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Reset your Dhriti password",
      text: `Hi ${name}, reset your password using this link: ${resetUrl}`,
    });
  }

  async sendAccountLockedEmail(to: string, name: string, unlockAt: Date): Promise<void> {
    await this.send({
      to,
      subject: "Your Dhriti account was locked",
      text: `Hi ${name}, your account was locked after too many failed sign-in attempts. It unlocks at ${unlockAt.toISOString()}.`,
    });
  }
}
