import { BadRequestException, Controller, Headers, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { Public } from "../../common/decorators/public.decorator";
import { BillingWebhookService } from "./billing-webhook.service";
import { BillingWebhookRateLimitGuard } from "./billing-webhook-rate-limit.guard";

interface RawBodyRequest extends Request { rawBody?: Buffer }

@ApiTags("billing")
@Controller("billing/webhooks")
@UseGuards(BillingWebhookRateLimitGuard)
export class BillingWebhookController {
  constructor(private readonly webhooks: BillingWebhookService) {}

  @Public()
  @Post(":provider")
  @HttpCode(200)
  async receive(@Req() request: RawBodyRequest, @Headers("stripe-signature") signature: string | undefined) {
    if (!signature || !request.rawBody) throw new BadRequestException("Invalid billing webhook request");
    return this.webhooks.process(request.params.provider, signature, request.rawBody);
  }
}