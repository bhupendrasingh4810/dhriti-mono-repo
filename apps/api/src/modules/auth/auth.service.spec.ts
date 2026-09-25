import * as bcrypt from "bcryptjs";
import type { User, UserAuth } from "@prisma/client";

type UserWithRelations = User & { auth: UserAuth | null; profile: unknown };

function makeAuth(overrides: Partial<UserAuth> = {}): UserAuth {
  return {
    id: "auth-1",
    userId: "user-1",
    passwordHash: "hashed:old",
    emailVerificationToken: null,
    emailVerificationSentAt: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    phoneVerificationToken: null,
    phoneVerificationSentAt: null,
    phoneVerifiedAt: null,
    emailVerifiedAt: NOW,
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodesUsed: 0,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastPasswordChange: null,
    passwordExpiresAt: null,
    lastLoginAt: null,
    lastLoginIp: null,
    loginCount: 0,
    source: "email",
    sourceMetadata: null,
    externalId: null,
    platformRole: null,
    ...overrides,
  } as UserAuth;
}

import { AuthService } from "./services/auth.service";
import { ErrorCode } from "../../common/errors/error-codes";

jest.mock("bcryptjs", () => ({
  hash: jest.fn(async (value: string) => `hashed:${value}`),
  compare: jest.fn(async () => true),
}));

const NOW = new Date("2026-01-01T00:00:00.000Z");

function makeUser(overrides: Partial<UserAuth & User> = {}): UserWithRelations {
  return {
    id: "user-1",
    email: "jane@acme.com",
    name: "Jane Doe",
    avatarUrl: null,
    status: "ACTIVE",
    managerId: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    auth: makeAuth(overrides),
    profile: null,
  } as UserWithRelations;
}

function makePrismaMock() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userAuth: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    userIdentity: { findUnique: jest.fn() },
    userSession: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    verificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organizationMember: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (transaction: typeof prisma) => unknown) => callback(prisma));
  return prisma;
}

type PrismaMock = ReturnType<typeof makePrismaMock>;

function makeSut(prisma: PrismaMock) {
  const config = {
    bcryptRounds: 12,
    lockoutThreshold: 10,
    lockoutDurationMinutes: 15,
    jwtAccessTtlSeconds: 900,
    jwtMfaTtlSeconds: 300,
    emailVerificationTokenTtlSeconds: 1200,
    webAppUrl: "http://localhost:3000",
  };
  const tokens = {
    signAccessToken: jest.fn(async () => "access-token"),
    signMfaToken: jest.fn(async () => "mfa-token"),
    verifyMfaToken: jest.fn(async () => ({ sub: "user-1", purpose: "mfa" as const })),
    generateOpaqueToken: jest.fn(() => "opaque-token"),
    generateSixDigitOtp: jest.fn(() => "123456"),
    hashToken: jest.fn((t: string) => `hash:${t}`),
  };
  const sessions = {
    createSession: jest.fn(async () => ({
      sessionId: "session-1",
      refreshToken: "refresh-token",
      expiresAt: new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000),
    })),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(async () => undefined),
    revokeAllUserSessions: jest.fn(async () => 3),
    getSessionOrganization: jest.fn(async () => null),
    isSessionActive: jest.fn(async () => true),
  };
  const mfa = {
    verifyTotpForUser: jest.fn(async () => true),
    consumeRecoveryCode: jest.fn(async () => true),
  };
  const emailSender = {
    sendWelcomeEmail: jest.fn(async () => undefined),
    sendVerificationEmail: jest.fn(async () => undefined),
    sendPasswordResetEmail: jest.fn(async () => undefined),
    sendResetPasswordConfirmationEmail: jest.fn(async () => undefined),
    sendAccountLockedEmail: jest.fn(async () => undefined),
  };

  const service = new AuthService(
    prisma as never,
    config as never,
    tokens as never,
    sessions as never,
    mfa as never,
    emailSender as never,
  );

  return { service, config, tokens, sessions, mfa, emailSender };
}

const loginDto = { email: "jane@acme.com", password: "Sup3rSecure!" };

describe("AuthService.register", () => {
  it("creates a user and sends a verification email", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeUser({ emailVerifiedAt: null, status: "PENDING_VERIFICATION" }));
    prisma.verificationToken.create.mockResolvedValue({});
    const { service, emailSender } = makeSut(prisma);

    const result = await service.register({
      email: "Jane@Acme.com",
      name: " Jane Doe ",
      password: "Sup3rSecure!",
      isTermsAccepted: true,
    });

    expect(result).toEqual({ email: "jane@acme.com" });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jane@acme.com",
          name: "Jane Doe",
          auth: { create: { passwordHash: "hashed:Sup3rSecure!" } },
        }),
      }),
    );
    expect(prisma.verificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "EMAIL_VERIFICATION" }),
      }),
    );
    expect(emailSender.sendVerificationEmail).toHaveBeenCalledWith(
      "jane@acme.com",
      "Jane Doe",
      "123456",
      "http://localhost:3000/verify?email=jane%40acme.com&token=opaque-token",
    );
  });

  it("rejects duplicate emails with EMAIL_ALREADY_REGISTERED", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser());
    const { service } = makeSut(prisma);

    await expect(
      service.register({ email: "jane@acme.com", name: "Jane", password: "Sup3rSecure!", isTermsAccepted: true }),
    ).rejects.toMatchObject({ code: ErrorCode.EMAIL_ALREADY_REGISTERED });
  });
});

describe("AuthService.login", () => {
  it("returns tokens for valid verified credentials", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.user.update.mockResolvedValue(makeUser());
    prisma.organizationMember.findFirst.mockResolvedValue({
      organization: { id: "org-1", name: "Acme" },
    });
    const { service, sessions } = makeSut(prisma);

    const result = await service.login(loginDto, {});

    expect(result).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      sessionId: "session-1",
      user: {
        id: "user-1",
        email: "jane@acme.com",
        name: "Jane Doe",
        organization: { id: "org-1", name: "Acme" },
      },
    });
    expect(sessions.createSession).toHaveBeenCalledWith("user-1", "org-1", {});
  });

  it("throws INVALID_CREDENTIALS for unknown email without leaking", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const { service } = makeSut(prisma);

    await expect(service.login(loginDto, {})).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("increments failed attempts on bad password", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 3 }));
    prisma.user.update.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    const { service } = makeSut(prisma);

    await expect(service.login(loginDto, {})).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
    expect(prisma.userAuth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { failedLoginAttempts: 4, lockedUntil: null },
      }),
    );
  });

  it("locks the account at the threshold and sends a notification", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser({ failedLoginAttempts: 9 }));
    prisma.user.update.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    const { service, emailSender } = makeSut(prisma);

    await expect(service.login(loginDto, {})).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
    expect(prisma.userAuth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          failedLoginAttempts: 10,
          lockedUntil: expect.any(Date),
        }),
      }),
    );
    expect(emailSender.sendAccountLockedEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects locked accounts before checking the password", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser({ lockedUntil: new Date(Date.now() + 60_000) }));
    const { service } = makeSut(prisma);

    await expect(service.login(loginDto, {})).rejects.toMatchObject({
      code: ErrorCode.ACCOUNT_LOCKED,
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("rejects unverified accounts", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser({ emailVerifiedAt: null }));
    prisma.user.update.mockResolvedValue(makeUser());
    const { service } = makeSut(prisma);

    await expect(service.login(loginDto, {})).rejects.toMatchObject({
      code: ErrorCode.EMAIL_NOT_VERIFIED,
    });
  });

  it("returns an MFA challenge when MFA is enabled", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser({ mfaEnabled: true }));
    prisma.user.update.mockResolvedValue(makeUser());
    const { service, sessions } = makeSut(prisma);

    const result = await service.login(loginDto, {});

    expect(result).toEqual({
      mfaRequired: true,
      mfaToken: "mfa-token",
      mfaTokenExpiresIn: 300,
    });
    expect(sessions.createSession).not.toHaveBeenCalled();
  });
});

describe("AuthService MFA completion", () => {
  it("completes MFA login with a valid TOTP", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const { service } = makeSut(prisma);

    const result = await service.completeMfaLogin("mfa-token", "123456", {});
    expect(result.accessToken).toBe("access-token");
  });

  it("rejects invalid TOTP codes", async () => {
    const prisma = makePrismaMock();
    const { service, mfa } = makeSut(prisma);
    mfa.verifyTotpForUser.mockResolvedValueOnce(false);

    await expect(service.completeMfaLogin("mfa-token", "000000", {})).rejects.toMatchObject({
      code: ErrorCode.MFA_CODE_INVALID,
    });
  });

  it("completes login with a recovery code and consumes it", async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const { service, mfa } = makeSut(prisma);

    await service.completeRecoveryLogin("mfa-token", "ab12-cd34-ef56", {});
    expect(mfa.consumeRecoveryCode).toHaveBeenCalledWith("user-1", "ab12-cd34-ef56");
  });

  it("rejects already-used recovery codes", async () => {
    const prisma = makePrismaMock();
    const { service, mfa } = makeSut(prisma);
    mfa.consumeRecoveryCode.mockResolvedValueOnce(false);

    await expect(service.completeRecoveryLogin("mfa-token", "ab12-cd34-ef56", {})).rejects.toMatchObject({
      code: ErrorCode.RECOVERY_CODE_INVALID,
    });
  });
});

describe("AuthService email verification", () => {
  it("verifyEmail marks the user verified and active", async () => {
    const prisma = makePrismaMock();
    prisma.verificationToken.findUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      user: { email: "jane@acme.com", name: "Jane Doe" },
      type: "EMAIL_VERIFICATION",
      otpHash: "hash:123456",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.verificationToken.update.mockResolvedValue({
      userId: "user-1",
      user: { email: "jane@acme.com", name: "Jane Doe" },
    });
    prisma.user.update.mockResolvedValue(makeUser());
    prisma.user.findUnique.mockResolvedValue(makeUser());
    const { service, emailSender } = makeSut(prisma);

    prisma.organizationMember.findFirst.mockResolvedValue({
      organization: { id: "org-1", name: "Acme" },
    });
    const result = await service.verifyEmail("jane@acme.com", "raw-token", "123456");

    expect(result.user.organization).toEqual({ id: "org-1", name: "Acme" });

    expect(prisma.userAuth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { emailVerifiedAt: expect.any(Date) },
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
    expect(emailSender.sendWelcomeEmail).toHaveBeenCalledWith("jane@acme.com", "Jane Doe", undefined);
  });

  it("verifyEmail rejects already-used tokens", async () => {
    const prisma = makePrismaMock();
    prisma.verificationToken.findUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      user: { email: "jane@acme.com", name: "Jane Doe" },
      type: "EMAIL_VERIFICATION",
      otpHash: "hash:123456",
      usedAt: NOW,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { service } = makeSut(prisma);

    await expect(service.verifyEmail("jane@acme.com", "raw-token", "123456")).rejects.toMatchObject({
      code: ErrorCode.TOKEN_ALREADY_USED,
    });
  });
});
