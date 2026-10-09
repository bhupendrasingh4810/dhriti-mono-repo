import { Global, Module } from "@nestjs/common";

import { EntitlementService } from "./services/entitlement.service";
import { OrganizationAccessController } from "./controllers/organization-access.controller";
import { OrganizationDepartmentService } from "./services/organization-department.service";
import { OrganizationPermissionGroupService } from "./services/organization-permission-group.service";
import { OrganizationTeamService } from "./services/organization-team.service";
import { PermissionService } from "./services/permission.service";
import { PlatformRoleService } from "./services/platform-role.service";
import { SubscriptionService } from "./services/subscription.service";
import { BillingWebhookService } from "./services/billing-webhook.service";
import { BillingWebhookController } from "./controllers/billing-webhook.controller";
import { BillingWebhookRateLimitGuard } from "./billing-webhook-rate-limit.guard";

@Global()
@Module({
  controllers: [OrganizationAccessController, BillingWebhookController],
  providers: [
    EntitlementService,
    PermissionService,
    SubscriptionService,
    BillingWebhookService,
    BillingWebhookRateLimitGuard,
    OrganizationPermissionGroupService,
    OrganizationDepartmentService,
    OrganizationTeamService,
    PlatformRoleService,
  ],
  exports: [
    EntitlementService,
    PermissionService,
    SubscriptionService,
    BillingWebhookService,
    OrganizationPermissionGroupService,
    OrganizationDepartmentService,
    OrganizationTeamService,
    PlatformRoleService,
  ],
})
export class AuthorizationModule {}
