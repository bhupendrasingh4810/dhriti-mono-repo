import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { User, UserAuth, UserProfile } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { ApiConfigService } from "../../../config/config.service";
import { EmailService } from "../../notification/email.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";

import { TokenService } from "./token.service";
import { SessionService } from "./session.service";

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

type UserWithRelations = User & { auth: UserAuth | null; profile: UserProfile | null };

const withAuthAndProfile = { auth: true, profile: true } as const;

@Injectable()
export class PasswordService {
    private readonly logger = new Logger(PasswordService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ApiConfigService,
        private readonly tokens: TokenService,
        private readonly sessions: SessionService,
        private readonly email: EmailService,
    ) { }

    /**
     * Initiates the forgot password process by generating a password reset token and sending a reset email.
     * @param emailAddress The email address of the user who forgot their password.
     * @throws AppError if the email address is not associated with any user.
     */
    async forgotPassword(emailAddress: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email: emailAddress.toLowerCase() },
        });
        if (!user || user.deletedAt) {
            return;
        }

        const token = this.tokens.generateOpaqueToken();
        await this.prisma.verificationToken.create({
            data: {
                userId: user.id,
                tokenHash: this.tokens.hashToken(token),
                type: "PASSWORD_RESET",
                expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
            },
        });

        const resetUrl = `${this.config.webAppUrl}/reset-password?token=${encodeURIComponent(token)}`;
        await this.email.sendResetPasswordEmail(user.email, resetUrl, PASSWORD_RESET_TOKEN_TTL_MS);
    }

    /**
     * Resets the user's password using the provided password reset token.
     * @param token The password reset token.
     * @param newPassword The new password to set.
     * @param ipAddress The IP address from which the request originated.
     * @param deviceInfo Information about the device making the request.
     * @throws AppError if the token is invalid or expired.
     */
    async resetPassword(
        token: string,
        newPassword: string,
        ipAddress = "Unknown",
        deviceInfo = "Unknown device",
    ): Promise<void> {
        const record = await this.consumeToken(token, "PASSWORD_RESET");
        const passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);

        await this.prisma.userAuth.upsert({
            where: { userId: record.userId },
            create: { userId: record.userId, passwordHash },
            update: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
        });
        await this.prisma.user.update({
            where: { id: record.userId },
            data: { status: "ACTIVE" },
        });
        await this.sessions.revokeAllUserSessions(record.userId);

        const resetAt = new Date();
        try {
            await this.email.sendResetPasswordConfirmationEmail(
                record.user.email,
                record.user.name,
                resetAt.toLocaleDateString("en-US"),
                resetAt.toLocaleTimeString("en-US"),
                ipAddress,
                deviceInfo,
            );
        } catch (error) {
            this.logger.error(
                `Password reset confirmation email failed for user=${record.userId}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Changes the user's password.
     * @param current The currently authenticated user.
     * @param currentPassword The user's current password.
     * @param newPassword The new password to set.
     * @throws AppError if the current password is incorrect or if the account uses social sign-in.
     */
    async changePassword(
        current: AuthenticatedUser,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.requireUser(current.userId);
        if (!user.auth?.passwordHash) {
            throw new AppError(
                ErrorCode.OAUTH_ACCOUNT_EXISTS,
                "This account uses social sign-in and has no password",
                HttpStatus.BAD_REQUEST,
            );
        }

        const matches = await bcrypt.compare(currentPassword, user.auth.passwordHash);
        if (!matches) {
            throw new AppError(
                ErrorCode.PASSWORD_INCORRECT,
                "Current password is incorrect",
                HttpStatus.BAD_REQUEST,
            );
        }

        const passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);
        await this.prisma.userAuth.update({ where: { userId: user.id }, data: { passwordHash } });
        await this.sessions.revokeAllUserSessions(user.id, current.sessionId);
    }

    /**
     * Verifies the user's current password without mutating anything (e.g. before MFA disable).
     * @param userId The ID of the user whose password is being verified.
     * @param password The password to verify.
     * @throws AppError if the password is incorrect or if the account uses social sign-in.
     */
    async verifyUserPassword(userId: string, password: string): Promise<void> {
        const user = await this.requireUser(userId);
        if (!user.auth?.passwordHash) {
            throw new AppError(
                ErrorCode.OAUTH_ACCOUNT_EXISTS,
                "This account uses social sign-in and has no password",
                HttpStatus.BAD_REQUEST,
            );
        }
        const matches = await bcrypt.compare(password, user.auth.passwordHash);
        if (!matches) {
            throw new AppError(
                ErrorCode.PASSWORD_INCORRECT,
                "Password is incorrect",
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * Consumes a verification token, marking it as used and validating its type, OTP, and email address.
     * @param token The verification token to be consumed.
     * @param type The type of the verification token ("EMAIL_VERIFICATION" or "PASSWORD_RESET").
     * @param otp The one-time password associated with the token, if applicable.
     * @param emailAddress The email address associated with the token, if applicable.
     * @returns The updated verification token record.
     * @throws AppError if the token is invalid, already used, expired, or does not match the provided OTP or email address.
     */
    private async consumeToken(
        token: string,
        type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
        otp?: string,
        emailAddress?: string,
    ) {
        const record = await this.prisma.verificationToken.findUnique({
            where: { tokenHash: this.tokens.hashToken(token) },
            include: { user: { select: { email: true, name: true } } },
        });

        if (!record || record.type !== type) {
            throw new AppError(ErrorCode.TOKEN_INVALID, "Token is invalid", HttpStatus.BAD_REQUEST);
        }
        const otpHash = (record as typeof record & { otpHash: string | null }).otpHash;
        if (type === "EMAIL_VERIFICATION" && (!otp || otpHash !== this.tokens.hashToken(otp))) {
            throw new AppError(ErrorCode.TOKEN_INVALID, "Verification code is invalid", HttpStatus.BAD_REQUEST);
        }
        if (type === "EMAIL_VERIFICATION" && record.user.email !== emailAddress?.trim().toLowerCase()) {
            throw new AppError(ErrorCode.TOKEN_INVALID, "Verification email is invalid", HttpStatus.BAD_REQUEST);
        }
        if (record.usedAt) {
            throw new AppError(ErrorCode.TOKEN_ALREADY_USED, "Token was already used", HttpStatus.BAD_REQUEST);
        }
        if (record.expiresAt <= new Date()) {
            throw new AppError(ErrorCode.TOKEN_EXPIRED, "Token has expired", HttpStatus.BAD_REQUEST);
        }

        return this.prisma.verificationToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
            include: { user: { select: { email: true, name: true } } },
        });
    }

    /**
     * Retrieves the user with the specified ID, throwing an error if the user does not exist or has been deleted.
     * @param userId The ID of the user to retrieve.
     * @returns The user with the specified ID.
     * @throws AppError if the user is not found or has been deleted.
     */
    private async requireUser(userId: string): Promise<UserWithRelations> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: withAuthAndProfile,
        });
        if (!user || user.deletedAt) {
            throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
        }
        return user;
    }
}
