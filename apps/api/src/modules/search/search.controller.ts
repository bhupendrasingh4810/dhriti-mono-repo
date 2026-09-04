import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../common/decorators/organization.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { SearchService, type SearchResult } from "./search.service";
import { SearchQueryDto } from "./dto/search.dto";

@ApiTags("search")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Cross-app full-text search (messages, issues, pages, events, users)" })
  async run(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResult[]> {
    return this.search.search(organization.organizationId, user.userId, query);
  }

  @Get("history")
  @ApiOperation({ summary: "Recent search queries for the current user" })
  async history(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<string[]> {
    return this.search.history(organization.organizationId, user.userId);
  }
}
