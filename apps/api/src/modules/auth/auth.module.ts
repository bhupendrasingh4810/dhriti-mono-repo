import { Module, type Provider } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthLoginController } from "./controllers/login.controller";
import { AuthOAuthController } from "./controllers/oauth.controller";
import { AuthPasswordController } from "./controllers/password.controller";
import { AuthProfileController } from "./controllers/profile.controller";
import { AuthMfaController } from "./controllers/mfa.controller";

import { ApiConfigService } from "../../config/config.service";

import { AuthService } from "./services/auth.service";
import { TokenService } from "./services/token.service";
import { SessionService } from "./services/session.service";
import { MfaService } from "./services/mfa.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { AuthRegistrationController } from "./controllers/registration.controller";

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
  controllers: [
    AuthRegistrationController,
    AuthLoginController,
    AuthOAuthController,
    AuthPasswordController,
    AuthProfileController,
    AuthMfaController,
  ],
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
