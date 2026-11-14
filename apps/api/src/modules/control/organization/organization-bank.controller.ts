import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { AccessGuard } from "../../../common/guards/access.guard";
import { OrganizationBankService } from "./organization-bank.service";
import { CreateOrganizationBankDto, ReviewOrganizationBankDto } from "./dto/organization-bank.dto";

@ApiTags("control/organization")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@RequirePermission("organization.settings.manage")
@Controller("control/organization/bank-accounts")
export class OrganizationBankController {
  constructor(private readonly banks: OrganizationBankService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list(@CurrentOrganization() org: OrganizationContext) {
    return this.banks.list(org.organizationId);
  }

  @Get(":id/review")
  @Header("Cache-Control", "no-store")
  reviewEvidence(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.banks.reviewEvidence(org.organizationId, user.userId, id);
  }

  @Post()
  create(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationBankDto,
  ) {
    return this.banks.create(org.organizationId, user.userId, dto);
  }

  @Post(":id/review")
  review(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewOrganizationBankDto,
  ) {
    return this.banks.review(org.organizationId, user.userId, id, dto);
  }

  @Post(":id/archive")
  archive(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.banks.archive(org.organizationId, user.userId, id);
  }

  @Post(":id/verify")
  verify(@Param("id", ParseUUIDPipe) _id: string) {
    return this.banks.providerVerification();
  }
}
