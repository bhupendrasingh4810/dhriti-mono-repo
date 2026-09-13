import { Injectable, Logger } from "@nestjs/common";
import SibApiV3Sdk from "sib-api-v3-sdk";

import { ApiConfigService } from "../../config/config.service";
import {
  getWelcomeTemplate,
  getResetPasswordTemplate,
  getResendOtpTemplate,
  getVerificationTemplate,
  getResetPasswordConfirmationTemplate,
} from "../../mail/templates";

export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ApiConfigService) { }

  async send(message: EmailMessage): Promise<void> {
    const brevo = this.config.brevo;
    if (!brevo) {
      this.logger.warn(`Email not sent because Brevo is not configured: to=${message.to} subject="${message.subject}"`);
      this.logger.debug(message.text);
      return;
    }

    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications["api-key"].apiKey = brevo.apiKey;

    try {
      await new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({
        sender: { email: brevo.senderEmail, name: brevo.senderName },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
      });
      this.logger.log(`Email sent to=${message.to} subject="${message.subject}"`);
    } catch (error) {
      this.logger.error(`Brevo failed to send email to=${message.to}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, name: string, otp: string, verificationUrl: string): Promise<void> {
    this.logger.log(`Sending verification email to=${to}`);

    try {
      await this.send({
        to,
        subject: "Welcome to Dhriti - verify your email",
        text: `Hi ${name}, welcome to Dhriti. Your verification code is ${otp}. You can also verify your email here: ${verificationUrl}`,
        html: getVerificationTemplate(name, otp, verificationUrl)
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to=${to}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async sendResendOtpEmail(
    email: string,
    name: string,
    otp: string,
    expiryMinutes: number,
    verificationUrl: string,
  ) {
    await this.send({
      to: email,
      subject: '🔐 Your Dhriti Verification Code',
      text: `Hi ${name}, your verification code is ${otp}. It expires in ${expiryMinutes} minutes. You can also verify your email here: ${verificationUrl}`,
      html: getResendOtpTemplate(name, email, otp, expiryMinutes, verificationUrl),
    });
  }

  async sendResetPasswordEmail(
    email: string,
    resetToken: string,
    expiryMinutes: number
  ) {
    await this.send({
      to: email,
      subject: '🔐 Reset Your Dhriti Password',
      html: getResetPasswordTemplate(email, resetToken, expiryMinutes),
    });
  }

  async sendWelcomeEmail(to: string, name: string, onboardingUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Welcome to Dhriti",
      text: `Hi ${name}, welcome to Dhriti. Get started here: ${onboardingUrl}`,
      html: getWelcomeTemplate(name, to, onboardingUrl),
    });
  }

  async sendResetPasswordConfirmationEmail(
    email: string,
    name: string,
    resetDate: string,
    resetTime: string,
    ipAddress: string,
    deviceInfo: string
  ) {
    const loginUrl = 'https://app.dhriti.com/auth/login';
    await this.send({
      to: email,
      subject: '✅ Password Reset Successful - Dhriti',
      html: getResetPasswordConfirmationTemplate(name, email, loginUrl, resetDate, resetTime, ipAddress, deviceInfo),
    });
  }

  async sendAccountLockedEmail(to: string, name: string, unlockAt: Date): Promise<void> {
    this.logger.log(`Sending account locked email to=${to}`);
    this.logger.debug(`Account locked email details: name=${name} unlockAt=${unlockAt.toISOString()}`);
    try {
      await this.send({
        to,
        subject: "Your Dhriti account was locked",
        text: `Hi ${name}, your account was locked after too many failed sign-in attempts. It unlocks at ${unlockAt.toISOString()}.`,
      });
    } catch (error) {
      this.logger.error(`Failed to send account locked email to=${to}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
