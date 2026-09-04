import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Sup3rSecure!";

async function main(): Promise<void> {
  console.log("Seeding Dhriti database...");

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ---------- Users ----------
  const [alice, bob, priya, admin] = await Promise.all([
    upsertUser("alice@acme.com", "Alice Sharma", passwordHash),
    upsertUser("bob@acme.com", "Bob Patel", passwordHash),
    upsertUser("priya@acme.com", "Priya Singh", passwordHash),
    upsertUser("admin@dhriti.dev", "Platform Admin", passwordHash, "SUPER_ADMIN"),
  ]);

  // ---------- Organization ----------
  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Technologies", slug: "acme" },
  });

  for (const [user, role] of [
    [alice, "OWNER"],
    [bob, "ADMIN"],
    [priya, "MEMBER"],
  ] as const) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: { role },
      create: { organizationId: org.id, userId: user.id, role },
    });
  }

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: { organizationId: org.id, timezone: "Asia/Kolkata", locale: "en" },
  });

  // ---------- Team ----------
  const team = await prisma.team.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "engineering" } },
    update: {},
    create: { organizationId: org.id, name: "Engineering", slug: "engineering" },
  });
  for (const user of [alice, bob, priya]) {
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

  const hello = await prisma.message.create({
    data: {
      organizationId: org.id,
      channelId: channel.id,
      authorId: alice.id,
      content: "Welcome to #engineering! 👋",
    },
  });
  await prisma.message.create({
    data: {
      organizationId: org.id,
      channelId: channel.id,
      authorId: bob.id,
      content: "Thanks @alice — excited to be here.",
      parentId: hello.id,
    },
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
  await prisma.issue.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      number: 1,
      title: "Set up payment gateway",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: bob.id,
      reporterId: alice.id,
    },
  });

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
  await prisma.atlasPage.create({
    data: {
      organizationId: org.id,
      spaceId: space.id,
      title: "Payment Architecture",
      content: "# Payment Architecture\n\nOverview of the payments system.",
      isPublished: true,
      createdById: alice.id,
    },
  });

  // ---------- Pulse ----------
  const calendar = await prisma.calendar.create({
    data: { organizationId: org.id, ownerId: alice.id, name: "Engineering", isDefault: true },
  });
  await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      calendarId: calendar.id,
      title: "Engineering Standup",
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 90 * 60 * 1000),
      createdById: alice.id,
      attendees: {
        create: [
          { userId: alice.id, isOrganizer: true, status: "ACCEPTED" },
          { userId: bob.id, status: "PENDING" },
          { userId: priya.id, status: "ACCEPTED" },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log(`  Login: alice@acme.com / ${PASSWORD} (OWNER)`);
  console.log(`         bob@acme.com  / ${PASSWORD} (ADMIN)`);
  console.log(`         priya@acme.com / ${PASSWORD} (MEMBER)`);
  console.log(`         admin@dhriti.dev / ${PASSWORD} (platform SUPER_ADMIN)`);
  console.log(`  Org slug: acme  (id=${org.id})`);
}

async function upsertUser(
  email: string,
  name: string,
  passwordHash: string,
  platformRole?: "SUPER_ADMIN",
) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      ...(platformRole ? { platformRole } : {}),
    },
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
