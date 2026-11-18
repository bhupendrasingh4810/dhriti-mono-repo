import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../../../common/decorators/public.decorator";
import { PublicAuthRateLimitGuard } from "../../../common/guards/public-auth-rate-limit.guard";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { SecurityAccessGuard } from "../../control/platform/security/security-access.guard";
import { ConfigureOidcDto, FinishOidcDto, StartOidcDto } from "../dto/oidc.dto";
import { OidcService } from "../services/oidc.service";

@ApiTags("auth/sso")
@Controller()
export class OidcController {
  constructor(private readonly sso: OidcService) {}

  @ApiBearerAuth()
  @UseGuards(SecurityAccessGuard)
  @Get("control/platform/security/organizations/:id/oidc")
  configuration(@Param("id", ParseUUIDPipe) id: string) {
    return this.sso.configuration(id);
  }

  @ApiBearerAuth()
  @UseGuards(SecurityAccessGuard)
  @Put("control/platform/security/organizations/:id/oidc")
  configure(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConfigureOidcDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sso.configure(id, dto, user.userId);
  }

  @Public()
  @UseGuards(PublicAuthRateLimitGuard)
  @Post("auth/sso/start")
  start(@Body() dto: StartOidcDto) {
    return this.sso.start(dto.organizationSlug);
  }

  @Public()
  @UseGuards(PublicAuthRateLimitGuard)
  @Post("auth/sso/callback")
  finish(@Body() dto: FinishOidcDto, @Req() request: Request) {
    return this.sso.finish(dto, { ipAddress: request.ip, userAgent: request.get("user-agent") });
  }
}
