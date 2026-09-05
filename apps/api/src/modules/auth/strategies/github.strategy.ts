import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-github2";

import { ApiConfigService } from "../../../config/config.service";
import type { OAuthProfile } from "../services/auth.service";

type GithubVerifyCallback = (error: Error | null, profile?: OAuthProfile) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(config: ApiConfigService) {
    const credentials = config.githubOAuth;
    if (!credentials) {
      throw new Error("GitHub OAuth is not configured");
    }
    super({
      clientID: credentials.clientId,
      clientSecret: credentials.clientSecret,
      callbackURL: credentials.callbackUrl,
      scope: ["user:email"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: GithubVerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("GitHub account has no accessible email"));
      return;
    }

    done(null, {
      provider: "GITHUB",
      providerAccountId: profile.id,
      email,
      name: profile.displayName || profile.username || email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      emailVerified: true,
    });
  }
}
