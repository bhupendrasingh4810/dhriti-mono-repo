import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { SecretEncryptionService } from "../../../common/crypto/secret-encryption.service";
import { ApiConfigService } from "../../../config/config.service";
import { OidcProviderService } from "./oidc-provider.service";
import { AuthService } from "./auth.service";
import type { ConfigureOidcDto, FinishOidcDto } from "../dto/oidc.dto";
import type { SessionContext } from "./session.service";

type PendingLogin = { organizationId: string; version: number; verifier: string; nonce: string; bindingHash: string };
const opaque = () => randomBytes(32).toString("base64url");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const publicSelect = {
  organizationId: true,
  issuer: true,
  clientId: true,
  enabled: true,
  lastVerifiedAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OidcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly secrets: SecretEncryptionService,
    private readonly config: ApiConfigService,
    private readonly provider: OidcProviderService,
    private readonly auth: AuthService,
  ) {}

  get redirectUri() {
    return `${this.config.webAppUrl.replace(/\/$/, "")}/api/auth/sso/callback`;
  }

  async configuration(organizationId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }
    return {
      configuration: await this.prisma.organizationOidc.findUnique({ where: { organizationId }, select: publicSelect }),
      redirectUri: this.redirectUri,
    };
  }

  async configure(organizationId: string, dto: ConfigureOidcDto, actorUserId: string) {
    await this.configuration(organizationId);
    if (dto.enabled) {
      await this.provider.discover(dto.issuer, dto.clientId, dto.clientSecret);
    } else if (!this.config.oidcAllowedIssuers.includes(dto.issuer)) {
      throw new BadRequestException("OIDC issuer is not approved");
    }
    const clientSecretEncrypted = this.secrets.encrypt(dto.clientSecret);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.organizationOidc.findUnique({ where: { organizationId } });
      if (current && current.issuer !== dto.issuer) {
        throw new ConflictException("Disable and migrate identities before changing an organization's OIDC issuer");
      }
      const result = await tx.organizationOidc.upsert({
        where: { organizationId },
        create: {
          organizationId,
          issuer: dto.issuer,
          clientId: dto.clientId,
          clientSecretEncrypted,
          enabled: dto.enabled,
        },
        update: {
          clientId: dto.clientId,
          clientSecretEncrypted,
          enabled: dto.enabled,
          version: { increment: 1 },
          lastVerifiedAt: null,
        },
        select: publicSelect,
      });
      await tx.auditLog.create({
        data: {
          action: "security.oidc.configured",
          actorUserId,
          organizationId,
          resourceType: "OrganizationOidc",
          resourceId: organizationId,
          metadata: { issuer: dto.issuer, enabled: dto.enabled },
        },
      });
      return result;
    });
  }

  async start(organizationSlug: string) {
    const record = await this.prisma.organizationOidc.findFirst({
      where: {
        enabled: true,
        organization: { slug: organizationSlug, deletedAt: null, suspendedAt: null, archivedAt: null },
      },
    });
    if (!record) {
      throw new NotFoundException("SSO is not configured for this organization");
    }
    const { oidc, configuration } = await this.provider.discover(
      record.issuer,
      record.clientId,
      this.secrets.decrypt(record.clientSecretEncrypted),
    );
    const state = opaque(),
      binding = opaque(),
      nonce = opaque();
    const verifier = oidc.randomPKCECodeVerifier();
    const url = oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: this.redirectUri,
      scope: "openid email",
      state,
      nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
      code_challenge_method: "S256",
    });
    if (
      url.protocol !== "https:" ||
      !this.config.oidcAllowedIssuers.some((issuer) => new URL(issuer).origin === url.origin)
    ) {
      throw new BadRequestException("OIDC authorization endpoint origin is not approved");
    }
    await this.redis.setJson(
      `auth:oidc:${hash(state)}`,
      {
        organizationId: record.organizationId,
        version: record.version,
        verifier,
        nonce,
        bindingHash: hash(binding),
      } satisfies PendingLogin,
      600,
    );
    return { authorizationUrl: url.href, binding };
  }

  /** One-use, ten-minute state is bound to an HttpOnly browser cookie. Only pre-existing active members can sign in. */
  async finish(dto: FinishOidcDto, context: SessionContext) {
    const url = new URL(dto.callbackUrl);
    if (`${url.origin}${url.pathname}` !== this.redirectUri || !url.searchParams.get("state")) {
      throw new BadRequestException("Invalid SSO callback");
    }
    const state = url.searchParams.get("state");
    if (!state) {
      throw new BadRequestException("Missing SSO state");
    }
    if (!/^[\w-]{43}$/.test(state)) {
      throw new BadRequestException("Invalid SSO state");
    }
    const raw = await this.redis.raw.getdel(`auth:oidc:${hash(state)}`);
    if (!raw) {
      throw new UnauthorizedException("SSO login expired or already used");
    }
    const pending: PendingLogin = JSON.parse(raw);
    if (!timingSafeEqual(Buffer.from(hash(dto.binding)), Buffer.from(pending.bindingHash))) {
      throw new UnauthorizedException("SSO browser binding mismatch");
    }
    const record = await this.prisma.organizationOidc.findFirst({
      where: {
        organizationId: pending.organizationId,
        version: pending.version,
        enabled: true,
        organization: { deletedAt: null, suspendedAt: null, archivedAt: null },
      },
    });
    if (!record) {
      throw new UnauthorizedException("SSO configuration changed; sign in again");
    }
    const { oidc, configuration } = await this.provider.discover(
      record.issuer,
      record.clientId,
      this.secrets.decrypt(record.clientSecretEncrypted),
    );
    const tokens = await oidc.authorizationCodeGrant(configuration, url, {
      pkceCodeVerifier: pending.verifier,
      expectedState: state,
      expectedNonce: pending.nonce,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims || typeof claims.email !== "string" || claims.email_verified !== true || !claims.sub) {
      throw new UnauthorizedException("SSO requires a verified email claim");
    }
    const email = claims.email.toLowerCase();
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId: record.organizationId,
        deletedAt: null,
        status: "ACTIVE",
        user: { email, deletedAt: null, status: "ACTIVE" },
      },
      select: { userId: true },
    });
    if (!member) {
      throw new UnauthorizedException("Only existing active organization members may sign in");
    }
    const identity = await this.prisma.organizationOidcIdentity.findUnique({
      where: { organizationId_subject: { organizationId: record.organizationId, subject: claims.sub } },
    });
    if (identity && identity.userId !== member.userId) {
      throw new UnauthorizedException("SSO identity does not match the member");
    }
    await this.prisma.organizationOidcIdentity.upsert({
      where: { organizationId_userId: { organizationId: record.organizationId, userId: member.userId } },
      create: { organizationId: record.organizationId, userId: member.userId, subject: claims.sub },
      update: {},
    });
    const boundIdentity = await this.prisma.organizationOidcIdentity.findUniqueOrThrow({
      where: { organizationId_userId: { organizationId: record.organizationId, userId: member.userId } },
    });
    if (boundIdentity.subject !== claims.sub) {
      throw new UnauthorizedException("SSO subject changed; contact an administrator");
    }
    const response = await this.auth.loginWithSso(
      member.userId,
      record.organizationId,
      Array.isArray(claims.amr) && claims.amr.includes("mfa"),
      context,
      pending.version,
    );
    await this.prisma.organizationOidc.updateMany({
      where: { organizationId: record.organizationId, version: pending.version },
      data: { lastVerifiedAt: new Date() },
    });
    return response;
  }
}
