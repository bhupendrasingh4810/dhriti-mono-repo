import { Global, Module } from "@nestjs/common";

import { EntitlementService } from "./entitlement.service";
import { OrganizationAccessController } from "./organization-access.controller";
import { OrganizationDepartmentService } from "./organization-department.service";
import { OrganizationPermissionGroupService } from "./organization-permission-group.service";
import { OrganizationTeamService } from "./organization-team.service";
import { PermissionService } from "./permission.service";
import { PlatformRoleService } from "./platform-role.service";
import { SubscriptionService } from "./subscription.service";
import { BillingWebhookService } from "./billing-webhook.service";
import { BillingWebhookController } from "./billing-webhook.controller";
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
        PlatformRoleService],
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
export class AuthorizationModule { }