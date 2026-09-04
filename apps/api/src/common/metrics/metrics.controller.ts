import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../decorators/public.decorator";
import { MetricsService } from "./metrics.service";

@ApiTags("metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header("Content-Type", "text/plain; version=0.0.4")
  @ApiOperation({ summary: "Prometheus metrics (text exposition format)" })
  render(): string {
    return this.metrics.render();
  }
}
