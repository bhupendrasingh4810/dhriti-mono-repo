import { Body, Controller, Headers, HttpCode, Ip, Post } from "@nestjs/common";
import { Public } from "../../../../common/decorators/public.decorator";
import { IngestSecurityEventDto } from "./security.dto";
import { SecurityIntegrationsService } from "./security-integrations.service";

@Controller("integrations/security")
export class SecurityIngestController {
  constructor(private readonly integrations: SecurityIntegrationsService) {}

  @Public()
  @Post("events")
  @HttpCode(200)
  ingest(
    @Body() dto: IngestSecurityEventDto,
    @Headers("authorization") authorization: string | undefined,
    @Ip() ip: string,
  ) {
    return this.integrations.ingest(dto, authorization, ip);
  }
}
