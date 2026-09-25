import { Module, type Provider } from "@nestjs/common";
import { ProfileService } from "./services/profile.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LoginController } from "./controllers/login.controller";
import { OAuthController } from "./controllers/oauth.controller";
import { PasswordController } from "./controllers/password.controller";
import { ProfileController } from "./controllers/profile.controller";
import { MfaController } from "./controllers/mfa.controller";
import { RegistrationController } from "./controllers/registration.controller";

import { ApiConfigService } from "../../config/config.service";

import { AuthService } from "./services/auth.service";
import { TokenService } from "./services/token.service";
import { SessionService } from "./services/session.service";
import { MfaService } from "./services/mfa.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { PasswordService } from "./services/password.service";
import { PublicAuthRateLimitGuard } from "../../common/guards/public-auth-rate-limit.guard";

/**
 * OAuth strategies are instantiated only when the provider's credentials are
 * configured, so a missing provider never breaks application boot.
 */
const conditionalStrategyProviders: Provider[] = [
  {
    provide: GoogleStrategy,
    useFactory: (config: ApiConfigService) => (config.googleOAuth ? new GoogleStrategy(config) : null),
    inject: [ApiConfigService],
  },
  {
    provide: GithubStrategy,
    useFactory: (config: ApiConfigService) => (config.githubOAuth ? new GithubStrategy(config) : null),
    inject: [ApiConfigService],
  },
];

@Module({
  imports: [PassportModule.register({}), JwtModule.register({})],
  controllers: [
    RegistrationController,
    LoginController,
    OAuthController,
    PasswordController,
    ProfileController,
    MfaController,
  ],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    MfaService,
    PasswordService,
    ProfileService,
    PublicAuthRateLimitGuard,
    ...conditionalStrategyProviders,
  ],
  exports: [AuthService, SessionService, TokenService, MfaService, JwtModule],
})
export class AuthModule {}
