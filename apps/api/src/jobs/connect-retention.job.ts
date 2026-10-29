import { randomUUID } from "node:crypto";

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ApiConfigService } from "../config/config.service";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../modules/audit/audit.service";
import { StorageService } from "../modules/file/storage.service";
import { RedisService } from "../redis/redis.service";

const LEASE_KEY = "jobs:connect-retention";
const INTERVAL_MS = 60 * 60 * 1000;
const LEASE_TTL_SECONDS = 55 * 60;
const LEASE_REFRESH_MS = 30 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;
const EXTEND_LEASE_SCRIPT = [
  "if redis.call('GET', KEYS[1]) == ARGV[1] then",
  "  return redis.call('EXPIRE', KEYS[1], ARGV[2])",
  "end",
  "return 0",
].join("\n");
const RELEASE_LEASE_SCRIPT = [
  "if redis.call('GET', KEYS[1]) == ARGV[1] then",
  "  return redis.call('DEL', KEYS[1])",
  "end",
  "return 0",
].join("\n");

interface RetentionPolicy {
  organizationId: string;
  messageRetentionDays: number | null;
  recordingRetentionDays: number | null;
}

interface CurrentPolicy extends RetentionPolicy {
  retentionEnabledAt: Date | null;
}

type RetentionTransaction = Prisma.TransactionClient;

/**
 * Applies Connect retention after the settings activation grace period.
 * Each destructive batch shares the advisory lock used by Connect settings saves.
 */
@Injectable()
export class ConnectRetentionJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectRetentionJob.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly config: ApiConfigService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.run(), INTERVAL_MS);
    void this.run();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async run(now = new Date()): Promise<void> {
    if (!this.config.connectRetentionEnabled) {
      return;
    }

    const leaseToken = randomUUID();
    try {
      const acquired = await this.redis.raw.set(LEASE_KEY, leaseToken, "EX", LEASE_TTL_SECONDS, "NX");
      if (acquired !== "OK") {
        return;
      }

      let leaseOwned = true;
      const heartbeat = setInterval(() => {
        void this.redis.raw
          .eval(EXTEND_LEASE_SCRIPT, 1, LEASE_KEY, leaseToken, LEASE_TTL_SECONDS)
          .then((extended) => {
            if (Number(extended) !== 1) {
              leaseOwned = false;
              this.logger.warn("Connect retention lease was lost; stopping further batches");
            }
          })
          .catch((error: unknown) => {
            leaseOwned = false;
            this.logger.error(
              "Unable to renew Connect retention lease; stopping further batches",
              error instanceof Error ? error.stack : String(error),
            );
          });
      }, LEASE_REFRESH_MS);
      heartbeat.unref();

      try {
        let afterOrganizationId: string | undefined;
        while (leaseOwned) {
          const policies = await this.findPolicies(now, afterOrganizationId);
          if (policies.length === 0) {
            break;
          }
          for (const policy of policies) {
            if (!leaseOwned) {
              break;
            }
            await this.applyPolicy(policy, now, () => leaseOwned);
            afterOrganizationId = policy.organizationId;
          }
          if (policies.length < BATCH_SIZE) {
            break;
          }
        }
      } finally {
        clearInterval(heartbeat);
        await this.redis.raw.eval(RELEASE_LEASE_SCRIPT, 1, LEASE_KEY, leaseToken);
      }
    } catch (error) {
      this.logger.error("Connect retention job failed", error instanceof Error ? error.stack : undefined);
    }
  }

  private async findPolicies(now: Date, afterOrganizationId?: string): Promise<RetentionPolicy[]> {
    return this.prisma.connectOrganizationSettings.findMany({
      where: {
        retentionEnabledAt: { lte: now },
        OR: [{ messageRetentionDays: { not: null } }, { recordingRetentionDays: { not: null } }],
        ...(afterOrganizationId ? { organizationId: { gt: afterOrganizationId } } : {}),
      },
      select: { organizationId: true, messageRetentionDays: true, recordingRetentionDays: true },
      orderBy: { organizationId: "asc" },
      take: BATCH_SIZE,
    });
  }

  private async applyPolicy(
    policy: RetentionPolicy,
    now: Date,
    ownsLease: () => boolean,
  ): Promise<void> {
    const { organizationId } = policy;
    let messages = 0;
    let posts = 0;
    let recordings = 0;

    if (policy.messageRetentionDays !== null) {
      messages = await this.purgeMessages(organizationId, now, ownsLease);
      posts = await this.purgePosts(organizationId, now, ownsLease);
      await this.purgePostComments(organizationId, now, ownsLease);
    }

    if (policy.recordingRetentionDays !== null && ownsLease()) {
      recordings = await this.purgeRecordings(organizationId, now, ownsLease);
    }

    if (ownsLease() && messages + posts + recordings > 0) {
      await this.audit.record({
        action: "connect.retention.applied",
        organizationId,
        resourceType: "ConnectRetention",
        metadata: { messages, posts, recordings },
      });
    }
  }

  private async purgeMessages(organizationId: string, now: Date, ownsLease: () => boolean): Promise<number> {
    let scrubbed = 0;
    while (ownsLease()) {
      const count = await this.withCurrentPolicy(organizationId, now, async (tx, policy) => {
        if (!policy || policy.messageRetentionDays === null) {
          return null;
        }
        const messages = await tx.message.findMany({
          where: {
            organizationId,
            createdAt: { lt: this.cutoff(now, policy.messageRetentionDays) },
            OR: [
              { content: { not: "" } },
              { contentHtml: { not: null } },
              { isDeleted: false },
              { poll: { isNot: null } },
            ],
          },
          select: { id: true, deletedAt: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: BATCH_SIZE,
        });
        if (messages.length === 0 || !ownsLease()) {
          return messages.length;
        }

        const ids = messages.map(({ id }) => id);
        await tx.poll.deleteMany({ where: { messageId: { in: ids } } });
        const alreadyDeletedIds = messages.filter(({ deletedAt }) => deletedAt !== null).map(({ id }) => id);
        const activeIds = messages.filter(({ deletedAt }) => deletedAt === null).map(({ id }) => id);
        if (alreadyDeletedIds.length > 0) {
          await tx.message.updateMany({
            where: { organizationId, id: { in: alreadyDeletedIds }, deletedAt: { not: null } },
            data: { content: "", contentHtml: null, isDeleted: true },
          });
        }
        if (activeIds.length > 0 && ownsLease()) {
          await tx.message.updateMany({
            where: { organizationId, id: { in: activeIds }, deletedAt: null },
            data: { content: "", contentHtml: null, isDeleted: true, deletedAt: now },
          });
        }
        return messages.length;
      });
      if (count === null || count === 0) {
        break;
      }
      scrubbed += count;
      if (count < BATCH_SIZE) {
        break;
      }
    }
    return scrubbed;
  }

  private async purgePosts(organizationId: string, now: Date, ownsLease: () => boolean): Promise<number> {
    let scrubbed = 0;
    while (ownsLease()) {
      const count = await this.withCurrentPolicy(organizationId, now, async (tx, policy) => {
        if (!policy || policy.messageRetentionDays === null) {
          return null;
        }
        const posts = await tx.post.findMany({
          where: {
            organizationId,
            createdAt: { lt: this.cutoff(now, policy.messageRetentionDays) },
            OR: [
              { title: { not: null } },
              { content: { not: "" } },
              { contentHtml: { not: null } },
              { imageUrl: { not: null } },
              { backgroundImageUrl: { not: null } },
              { backgroundColor: { not: null } },
              { deletedAt: null },
              { poll: { isNot: null } },
            ],
          },
          select: { id: true, deletedAt: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: BATCH_SIZE,
        });
        if (posts.length === 0 || !ownsLease()) {
          return posts.length;
        }

        const ids = posts.map(({ id }) => id);
        await tx.poll.deleteMany({ where: { postId: { in: ids } } });
        const alreadyDeletedIds = posts.filter(({ deletedAt }) => deletedAt !== null).map(({ id }) => id);
        const activeIds = posts.filter(({ deletedAt }) => deletedAt === null).map(({ id }) => id);
        const scrubData = {
          title: null,
          content: "",
          contentHtml: null,
          imageUrl: null,
          backgroundImageUrl: null,
          backgroundColor: null,
        };
        if (alreadyDeletedIds.length > 0) {
          await tx.post.updateMany({
            where: { organizationId, id: { in: alreadyDeletedIds }, deletedAt: { not: null } },
            data: scrubData,
          });
        }
        if (activeIds.length > 0 && ownsLease()) {
          await tx.post.updateMany({
            where: { organizationId, id: { in: activeIds }, deletedAt: null },
            data: { ...scrubData, deletedAt: now },
          });
        }
        return posts.length;
      });
      if (count === null || count === 0) {
        break;
      }
      scrubbed += count;
      if (count < BATCH_SIZE) {
        break;
      }
    }
    return scrubbed;
  }

  private async purgePostComments(organizationId: string, now: Date, ownsLease: () => boolean): Promise<void> {
    while (ownsLease()) {
      const count = await this.withCurrentPolicy(organizationId, now, async (tx, policy) => {
        if (!policy || policy.messageRetentionDays === null) {
          return null;
        }
        const comments = await tx.postComment.findMany({
          where: {
            organizationId,
            post: {
              organizationId,
              createdAt: { lt: this.cutoff(now, policy.messageRetentionDays) },
            },
            OR: [{ content: { not: "" } }, { deletedAt: null }],
          },
          select: { id: true, deletedAt: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: BATCH_SIZE,
        });
        if (comments.length === 0 || !ownsLease()) {
          return comments.length;
        }

        const alreadyDeletedIds = comments.filter(({ deletedAt }) => deletedAt !== null).map(({ id }) => id);
        const activeIds = comments.filter(({ deletedAt }) => deletedAt === null).map(({ id }) => id);
        if (alreadyDeletedIds.length > 0) {
          await tx.postComment.updateMany({
            where: { organizationId, id: { in: alreadyDeletedIds }, deletedAt: { not: null } },
            data: { content: "" },
          });
        }
        if (activeIds.length > 0 && ownsLease()) {
          await tx.postComment.updateMany({
            where: { organizationId, id: { in: activeIds }, deletedAt: null },
            data: { content: "", deletedAt: now },
          });
        }
        return comments.length;
      });
      if (count === null || count === 0 || count < BATCH_SIZE) {
        break;
      }
    }
  }

  private async purgeRecordings(organizationId: string, now: Date, ownsLease: () => boolean): Promise<number> {
    let deleted = 0;
    let afterId: string | undefined;
    while (ownsLease()) {
      const result = await this.withCurrentPolicy(organizationId, now, async (tx, policy) => {
        if (!policy || policy.recordingRetentionDays === null) {
          return null;
        }
        const recordings = await tx.connectCallRecording.findMany({
          where: {
            organizationId,
            createdAt: { lt: this.cutoff(now, policy.recordingRetentionDays) },
            OR: [{ status: { not: "DELETED" } }, { storageUrl: { not: null } }],
            ...(afterId ? { id: { gt: afterId } } : {}),
          },
          select: { id: true, storageUrl: true },
          orderBy: { id: "asc" },
          take: 1,
        });
        const recording = recordings[0];
        if (!recording || !ownsLease()) {
          return { count: 0, afterId, done: true };
        }
        if (recording.storageUrl) {
          const objectKey = this.managedRecordingObjectKey(organizationId, recording.storageUrl);
          if (!objectKey) {
            this.logger.warn(`Skipping unmanaged Connect recording URL for tenant ${organizationId}`);
            return { count: 0, afterId: recording.id, done: false };
          }
          await this.storage.delete(objectKey);
          if (!ownsLease()) {
            return { count: 0, afterId: recording.id, done: false };
          }
          const update = await tx.connectCallRecording.updateMany({
            where: { id: recording.id, organizationId, storageUrl: recording.storageUrl },
            data: { status: "DELETED", storageUrl: null },
          });
          return { count: update.count, afterId: recording.id, done: false };
        }

        const update = await tx.connectCallRecording.updateMany({
          where: {
            id: recording.id,
            organizationId,
            storageUrl: null,
            status: { not: "DELETED" },
          },
          data: { status: "DELETED" },
        });
        return { count: update.count, afterId: recording.id, done: false };
      });
      if (result === null) {
        break;
      }
      afterId = result.afterId;
      deleted += result.count;
      if (result.done) {
        break;
      }
    }
    return deleted;
  }

  private async withCurrentPolicy<T>(
    organizationId: string,
    now: Date,
    operation: (tx: RetentionTransaction, policy: CurrentPolicy | null) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:connect`}, 0))`;
      const settings = await tx.connectOrganizationSettings.findUnique({
        where: { organizationId },
        select: {
          organizationId: true,
          messageRetentionDays: true,
          recordingRetentionDays: true,
          retentionEnabledAt: true,
        },
      });
      const policy = settings && settings.retentionEnabledAt && settings.retentionEnabledAt <= now ? settings : null;
      return operation(tx, policy);
    }, { timeout: 30_000 });
  }

  private cutoff(now: Date, retentionDays: number): Date {
    return new Date(now.getTime() - retentionDays * DAY_MS);
  }

  private managedRecordingObjectKey(organizationId: string, storageUrl: string): string | null {
    const prefix = `${organizationId}/`;
    if (!storageUrl.startsWith(prefix) || storageUrl.includes("\\") || storageUrl.includes("://")) {
      return null;
    }
    const parts = storageUrl.split("/");
    if (parts.some((part) => part.length === 0 || part === "." || part === "..")) {
      return null;
    }
    return storageUrl;
  }
}
