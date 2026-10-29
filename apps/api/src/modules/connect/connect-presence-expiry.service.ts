import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { ConnectService } from "./connect.service";

@Injectable()
export class ConnectPresenceExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectPresenceExpiryService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly connect: ConnectService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.run(), 5_000);
    void this.run();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async run(now = new Date()): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const expired = await this.prisma.connectUserSettings.findMany({
        where: { manualStatusExpiresAt: { lte: now } },
        orderBy: [{ manualStatusExpiresAt: "asc" }, { id: "asc" }],
        take: 100,
        select: { id: true, organizationId: true, userId: true, manualStatusExpiresAt: true },
      });
      for (const settings of expired) {
        try {
          await this.connect.applyPresencePreference(settings.organizationId, settings.userId);
          await this.prisma.connectUserSettings.updateMany({
            where: { id: settings.id, manualStatusExpiresAt: settings.manualStatusExpiresAt },
            data: { manualStatus: null, manualStatusExpiresAt: null },
          });
        } catch (error) {
          this.logger.error(
            `Unable to refresh expired Connect status ${settings.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        "Unable to refresh expired Connect statuses",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}
