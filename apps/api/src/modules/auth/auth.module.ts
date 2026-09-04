import { Module, type Provider } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { ApiConfigService } from "../../config/config.service";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenService } from "./token.service";
import { SessionService } from "./session.service";
import { MfaService } from "./mfa.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";

/**
 * OAuth strategies are instantiated only when the provider's credentials are
 * configured, so a missing provider never breaks application boot.
 */
const conditionalStrategyProviders: Provider[] = [
  {
    provide: GoogleStrategy,
    useFactory: (config: ApiConfigService) =>
      config.googleOAuth ? new GoogleStrategy(config) : null,
    inject: [ApiConfigService],
  },
  {
    provide: GithubStrategy,
    useFactory: (config: ApiConfigService) =>
      config.githubOAuth ? new GithubStrategy(config) : null,
    inject: [ApiConfigService],
  },
];

@Module({
  imports: [
    PassportModule.register({}),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    MfaService,
    ...conditionalStrategyProviders,
  ],
  exports: [AuthService, SessionService, TokenService, MfaService, JwtModule],
})
export class AuthModule {}
