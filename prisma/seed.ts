import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Sup3rSecure!";

async function main(): Promise<void> {
  console.log("Seeding Dhriti database...");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ---------- Users ----------
  const [alice, bob, priya, marcus, elena, admin] = await Promise.all([
    upsertUser("alice@acme.com", "Alice Sharma", passwordHash, "ORG_ADMIN"),
    upsertUser("bob@acme.com", "Bob Patel", passwordHash, "ADMIN"),
    upsertUser("priya@acme.com", "Priya Singh", passwordHash),
    upsertUser("marcus@acme.com", "Marcus Chen", passwordHash),
    upsertUser("elena@acme.com", "Elena Rodriguez", passwordHash),
    upsertUser("admin@dhriti.dev", "Platform Admin", passwordHash, "SUPER_ADMIN"),
  ]);

  // ---------- Organization ----------
  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Technologies", slug: "acme" },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id, timezone: "Asia/Kolkata", locale: "en" },
  });

  // ---------- Authorization and billing catalog ----------
  const systemPermissions = [
    "organization.members.read",
    "organization.members.invite",
    "organization.members.remove",
    "organization.permissions.manage",
    "organization.settings.manage",
    "billing.subscription.read",
    "billing.subscription.manage",
    "analytics.read",
    "webhook.read",
    "webhook.manage",
    "connect.channel.read",
    "connect.channel.create",
    "connect.channel.update",
    "connect.channel.delete",
    "connect.message.create",
    "connect.message.delete",
    "flow.project.read",
    "flow.project.create",
    "flow.project.update",
    "flow.project.delete",
    "flow.issue.read",
    "flow.issue.create",
    "flow.issue.update",
    "flow.issue.delete",
    "flow.issue.transition",
    "atlas.space.read",
    "atlas.space.create",
    "atlas.page.read",
    "atlas.page.create",
    "atlas.page.update",
    "pulse.calendar.read",
    "pulse.calendar.create",
    "pulse.calendar.update",
    "cadence.session.read",
    "cadence.session.create",
    "cadence.session.update",
    "cadence.card.create",
    "cadence.card.update",
    "cadence.card.delete",
    "cadence.vote.create",
    "cadence.vote.delete",
    "nexus.conversation.read",
    "nexus.conversation.create",
    "nexus.task.read",
    "nexus.task.create",
    "hrms.employee.read",
    "hrms.employee.manage",
    "hrms.attendance.read",
    "hrms.attendance.manage",
    "hrms.leave.read",
    "hrms.leave.manage",
    "hrms.leave.approve",
    "hrms.performance.read",
    "hrms.performance.manage",
    "hrms.payroll.read",
    "hrms.payroll.manage",
    "hrms.payroll.approve",
    "hrms.training.read",
    "hrms.training.manage",
    "hrms.asset.read",
    "hrms.asset.manage",
    "hrms.benefit.read",
    "hrms.benefit.manage",
    "hrms.holiday.read",
    "hrms.holiday.manage",
  ];
  const permissions = await Promise.all(systemPermissions.map((key) => {
    const [resource, action] = key.split(".");
    return prisma.permission.upsert({
      where: { key },
      update: { resource, action },
      create: { key, resource, action },
    });
  }));

  const legacyPlatformRoles = [
    { legacyRole: "SUPER_ADMIN", key: "super_admin", name: "Super administrator" },
    { legacyRole: "SUPPORT", key: "support", name: "Support" },
    { legacyRole: "BILLING", key: "billing", name: "Billing" },
    { legacyRole: "SECURITY", key: "security", name: "Security" },
    { legacyRole: "ENGINEERING", key: "engineering", name: "Engineering" },
  ] as const;
  const platformRoles = new Map<string, { id: string }>();
  for (const role of legacyPlatformRoles) {
    const platformRole = await prisma.platformRole.upsert({
      where: { key: role.key },
      update: { name: role.name, isSystem: true },
      create: { key: role.key, name: role.name },
    });
    platformRoles.set(role.legacyRole, platformRole);
  }
  const platformAdminRole = platformRoles.get("SUPER_ADMIN");
  if (!platformAdminRole) throw new Error("Super administrator platform role is missing");
  await prisma.platformRolePermission.createMany({
    data: permissions.map((permission) => ({
      platformRoleId: platformAdminRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });
  await prisma.platformUserRoleAssignment.upsert({
    where: { userId_platformRoleId: { userId: admin.id, platformRoleId: platformAdminRole.id } },
    update: { revokedAt: null },
    create: { userId: admin.id, platformRoleId: platformAdminRole.id },
  });
  const legacyPlatformAssignments = await prisma.userAuth.findMany({
    where: { platformRole: { not: null }, user: { deletedAt: null } },
    select: { userId: true, platformRole: true },
  });
  for (const assignment of legacyPlatformAssignments) {
    if (!assignment.platformRole) continue;
    const role = platformRoles.get(assignment.platformRole);
    if (!role) continue;
    await prisma.platformUserRoleAssignment.upsert({
      where: { userId_platformRoleId: { userId: assignment.userId, platformRoleId: role.id } },
      update: { revokedAt: null },
      create: { userId: assignment.userId, platformRoleId: role.id },
    });
  }

  const legacyPlans = [
    { legacyPlan: "FREE", key: "free", name: "Free" },
    { legacyPlan: "STARTER", key: "starter", name: "Starter" },
    { legacyPlan: "PRO", key: "pro", name: "Pro" },
    { legacyPlan: "ENTERPRISE", key: "enterprise", name: "Enterprise" },
  ] as const;
  const plansByLegacyPlan = new Map<string, { id: string }>();
  for (const plan of legacyPlans) {
    const record = await prisma.plan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, isActive: true },
      create: { key: plan.key, name: plan.name },
    });
    plansByLegacyPlan.set(plan.legacyPlan, record);
  }
  const proPlan = plansByLegacyPlan.get("PRO");
  if (!proPlan) throw new Error("Pro plan is missing");
  const planEntitlements = [
    { key: "connect.enabled", name: "Connect", kind: "FEATURE" as const, enabled: true },
    { key: "flow.enabled", name: "Flow", kind: "FEATURE" as const, enabled: true },
    { key: "atlas.enabled", name: "Atlas", kind: "FEATURE" as const, enabled: true },
    { key: "pulse.enabled", name: "Pulse", kind: "FEATURE" as const, enabled: true },
    { key: "cadence.enabled", name: "Cadence", kind: "FEATURE" as const, enabled: true },
    { key: "nexus.enabled", name: "Nexus", kind: "FEATURE" as const, enabled: true },
    { key: "hrms.enabled", name: "HRMS", kind: "FEATURE" as const, enabled: true },
    { key: "max_users", name: "Maximum users", kind: "LIMIT" as const, value: 25 },
    { key: "max_teams", name: "Maximum teams", kind: "LIMIT" as const, value: 10 },
    { key: "max_projects", name: "Maximum projects", kind: "LIMIT" as const, value: 50 },
  ];
  for (const item of planEntitlements) {
    const entitlement = await prisma.entitlement.upsert({
      where: { key: item.key },
      update: { name: item.name, kind: item.kind },
      create: { key: item.key, name: item.name, kind: item.kind },
    });
    await prisma.planEntitlement.upsert({
      where: { planId_entitlementId: { planId: proPlan.id, entitlementId: entitlement.id } },
      update: { enabled: item.enabled ?? true, value: item.value ?? null },
      create: { planId: proPlan.id, entitlementId: entitlement.id, enabled: item.enabled ?? true, value: item.value ?? null },
    });
  }

  const legacySubscriptions = await prisma.subscription.findMany({
    where: { planId: null },
    select: { id: true, plan: true },
  });
  for (const subscription of legacySubscriptions) {
    const plan = plansByLegacyPlan.get(subscription.plan);
    if (!plan) continue;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id },
    });
  }

  const legacyProductEntitlements = await prisma.productEntitlement.findMany({
    include: { product: { select: { key: true } } },
  });
  for (const legacyEntitlement of legacyProductEntitlements) {
    const entitlement = await prisma.entitlement.findUnique({
      where: { key: `${legacyEntitlement.product.key}.enabled` },
      select: { id: true },
    });
    if (!entitlement) continue;
    const existingOverride = await prisma.organizationEntitlement.findUnique({
      where: {
        organizationId_entitlementId: {
          organizationId: legacyEntitlement.organizationId,
          entitlementId: entitlement.id,
        },
      },
      select: { organizationId: true },
    });
    if (!existingOverride) {
      await prisma.organizationEntitlement.create({
        data: {
          organizationId: legacyEntitlement.organizationId,
          entitlementId: entitlement.id,
          enabled: legacyEntitlement.isEnabled,
          reason: "Migrated from legacy product entitlement",
        },
      });
    }
  }

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: { plan: "PRO", planId: proPlan.id, status: "ACTIVE", seats: 25 },
    create: {
      organizationId: org.id,
      plan: "PRO",
      planId: proPlan.id,
      status: "ACTIVE",
      seats: 25,
      currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
    },
  });

  for (const user of [alice, bob, priya, marcus, elena]) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: {},
      create: { organizationId: org.id, userId: user.id },
    });
  }

  // Backfill legacy tenant administrators into an explicit, organization-scoped
  // permission group. The reads keep this idempotent for existing databases.
  const administratorPermissionKeys = [
    "organization.members.read",
    "organization.members.invite",
    "organization.members.remove",
    "organization.permissions.manage",
    "organization.settings.manage",
    "billing.subscription.read",
    "billing.subscription.manage",
    "analytics.read",
    "webhook.read",
    "webhook.manage",
  ];
  const permissionsByKey = new Map(permissions.map((permission) => [permission.key, permission]));
  const administratorPermissionIds = administratorPermissionKeys.map((key) => {
    const permission = permissionsByKey.get(key);
    if (!permission) throw new Error(`Missing system permission: ${key}`);
    return permission.id;
  });
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const organization of organizations) {
    const administrators = await prisma.organizationMember.findMany({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        user: { deletedAt: null, role: { in: ["PLATFORM_ADMIN", "ADMIN", "ORG_ADMIN"] } },
      },
      select: { userId: true },
    });
    if (administrators.length === 0) continue;

    const group = await prisma.organizationPermissionGroup.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: "Legacy administrators" } },
      update: { isActive: true, deletedAt: null, isSystem: true },
      create: {
        organizationId: organization.id,
        name: "Legacy administrators",
        description: "Compatibility permissions for legacy organization administrators",
        isSystem: true,
      },
    });
    await prisma.organizationPermissionGroupPermission.createMany({
      data: administratorPermissionIds.map((permissionId) => ({ permissionGroupId: group.id, permissionId })),
      skipDuplicates: true,
    });
    for (const administrator of administrators) {
      const assignment = await prisma.organizationPermissionGroupAssignment.findFirst({
        where: { organizationId: organization.id, permissionGroupId: group.id, userId: administrator.userId },
        select: { id: true, revokedAt: true },
      });
      if (!assignment) {
        await prisma.organizationPermissionGroupAssignment.create({
          data: { organizationId: organization.id, permissionGroupId: group.id, userId: administrator.userId, scopeType: "ORGANIZATION" },
        });
      } else if (assignment.revokedAt) {
        await prisma.organizationPermissionGroupAssignment.update({
          where: { id: assignment.id },
          data: { revokedAt: null },
        });
      }
    }
  }

  const legacyHrmsProfiles = await prisma.userHRMSProfile.findMany({
    where: { user: { deletedAt: null } },
    select: {
      id: true,
      userId: true,
      employeeId: true,
      employmentType: true,
      employmentStartDate: true,
      employmentEndDate: true,
      user: {
        select: {
          memberships: {
            where: { deletedAt: null, organization: { deletedAt: null } },
            select: { organizationId: true },
          },
        },
      },
    },
  });
  for (const profile of legacyHrmsProfiles) {
    for (const membership of profile.user.memberships) {
      const existingEmployee = await prisma.hrmsEmployee.findUnique({
        where: { organizationId_userId: { organizationId: membership.organizationId, userId: profile.userId } },
        select: { id: true },
      });
      if (existingEmployee) continue;
      await prisma.hrmsEmployee.create({
        data: {
          organizationId: membership.organizationId,
          userId: profile.userId,
          employeeNumber: profile.employeeId ?? `LEGACY-${profile.id}`,
          status: "ACTIVE",
          employmentType: profile.employmentType,
          startDate: profile.employmentStartDate,
          endDate: profile.employmentEndDate,
        },
      });
    }
  }

  const userProfiles = [
    { user: alice, firstName: "Alice", lastName: "Sharma", jobTitle: "Engineering Director", department: "Engineering", employeeId: "ACME-1001", skills: ["Leadership", "TypeScript", "Architecture"] },
    { user: bob, firstName: "Bob", lastName: "Patel", jobTitle: "Staff Engineer", department: "Engineering", employeeId: "ACME-1002", skills: ["Payments", "PostgreSQL", "Node.js"] },
    { user: priya, firstName: "Priya", lastName: "Singh", jobTitle: "Product Manager", department: "Product", employeeId: "ACME-1003", skills: ["Discovery", "Roadmaps", "Analytics"] },
    { user: marcus, firstName: "Marcus", lastName: "Chen", jobTitle: "Product Designer", department: "Design", employeeId: "ACME-1004", skills: ["Research", "UX", "Design systems"] },
    { user: elena, firstName: "Elena", lastName: "Rodriguez", jobTitle: "People Operations Manager", department: "People", employeeId: "ACME-1005", skills: ["HR Operations", "Recruiting", "Benefits"] },
  ];

  for (const profile of userProfiles) {
    await prisma.userProfile.upsert({
      where: { userId: profile.user.id },
      update: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        jobTitle: profile.jobTitle,
        department: profile.department,
        timezone: "Asia/Kolkata",
      },
      create: {
        userId: profile.user.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        jobTitle: profile.jobTitle,
        department: profile.department,
        timezone: "Asia/Kolkata",
        locale: "en-IN",
        bio: `${profile.firstName} is part of the Acme Technologies team.`,
      },
    });
    await prisma.onBoardingProfile.upsert({
      where: { userId: profile.user.id },
      update: { isOnBoarded: true, isOrgAdded: true, usageType: "professional", experience: "returning", isProfilePhotoSkipped: false },
      create: {
        userId: profile.user.id,
        isOnBoarded: true,
        isOrgAdded: true,
        usageType: "professional",
        experience: "returning",
        legalAcceptedAt: new Date("2026-09-01T09:00:00.000Z"),
      },
    });
    await prisma.userHRMSProfile.upsert({
      where: { userId: profile.user.id },
      update: { employeeId: profile.employeeId, employmentType: "FULL_TIME", skills: profile.skills },
      create: {
        userId: profile.user.id,
        employeeId: profile.employeeId,
        employmentType: "FULL_TIME",
        employmentStartDate: new Date("2024-01-01T00:00:00.000Z"),
        officeLocation: "Bengaluru",
        workSchedule: { days: [1, 2, 3, 4, 5], hours: "09:30-18:30" },
        skills: profile.skills,
        experience: 5,
      },
    });
    await prisma.hrmsEmployee.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: profile.user.id } },
      update: { employeeNumber: profile.employeeId, status: "ACTIVE", employmentType: "FULL_TIME", endDate: null },
      create: {
        organizationId: org.id,
        userId: profile.user.id,
        employeeNumber: profile.employeeId,
        status: "ACTIVE",
        employmentType: "FULL_TIME",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
    await prisma.userWorkOSProfile.upsert({
      where: { userId: profile.user.id },
      update: { workingHoursStart: "09:30", workingHoursEnd: "18:30" },
      create: {
        userId: profile.user.id,
        workingHoursStart: "09:30",
        workingHoursEnd: "18:30",
        workingHoursPerWeek: 40,
        vacationBalance: 12,
        sickLeaveBalance: 8,
      },
    });
  }

  await backfillLegacyHrmsRecords();

  // ---------- Team ----------
  const team = await prisma.team.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "engineering" } },
    update: {},
    create: { organizationId: org.id, name: "Engineering", slug: "engineering" },
  });
  for (const user of [alice, bob, priya, marcus]) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: user.id } },
      update: {},
      create: { teamId: team.id, userId: user.id },
    });
  }

  // ---------- Product catalog ----------
  const products = [
    { key: "connect", name: "Connect", description: "Chat & collaboration" },
    { key: "flow", name: "Flow", description: "Project management" },
    { key: "atlas", name: "Atlas", description: "Knowledge base" },
    { key: "pulse", name: "Pulse", description: "Calendar & meetings" },
    { key: "nexus", name: "Nexus", description: "AI assistant" },
    { key: "cadence", name: "Cadence", description: "Retrospectives" },
  ];
  for (const product of products) {
    const record = await prisma.product.upsert({
      where: { key: product.key },
      update: {},
      create: product,
    });
    await prisma.productEntitlement.upsert({
      where: { organizationId_productId: { organizationId: org.id, productId: record.id } },
      update: { isEnabled: true },
      create: { organizationId: org.id, productId: record.id, isEnabled: true },
    });
  }

  await Promise.all([
    prisma.featureFlag.upsert({
      where: { organizationId_key: { organizationId: org.id, key: "ai-summaries" } },
      update: { isEnabled: true },
      create: { organizationId: org.id, key: "ai-summaries", isEnabled: true },
    }),
    prisma.featureFlag.upsert({
      where: { organizationId_key: { organizationId: org.id, key: "advanced-analytics" } },
      update: { isEnabled: true },
      create: { organizationId: org.id, key: "advanced-analytics", isEnabled: true },
    }),
    prisma.holidayCalendar.upsert({
      where: { organizationId_name: { organizationId: org.id, name: "India Holidays" } },
      update: {},
      create: {
        organizationId: org.id,
        name: "India Holidays",
        countryCode: "IN",
        holidays: [
          { date: "2026-01-26", name: "Republic Day" },
          { date: "2026-08-15", name: "Independence Day" },
          { date: "2026-10-02", name: "Gandhi Jayanti" },
        ],
      },
    }),
  ]);

  // ---------- Connect ----------
  const channel = await prisma.channel.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "engineering" } },
    update: {},
    create: {
      organizationId: org.id,
      teamId: team.id,
      name: "engineering",
      slug: "engineering",
      type: "CHANNEL",
      visibility: "PUBLIC",
      createdById: alice.id,
      members: { create: [{ userId: alice.id }, { userId: bob.id }, { userId: priya.id }] },
    },
  });

  const generalChannel = await prisma.channel.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "general" } },
    update: { topic: "Company announcements and team updates" },
    create: {
      organizationId: org.id,
      name: "general",
      slug: "general",
      type: "CHANNEL",
      visibility: "PUBLIC",
      topic: "Company announcements and team updates",
      createdById: alice.id,
    },
  });
  for (const channelMember of [alice, bob, priya, marcus, elena]) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: generalChannel.id, userId: channelMember.id } },
      update: {},
      create: { channelId: generalChannel.id, userId: channelMember.id },
    });
  }

  const hello = await ensureMessage(org.id, channel.id, alice.id, "Welcome to #engineering! 👋");
  await ensureMessage(org.id, channel.id, bob.id, "Thanks @alice — excited to be here.", hello.id);
  const announcement = await ensureMessage(
    org.id,
    generalChannel.id,
    alice.id,
    "Welcome to Acme's shared workspace. Weekly planning begins Monday.",
  );
  await prisma.messageMention.upsert({
    where: { messageId_userId: { messageId: announcement.id, userId: priya.id } },
    update: {},
    create: { messageId: announcement.id, userId: priya.id },
  });
  await prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId: announcement.id, userId: bob.id, emoji: "rocket" } },
    update: {},
    create: { messageId: announcement.id, userId: bob.id, emoji: "rocket" },
  });

  // ---------- Flow ----------
  const project = await prisma.project.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "PAY" } },
    update: {},
    create: {
      organizationId: org.id,
      teamId: team.id,
      key: "PAY",
      name: "Payments",
      leadId: alice.id,
    },
  });
  let board = await prisma.board.findFirst({ where: { projectId: project.id, name: "Delivery board", deletedAt: null } });
  if (!board) {
    board = await prisma.board.create({ data: { projectId: project.id, name: "Delivery board" } });
  }
  for (const [position, status, name] of [[0, "BACKLOG", "Backlog"], [1, "TODO", "Ready"], [2, "IN_PROGRESS", "In progress"], [3, "IN_REVIEW", "In review"], [4, "DONE", "Done"]] as const) {
    const existingColumn = await prisma.boardColumn.findFirst({ where: { boardId: board.id, status } });
    if (!existingColumn) {
      await prisma.boardColumn.create({ data: { boardId: board.id, position, status, name } });
    }
  }
  let sprint = await prisma.sprint.findFirst({ where: { projectId: project.id, name: "Payments foundation" } });
  if (!sprint) {
    sprint = await prisma.sprint.create({ data: {
      projectId: project.id,
      name: "Payments foundation",
      goal: "Deliver a reliable payment workflow for the pilot.",
      isActive: true,
      startDate: new Date("2026-09-14T00:00:00.000Z"),
      endDate: new Date("2026-09-28T00:00:00.000Z"),
    } });
  }
  const issueSeeds = [
    { number: 1, title: "Set up payment gateway", status: "IN_PROGRESS", priority: "HIGH", assigneeId: bob.id, reporterId: alice.id, sprintId: sprint.id, estimate: 5 },
    { number: 2, title: "Define webhook retry policy", status: "TODO", priority: "MEDIUM", assigneeId: bob.id, reporterId: alice.id, sprintId: sprint.id, estimate: 3 },
    { number: 3, title: "Complete checkout interaction design", status: "IN_REVIEW", priority: "HIGH", assigneeId: marcus.id, reporterId: priya.id, sprintId: sprint.id, estimate: 3 },
    { number: 4, title: "Pilot account readiness checklist", status: "BACKLOG", priority: "MEDIUM", assigneeId: priya.id, reporterId: alice.id, estimate: 2 },
    { number: 5, title: "Document payment reconciliation", status: "DONE", priority: "LOW", assigneeId: bob.id, reporterId: priya.id, estimate: 2 },
  ] as const;
  for (const issue of issueSeeds) {
    await prisma.issue.upsert({
      where: { projectId_number: { projectId: project.id, number: issue.number } },
      update: issue,
      create: { organizationId: org.id, projectId: project.id, position: issue.number, description: `Acme PAY-${issue.number}: ${issue.title}`, ...issue },
    });
  }

  // ---------- Atlas ----------
  const space = await prisma.atlasSpace.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "ENG" } },
    update: {},
    create: {
      organizationId: org.id,
      key: "ENG",
      name: "Engineering Handbook",
      createdById: alice.id,
    },
  });
  let architecture = await prisma.atlasPage.findFirst({ where: { spaceId: space.id, title: "Payment Architecture" } });
  if (!architecture) {
    architecture = await prisma.atlasPage.create({
      data: {
        organizationId: org.id,
        spaceId: space.id,
        title: "Payment Architecture",
        content: "# Payment Architecture\n\nOwnership, event flows, reconciliation, and operational runbooks.",
        isPublished: true,
        createdById: alice.id,
      },
    });
  }
  const existingComment = await prisma.atlasComment.findFirst({ where: { pageId: architecture.id, authorId: priya.id } });
  if (!existingComment) {
    await prisma.atlasComment.create({
      data: { organizationId: org.id, pageId: architecture.id, authorId: priya.id, content: "Please add pilot rollout metrics before the architecture review." },
    });
  }

  // ---------- Pulse ----------
  let calendar = await prisma.calendar.findFirst({ where: { organizationId: org.id, name: "Engineering", deletedAt: null } });
  if (!calendar) {
    calendar = await prisma.calendar.create({ data: { organizationId: org.id, ownerId: alice.id, name: "Engineering", color: "teal", isDefault: true } });
  }
  let standup = await prisma.calendarEvent.findFirst({ where: { calendarId: calendar.id, title: "Engineering Standup", deletedAt: null } });
  if (!standup) {
    standup = await prisma.calendarEvent.create({
      data: {
        organizationId: org.id,
        calendarId: calendar.id,
        title: "Engineering Standup",
        description: "Daily delivery update and blocker review.",
        startsAt: new Date("2026-09-21T04:30:00.000Z"),
        endsAt: new Date("2026-09-21T04:55:00.000Z"),
        recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
        createdById: alice.id,
      },
    });
  }
  for (const attendee of [{ user: alice, status: "ACCEPTED", isOrganizer: true }, { user: bob, status: "ACCEPTED", isOrganizer: false }, { user: priya, status: "TENTATIVE", isOrganizer: false }] as const) {
    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId: standup.id, userId: attendee.user.id } },
      update: { status: attendee.status, isOrganizer: attendee.isOrganizer },
      create: { eventId: standup.id, userId: attendee.user.id, status: attendee.status, isOrganizer: attendee.isOrganizer },
    });
  }

  // ---------- Nexus, Cadence, and notifications ----------
  let conversation = await prisma.nexusConversation.findFirst({ where: { organizationId: org.id, userId: priya.id, title: "Payments pilot planning" } });
  if (!conversation) {
    conversation = await prisma.nexusConversation.create({
      data: { organizationId: org.id, userId: priya.id, title: "Payments pilot planning" },
    });
    await prisma.nexusMessage.createMany({
      data: [
        { conversationId: conversation.id, role: "user", content: "Summarize the key pilot risks for the payments rollout.", tokens: 14 },
        { conversationId: conversation.id, role: "assistant", content: "The primary risks are webhook reliability, reconciliation coverage, and support readiness.", tokens: 18 },
      ],
    });
  }
  const existingTask = await prisma.nexusTask.findFirst({ where: { organizationId: org.id, sourceId: architecture.id, type: "SUMMARIZE_PAGE" } });
  if (!existingTask) {
    await prisma.nexusTask.create({
      data: {
        organizationId: org.id,
        requestedById: priya.id,
        type: "SUMMARIZE_PAGE",
        status: "COMPLETED",
        sourceType: "atlas_page",
        sourceId: architecture.id,
        input: { pageId: architecture.id },
        result: { summary: "Payments architecture and operational controls for the pilot." },
        startedAt: new Date("2026-09-18T08:00:00.000Z"),
        completedAt: new Date("2026-09-18T08:00:04.000Z"),
      },
    });
  }

  let retrospective = await prisma.cadenceSession.findFirst({ where: { organizationId: org.id, title: "Sprint 12 retrospective" } });
  if (!retrospective) {
    retrospective = await prisma.cadenceSession.create({
      data: { organizationId: org.id, teamId: team.id, type: "RETROSPECTIVE", title: "Sprint 12 retrospective", phase: "DISCUSS", facilitatorId: alice.id, startedAt: new Date("2026-09-18T10:00:00.000Z") },
    });
    const card = await prisma.cadenceCard.create({ data: { sessionId: retrospective.id, authorId: bob.id, column: "Went well", content: "The payment gateway spike reduced integration uncertainty." } });
    await prisma.cadenceVote.create({ data: { cardId: card.id, userId: alice.id } });
  }

  for (const preference of [
    { user: alice, type: "SYSTEM", email: true },
    { user: bob, type: "ASSIGNMENT", email: true },
    { user: priya, type: "COMMENT", email: false },
  ] as const) {
    await prisma.notificationPreference.upsert({
      where: { userId_organizationId_type: { userId: preference.user.id, organizationId: org.id, type: preference.type } },
      update: { inApp: true, email: preference.email },
      create: { userId: preference.user.id, organizationId: org.id, type: preference.type, inApp: true, email: preference.email },
    });
  }
  const assignmentNotification = await prisma.notification.findFirst({ where: { organizationId: org.id, userId: bob.id, title: "Assigned to PAY-1" } });
  if (!assignmentNotification) {
    await prisma.notification.create({ data: { organizationId: org.id, userId: bob.id, type: "ASSIGNMENT", title: "Assigned to PAY-1", body: "You were assigned to Set up payment gateway.", linkUrl: "/acme/flow/projects/PAY/issues/1", metadata: { projectKey: "PAY", issueNumber: 1 } } });
  }

  // ---------- HR, support, and operational records ----------
  const [bobHr, priyaHr] = await Promise.all([
    prisma.userHRMSProfile.findUniqueOrThrow({ where: { userId: bob.id } }),
    prisma.userHRMSProfile.findUniqueOrThrow({ where: { userId: priya.id } }),
  ]);
  const attendanceDate = new Date("2026-09-18T00:00:00.000Z");
  const attendance = await prisma.attendanceRecord.findFirst({ where: { userId: bobHr.id, date: attendanceDate } });
  if (!attendance) {
    await prisma.attendanceRecord.create({ data: { userId: bobHr.id, date: attendanceDate, checkIn: new Date("2026-09-18T04:05:00.000Z"), checkOut: new Date("2026-09-18T12:35:00.000Z"), status: "PRESENT", workHours: 8, breakTime: 30, location: "Bengaluru" } });
  }
  const leave = await prisma.leaveRequest.findFirst({ where: { userId: priyaHr.id, startDate: new Date("2026-10-12T00:00:00.000Z") } });
  if (!leave) {
    await prisma.leaveRequest.create({ data: { userId: priyaHr.id, leaveType: "VACATION", startDate: new Date("2026-10-12T00:00:00.000Z"), endDate: new Date("2026-10-14T00:00:00.000Z"), totalDays: 3, reason: "Planned family travel", status: "APPROVED", approvedBy: elena.id, approvedAt: new Date("2026-09-15T00:00:00.000Z") } });
  }
  let training = await prisma.training.findFirst({ where: { title: "Secure Payments Engineering" } });
  if (!training) {
    training = await prisma.training.create({ data: { title: "Secure Payments Engineering", description: "PCI basics, secure integration patterns, and incident response.", type: "TECHNICAL", provider: "Acme Academy", duration: 180, status: "SCHEDULED", maxParticipants: 25, certificationOffered: true } });
  }
  await prisma.trainingEnrollment.upsert({
    where: { trainingId_userId: { trainingId: training.id, userId: bobHr.id } },
    update: { status: "ENROLLED" },
    create: { trainingId: training.id, userId: bobHr.id, status: "ENROLLED" },
  });
  await prisma.asset.upsert({
    where: { serialNumber: "ACME-MBP-1002" },
    update: { status: "ASSIGNED", assignedTo: bobHr.id },
    create: { name: "MacBook Pro 14", type: "LAPTOP", serialNumber: "ACME-MBP-1002", manufacturer: "Apple", model: "MacBook Pro M3", status: "ASSIGNED", assignedTo: bobHr.id, assignedAt: new Date("2026-01-08T00:00:00.000Z"), condition: "Excellent", location: "Bengaluru" },
  });
  const insurance = await prisma.healthInsurance.findFirst({ where: { organizationId: org.id, userId: bobHr.id, provider: "Acme Health" } });
  if (!insurance) {
    await prisma.healthInsurance.create({ data: { organizationId: org.id, userId: bobHr.id, provider: "Acme Health", planName: "Gold", policyNumber: "ACME-2026-GOLD", memberNumber: "1002", coverageStarts: new Date("2026-01-01T00:00:00.000Z"), isActive: true } });
  }

  const supportTicket = await prisma.supportTicket.findFirst({ where: { organizationId: org.id, subject: "Webhook delivery visibility" } });
  if (!supportTicket) {
    await prisma.supportTicket.create({ data: { organizationId: org.id, userId: alice.id, subject: "Webhook delivery visibility", body: "Requesting delivery attempt visibility for finance integrations.", status: "IN_PROGRESS", priority: "NORMAL", assignedToId: admin.id, notes: "Added to the Q4 platform backlog." } });
  }
  const auditEntry = await prisma.auditLog.findFirst({ where: { organizationId: org.id, action: "organization.seeded" } });
  if (!auditEntry) {
    await prisma.auditLog.create({ data: { organizationId: org.id, actorUserId: admin.id, action: "organization.seeded", resourceType: "organization", resourceId: org.id, metadata: { source: "prisma/seed.ts", fixture: "acme" } } });
  }

  // ---------- Public product content ----------
  for (const document of [
    { type: "TERMS_OF_SERVICE", version: "2026-09-01", title: "Terms of Service", content: "# Terms of Service\n\nSeed legal terms for the Dhriti environment." },
    { type: "PRIVACY_POLICY", version: "2026-09-01", title: "Privacy Policy", content: "# Privacy Policy\n\nSeed privacy policy for the Dhriti environment." },
  ] as const) {
    await prisma.legalDocument.upsert({ where: { type_version: { type: document.type, version: document.version } }, update: { title: document.title, content: document.content, isPublished: true }, create: { ...document, isPublished: true, publishedAt: new Date("2026-09-01T00:00:00.000Z") } });
  }
  const faqGroup = await prisma.faqGroup.upsert({ where: { slug: "getting-started" }, update: { name: "Getting Started", order: 1 }, create: { name: "Getting Started", slug: "getting-started", order: 1 } });
  const faq = await prisma.faqItem.findFirst({ where: { groupId: faqGroup.id, question: "How do I invite my team?" } });
  if (!faq) {
    await prisma.faqItem.create({ data: { groupId: faqGroup.id, question: "How do I invite my team?", answer: "Use the organization settings to send invitations or share an invite link.", order: 1, isDraft: false } });
  }
  await prisma.jobPost.upsert({ where: { slug: "senior-platform-engineer" }, update: { isPublished: true }, create: { slug: "senior-platform-engineer", title: "Senior Platform Engineer", description: "Build durable platform services for a growing work OS.", department: "Engineering", location: "Bengaluru / Remote", employmentType: "Full-time", isPublished: true, publishedAt: new Date("2026-09-10T00:00:00.000Z") } });

  console.log("Seed complete.");
  console.log(`  Login: alice@acme.com / ${PASSWORD} (ORG_ADMIN)`);
  console.log(`         bob@acme.com  / ${PASSWORD} (ADMIN)`);
  console.log(`         priya@acme.com / ${PASSWORD} (MEMBER)`);
  console.log(`         admin@dhriti.dev / ${PASSWORD} (platform SUPER_ADMIN)`);
  console.log(`  Org slug: acme  (id=${org.id})`);
}

async function backfillLegacyHrmsRecords(): Promise<void> {
  const [profiles, employees] = await Promise.all([
    prisma.userHRMSProfile.findMany({ select: { id: true, userId: true } }),
    prisma.hrmsEmployee.findMany({ where: { deletedAt: null }, select: { id: true, organizationId: true, userId: true } }),
  ]);
  const userIdByProfileId = new Map(profiles.map((profile) => [profile.id, profile.userId]));
  const employeesByUserId = new Map<string, typeof employees>();
  for (const employee of employees) employeesByUserId.set(employee.userId, [...(employeesByUserId.get(employee.userId) ?? []), employee]);
  const tenantEmployees = (profileId: string) => employeesByUserId.get(userIdByProfileId.get(profileId) ?? "") ?? [];

  for (const record of await prisma.attendanceRecord.findMany()) {
    for (const employee of tenantEmployees(record.userId)) {
      const existing = await prisma.hrmsAttendanceRecord.findFirst({ where: { organizationId: employee.organizationId, OR: [{ legacyAttendanceId: record.id }, { employeeId: employee.id, date: record.date }] }, select: { id: true } });
      if (!existing) await prisma.hrmsAttendanceRecord.create({ data: { organizationId: employee.organizationId, legacyAttendanceId: record.id, employeeId: employee.id, date: record.date, checkIn: record.checkIn, checkOut: record.checkOut, status: record.status, workHours: record.workHours, notes: record.notes } });
    }
  }

  for (const record of await prisma.leaveRequest.findMany()) {
    for (const employee of tenantEmployees(record.userId)) {
      await prisma.hrmsLeaveRequest.upsert({ where: { organizationId_legacyLeaveRequestId: { organizationId: employee.organizationId, legacyLeaveRequestId: record.id } }, update: {}, create: { organizationId: employee.organizationId, legacyLeaveRequestId: record.id, employeeId: employee.id, leaveType: record.leaveType, startDate: record.startDate, endDate: record.endDate, totalDays: record.totalDays, reason: record.reason, status: record.status, approvedByUserId: record.approvedBy, approvedAt: record.approvedAt, rejectedByUserId: record.rejectedBy, rejectedAt: record.rejectedAt, rejectionReason: record.rejectionReason } });
    }
  }

  for (const record of await prisma.performanceReview.findMany()) {
    for (const employee of tenantEmployees(record.userId)) {
      const reviewer = tenantEmployees(record.reviewerId).find((candidate) => candidate.organizationId === employee.organizationId);
      if (!reviewer) continue;
      await prisma.hrmsPerformanceReview.upsert({ where: { organizationId_legacyPerformanceReviewId: { organizationId: employee.organizationId, legacyPerformanceReviewId: record.id } }, update: {}, create: { organizationId: employee.organizationId, legacyPerformanceReviewId: record.id, employeeId: employee.id, reviewerEmployeeId: reviewer.id, reviewType: record.reviewType, cycle: record.cycle, startDate: record.startDate, dueDate: record.dueDate, completedAt: record.completedAt, status: record.status, overallRating: record.overallRating, comments: record.comments } });
    }
  }

  for (const record of await prisma.payrollRecord.findMany()) {
    for (const employee of tenantEmployees(record.userId)) {
      const existing = await prisma.hrmsPayrollRecord.findFirst({ where: { organizationId: employee.organizationId, OR: [{ legacyPayrollRecordId: record.id }, { employeeId: employee.id, period: record.period }] }, select: { id: true } });
      if (!existing) await prisma.hrmsPayrollRecord.create({ data: { organizationId: employee.organizationId, legacyPayrollRecordId: record.id, employeeId: employee.id, period: record.period, periodStart: record.periodStart, periodEnd: record.periodEnd, payDate: record.payDate, grossSalary: record.grossSalary, totalDeductions: record.totalDeductions, netPay: record.netPay, currency: record.currency, status: record.status, paidAt: record.paidAt, notes: record.notes } });
    }
  }

  const enrollments = await prisma.trainingEnrollment.findMany({ include: { training: true } });
  for (const enrollment of enrollments) {
    for (const employee of tenantEmployees(enrollment.userId)) {
      const training = await prisma.hrmsTraining.upsert({ where: { organizationId_legacyTrainingId: { organizationId: employee.organizationId, legacyTrainingId: enrollment.trainingId } }, update: {}, create: { organizationId: employee.organizationId, legacyTrainingId: enrollment.trainingId, title: enrollment.training.title, description: enrollment.training.description, type: enrollment.training.type, startDate: enrollment.training.startDate, endDate: enrollment.training.endDate, status: enrollment.training.status, maxParticipants: enrollment.training.maxParticipants } });
      await prisma.hrmsTrainingEnrollment.upsert({ where: { organizationId_legacyTrainingEnrollmentId: { organizationId: employee.organizationId, legacyTrainingEnrollmentId: enrollment.id } }, update: {}, create: { organizationId: employee.organizationId, legacyTrainingEnrollmentId: enrollment.id, trainingId: training.id, employeeId: employee.id, status: enrollment.status, enrolledAt: enrollment.enrolledAt, completedAt: enrollment.completedAt } });
    }
  }

  for (const asset of await prisma.asset.findMany({ where: { assignedTo: { not: null } } })) {
    for (const employee of tenantEmployees(asset.assignedTo!)) {
      await prisma.hrmsAsset.upsert({ where: { organizationId_legacyAssetId: { organizationId: employee.organizationId, legacyAssetId: asset.id } }, update: {}, create: { organizationId: employee.organizationId, legacyAssetId: asset.id, name: asset.name, type: asset.type, serialNumber: asset.serialNumber, status: asset.status, assignedEmployeeId: employee.id, assignedAt: asset.assignedAt, location: asset.location, notes: asset.notes } });
    }
  }

  for (const benefit of await prisma.healthInsurance.findMany()) {
    for (const employee of tenantEmployees(benefit.userId).filter((candidate) => candidate.organizationId === benefit.organizationId)) {
      await prisma.hrmsBenefitEnrollment.upsert({ where: { organizationId_legacyHealthInsuranceId: { organizationId: employee.organizationId, legacyHealthInsuranceId: benefit.id } }, update: {}, create: { organizationId: employee.organizationId, legacyHealthInsuranceId: benefit.id, employeeId: employee.id, provider: benefit.provider, planName: benefit.planName, policyNumber: benefit.policyNumber, coverageStarts: benefit.coverageStarts, coverageEnds: benefit.coverageEnds, isActive: benefit.isActive } });
    }
  }
}

async function upsertUser(
  email: string,
  name: string,
  passwordHash: string,
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "ADMIN" | "EMPLOYEE" = "EMPLOYEE",
) {
  return prisma.user.upsert({
    where: { email },
    update: { name, status: "ACTIVE", role: role === "SUPER_ADMIN" ? "PLATFORM_ADMIN" : role },
    create: {
      email,
      name,
      status: "ACTIVE",
      role: role === "SUPER_ADMIN" ? "PLATFORM_ADMIN" : role,
      isPlatformUser: role === "SUPER_ADMIN",
      auth: {
        create: {
          passwordHash,
          emailVerifiedAt: new Date(),
          ...(role === "SUPER_ADMIN" ? { platformRole: "SUPER_ADMIN" } : {}),
        },
      },
    },
  });
}

async function ensureMessage(
  organizationId: string,
  channelId: string,
  authorId: string,
  content: string,
  parentId?: string,
) {
  const existing = await prisma.message.findFirst({
    where: { channelId, authorId, content, parentId: parentId ?? null },
  });

  return existing ?? prisma.message.create({
    data: { organizationId, channelId, authorId, content, parentId },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
