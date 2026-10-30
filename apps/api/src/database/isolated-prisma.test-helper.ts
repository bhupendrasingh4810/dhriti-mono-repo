import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

/** Separate schema prevents application workers from consuming integration fixtures. */
export function isolatedPrisma() {
  const schema = `notification_test_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL ?? "postgresql://missing");
  url.searchParams.set("schema", schema);
  const prisma = new PrismaClient({ datasourceUrl: url.toString() });
  return {
    prisma,
    async setup(): Promise<void> {
      execFileSync(
        process.execPath,
        [
          resolve(__dirname, "../../node_modules/prisma/build/index.js"),
          "db",
          "push",
          "--schema",
          resolve(__dirname, "../../../../prisma/schema.prisma"),
          "--skip-generate",
        ],
        { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "pipe" },
      );
      await prisma.$connect();
    },
    async cleanup(): Promise<void> {
      try {
        await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await prisma.$disconnect();
      }
    },
  };
}
