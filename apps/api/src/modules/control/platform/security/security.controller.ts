import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthenticatedUser } from "../../../../common/decorators/current-user.decorator";
import { SecurityAccessGuard } from "./security-access.guard";
import { SecurityService } from "./security.service";
import {
  BlockIpDto,
  RevokeSecuritySessionDto,
  SecurityEventsDto,
  SecurityPageDto,
  SecuritySessionsDto,
} from "./security.dto";
import { SecurityOperationsService } from "./security-operations.service";
import { SecurityIntegrationsService } from "./security-integrations.service";

@ApiTags("control/platform/security")
@ApiBearerAuth()
@UseGuards(SecurityAccessGuard)
@Controller("control/platform/security")
export class SecurityController {
  constructor(
    private readonly security: SecurityService,
    private readonly operations: SecurityOperationsService,
    private readonly integrations: SecurityIntegrationsService,
  ) {}
  @Get("overview")
  overview() {
    return this.security.overview();
  }
  @Get("events")
  events(@Query() query: SecurityEventsDto) {
    return this.security.events(query);
  }
  @Get("events/:id")
  event(@Param("id", ParseUUIDPipe) id: string) {
    return this.security.event(id);
  }
  @Get("sessions")
  sessions(@Query() query: SecuritySessionsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.operations.activeSessions(query, user.sessionId);
  }
  @Post("sessions/:id/revoke")
  @HttpCode(204)
  revoke(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RevokeSecuritySessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.operations.revoke(id, user.userId, dto.reason);
  }
  @Get("compliance")
  compliance(@Query() query: SecurityPageDto) {
    return this.operations.compliance(query);
  }
  @Get("integrations")
  integrationStatus() {
    return this.integrations.status();
  }
  @Get("deliveries")
  deliveries(@Query() query: SecurityPageDto) {
    return this.integrations.deliveries(query);
  }
  @Post("deliveries/:id/retry")
  @HttpCode(204)
  retryDelivery(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.integrations.retry(id, user.userId);
  }
  @Get("blocked-ips")
  blocked(@Query() query: SecurityPageDto) {
    return this.security.blocked(query);
  }
  @Post("events/:id/resolve")
  @HttpCode(204)
  resolve(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.security.resolve(id, user.userId);
  }
  @Post("blocked-ips")
  @HttpCode(204)
  block(@Body() dto: BlockIpDto, @CurrentUser() user: AuthenticatedUser, @Ip() ip: string) {
    return this.security.block(dto.ipAddress, user.userId, ip, { reason: dto.reason, expiresAt: dto.expiresAt });
  }
  @Delete("blocked-ips/:ip")
  @HttpCode(204)
  unblock(@Param("ip") ip: string, @CurrentUser() user: AuthenticatedUser) {
    return this.security.unblock(ip, user.userId);
  }
}
