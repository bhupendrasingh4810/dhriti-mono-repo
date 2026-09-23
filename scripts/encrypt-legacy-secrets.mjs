import { createCipheriv, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const encodedKey = process.env.SECRETS_ENCRYPTION_KEY;
if (!encodedKey) throw new Error("SECRETS_ENCRYPTION_KEY is required");
const key = Buffer.from(encodedKey, "base64");
if (key.length !== 32) throw new Error("SECRETS_ENCRYPTION_KEY must decode to exactly 32 bytes");

function encrypt(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

const prisma = new PrismaClient();
try {
  const mfaRecords = await prisma.userAuth.findMany({
    where: { mfaSecret: { not: null } },
    select: { id: true, mfaSecret: true },
  });
  for (const record of mfaRecords) {
    await prisma.userAuth.update({
      where: { id: record.id },
      data: { mfaSecret: null, mfaSecretEncrypted: encrypt(record.mfaSecret) },
    });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { secret: { not: null } },
    select: { id: true, secret: true },
  });
  for (const webhook of webhooks) {
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { secret: null, secretEncrypted: encrypt(webhook.secret) },
    });
  }

  console.log(`Encrypted legacy secrets: mfa=${mfaRecords.length} webhooks=${webhooks.length}`);
} finally {
  await prisma.$disconnect();
}