import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";

import { ApiConfigService } from "../../../config/config.service";
import type { OAuthProfile } from "../services/auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ApiConfigService) {
    const credentials = config.googleOAuth;
    console.log('Google OAuth credentials:', credentials);
    if (!credentials) {
      throw new Error("Google OAuth is not configured");
    }
    super({
      clientID: credentials.clientId,
      clientSecret: credentials.clientSecret,
      callbackURL: credentials.callbackUrl,
      scope: ["openid", "email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google account has no accessible email"), undefined);
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: "GOOGLE",
      providerAccountId: profile.id,
      email,
      name: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      emailVerified: profile.emails?.[0]?.verified === true,
    };
    done(null, oauthProfile);
  }
}
