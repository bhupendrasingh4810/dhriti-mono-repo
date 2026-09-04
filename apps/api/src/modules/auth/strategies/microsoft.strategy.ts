import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-microsoft";

import { ApiConfigService } from "../../../config/config.service";
import type { OAuthProfile } from "../auth.service";

interface MicrosoftProfile {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
  _json?: { userPrincipalName?: string; mail?: string };
}

type MicrosoftVerifyCallback = (error: Error | null, profile?: OAuthProfile) => void;

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, "microsoft") {
  constructor(config: ApiConfigService) {
    const credentials = config.microsoftOAuth;
    if (!credentials) {
      throw new Error("Microsoft OAuth is not configured");
    }
    super({
      clientID: credentials.clientId,
      clientSecret: credentials.clientSecret,
      callbackURL: credentials.callbackUrl,
      tenant: credentials.tenant,
      scope: ["user.read"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: MicrosoftProfile,
    done: MicrosoftVerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? profile._json?.mail ?? profile._json?.userPrincipalName;
    if (!email) {
      done(new Error("Microsoft account has no accessible email"));
      return;
    }

    done(null, {
      provider: "MICROSOFT",
      providerAccountId: profile.id,
      email,
      name: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      emailVerified: true,
    });
  }
}
