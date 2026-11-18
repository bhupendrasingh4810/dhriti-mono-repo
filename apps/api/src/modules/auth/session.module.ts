import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";

/** Auth and security administration share one revocation/cache contract without a module cycle. */
@Module({
  imports: [JwtModule.register({})],
  providers: [SessionService, TokenService],
  exports: [SessionService, TokenService, JwtModule],
})
export class SessionModule {}
