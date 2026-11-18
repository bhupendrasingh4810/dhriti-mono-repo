import { Module, type Provider } from "@nestjs/common";
import { ProfileService } from "./services/profile.service";
import { PassportModule } from "@nestjs/passport";
import { LoginController } from "./controllers/login.controller";
import { OAuthController } from "./controllers/oauth.controller";
import { PasswordController } from "./controllers/password.controller";
import { ProfileController } from "./controllers/profile.controller";
import { MfaController } from "./controllers/mfa.controller";
import { RegistrationController } from "./controllers/registration.controller";

import { ApiConfigService } from "../../config/config.service";

import { AuthService } from "./services/auth.service";
import { SessionModule } from "./session.module";
import { MfaService } from "./services/mfa.service";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { PasswordService } from "./services/password.service";
import { PublicAuthRateLimitGuard } from "../../common/guards/public-auth-rate-limit.guard";
import { AuditModule } from "../audit/audit.module";
import { SecurityModule } from "../control/platform/security/security.module";
import { OidcService } from "./services/oidc.service";
import { OidcProviderService } from "./services/oidc-provider.service";
import { OidcController } from "./controllers/oidc.controller";

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
  imports: [PassportModule.register({}), SessionModule, AuditModule, SecurityModule],
  controllers: [
    RegistrationController,
    LoginController,
    OAuthController,
    PasswordController,
    ProfileController,
    MfaController,
    OidcController,
  ],
  providers: [
    AuthService,
    OidcService,
    OidcProviderService,
    MfaService,
    PasswordService,
    ProfileService,
    PublicAuthRateLimitGuard,
    ...conditionalStrategyProviders,
  ],
  exports: [AuthService, SessionModule, MfaService],
})
export class AuthModule {}
